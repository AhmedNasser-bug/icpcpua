import { randomUUID } from "node:crypto"
import { FieldPath } from "firebase-admin/firestore"

type Data = Record<string, unknown>
type Filter = { field: string; op: string; value: unknown }
type Order = { field: string; direction: "asc" | "desc" }

export interface FakeSnapshot {
  id: string
  exists: boolean
  data: () => Data | undefined
}

interface FakeDocRef {
  __kind: "doc"
  collectionName: string
  id: string
  get: () => Promise<FakeSnapshot>
  set: (data: Data, options?: { merge?: boolean }) => Promise<void>
  update: (data: Data) => Promise<void>
  delete: () => Promise<void>
}

interface FakeQuery {
  __kind: "query"
  collectionName: string
  filters: Filter[]
  orders: Order[]
  offsetCount: number
  limitCount: number | null
  startAfterId: string | null
  where: (field: string, op: string, value: unknown) => FakeQuery
  orderBy: (field: string | FieldPath, direction?: "asc" | "desc") => FakeQuery
  offset: (count: number) => FakeQuery
  limit: (count: number) => FakeQuery
  startAfter: (cursor: string) => FakeQuery
  get: () => Promise<{ empty: boolean; docs: FakeSnapshot[] }>
  count: () => { get: () => Promise<{ data: () => { count: number } }> }
}

export class FakeFirestore {
  private collections = new Map<string, Map<string, Data>>()

  private store(collectionName: string): Map<string, Data> {
    let collection = this.collections.get(collectionName)
    if (!collection) {
      collection = new Map()
      this.collections.set(collectionName, collection)
    }
    return collection
  }

  seed(collectionName: string, id: string, data: Data): void {
    this.store(collectionName).set(id, { ...data })
  }

  read(collectionName: string, id: string): Data | undefined {
    return this.store(collectionName).get(id)
  }

  has(collectionName: string, id: string): boolean {
    return this.store(collectionName).has(id)
  }

  collection(
    collectionName: string
  ): FakeQuery & { doc: (id?: string) => FakeDocRef; add: (data: Data) => Promise<FakeDocRef> } {
    const query = this.makeQuery(collectionName, [], [], 0, null, null)
    const makeDoc = (id: string): FakeDocRef => ({
      __kind: "doc",
      collectionName,
      id,
      get: async () => this.snapshot(collectionName, id),
      set: async (data, options) => {
        const collection = this.store(collectionName)
        const existing = options?.merge ? collection.get(id) : undefined
        collection.set(id, { ...(existing ?? {}), ...data })
      },
      update: async (data) => {
        const collection = this.store(collectionName)
        const existing = collection.get(id)
        if (!existing) throw new Error(`Document ${collectionName}/${id} not found`)
        collection.set(id, { ...existing, ...data })
      },
      delete: async () => {
        this.store(collectionName).delete(id)
      },
    })
    return Object.assign(query, {
      doc: (id?: string): FakeDocRef => makeDoc(id ?? randomUUID()),
      add: async (data: Data): Promise<FakeDocRef> => {
        const ref = makeDoc(randomUUID())
        await ref.set(data)
        return ref
      },
    })
  }

  private snapshot(collectionName: string, id: string): FakeSnapshot {
    const data = this.store(collectionName).get(id)
    return {
      id,
      exists: data !== undefined,
      data: () => (data ? { ...data } : undefined),
    }
  }

  private makeQuery(
    collectionName: string,
    filters: Filter[],
    orders: Order[],
    offsetCount: number,
    limitCount: number | null,
    startAfterId: string | null
  ): FakeQuery {
    const makeQuery = this.makeQuery.bind(this)
    const matchingSnapshots = this.matchingSnapshots.bind(this)
    return {
      __kind: "query",
      collectionName,
      filters,
      orders,
      offsetCount,
      limitCount,
      startAfterId,
      where: (field, op, value) =>
        makeQuery(
          collectionName,
          [...filters, { field, op, value }],
          orders,
          offsetCount,
          limitCount,
          startAfterId
        ),
      orderBy: (field, direction = "asc") =>
        makeQuery(
          collectionName,
          filters,
          [...orders, { field: fieldName(field), direction }],
          offsetCount,
          limitCount,
          startAfterId
        ),
      offset: (count) =>
        makeQuery(collectionName, filters, orders, count, limitCount, startAfterId),
      limit: (count) =>
        makeQuery(collectionName, filters, orders, offsetCount, count, startAfterId),
      startAfter: (cursor) =>
        makeQuery(collectionName, filters, orders, offsetCount, limitCount, cursor),
      get: async () => {
        let matching = matchingSnapshots(collectionName, filters, orders)
        if (startAfterId) {
          const index = matching.findIndex((snapshot) => snapshot.id === startAfterId)
          matching = index === -1 ? matching : matching.slice(index + 1)
        }
        const docs = matching.slice(
          offsetCount,
          limitCount === null ? undefined : offsetCount + limitCount
        )
        return { empty: docs.length === 0, docs }
      },
      count: () => ({
        get: async () => ({
          data: () => ({
            count: matchingSnapshots(collectionName, filters, orders).length,
          }),
        }),
      }),
    }
  }

  private matchingSnapshots(
    collectionName: string,
    filters: Filter[],
    orders: Order[]
  ): FakeSnapshot[] {
    const entries = [...this.store(collectionName).entries()]
    const filtered = entries.filter(([, data]) =>
      filters.every((filter) => matches(data, filter))
    )

    filtered.sort(([leftId, left], [rightId, right]) => {
      for (const order of orders) {
        if (order.field === "__name__") {
          const comparison = leftId.localeCompare(rightId)
          if (comparison !== 0) return order.direction === "asc" ? comparison : -comparison
          continue
        }

        const leftValue = left[order.field]
        const rightValue = right[order.field]
        const comparison = compareValues(leftValue, rightValue)
        if (comparison !== 0) return order.direction === "asc" ? comparison : -comparison
      }
      return 0
    })

    return filtered.map(([id]) => this.snapshot(collectionName, id))
  }

  async runTransaction<T>(callback: (transaction: FakeTransaction) => Promise<T>): Promise<T> {
    const transaction = new FakeTransaction(this)
    const result = await callback(transaction)
    transaction.commit()
    return result
  }
}

function fieldName(field: string | FieldPath): string {
  if (typeof field === "string") return field
  const segments = (field as unknown as { segments: string[] }).segments
  return segments[segments.length - 1] ?? "__name__"
}

function compareValues(left: unknown, right: unknown): number {
  if (typeof left === "number" && typeof right === "number") return left - right
  if (typeof left === "string" && typeof right === "string") return left.localeCompare(right)
  return String(left ?? "").localeCompare(String(right ?? ""))
}

function matches(data: Data, filter: Filter): boolean {
  const value = data[filter.field]
  switch (filter.op) {
    case "==":
      return value === filter.value
    case ">":
      return compareValues(value, filter.value) > 0
    case ">=":
      return compareValues(value, filter.value) >= 0
    case "<":
      return compareValues(value, filter.value) < 0
    case "<=":
      return compareValues(value, filter.value) <= 0
    default:
      return false
  }
}

type PendingWrite =
  | { kind: "set"; collectionName: string; id: string; data: Data; merge: boolean }
  | { kind: "update"; collectionName: string; id: string; data: Data }
  | { kind: "delete"; collectionName: string; id: string }

class FakeTransaction {
  private pending: PendingWrite[] = []

  constructor(private readonly db: FakeFirestore) {}

  async get(ref: FakeDocRef): Promise<FakeSnapshot> {
    return ref.get()
  }

  set(ref: FakeDocRef, data: Data, options?: { merge?: boolean }): void {
    this.pending.push({
      kind: "set",
      collectionName: ref.collectionName,
      id: ref.id,
      data,
      merge: options?.merge === true,
    })
  }

  update(ref: FakeDocRef, data: Data): void {
    this.pending.push({
      kind: "update",
      collectionName: ref.collectionName,
      id: ref.id,
      data,
    })
  }

  delete(ref: FakeDocRef): void {
    this.pending.push({ kind: "delete", collectionName: ref.collectionName, id: ref.id })
  }

  commit(): void {
    for (const write of this.pending) {
      if (write.kind === "delete") {
        ;(this.db as unknown as { store: (name: string) => Map<string, Data> })
          .store(write.collectionName)
          .delete(write.id)
      } else if (write.kind === "set") {
        const collection = (
          this.db as unknown as { store: (name: string) => Map<string, Data> }
        ).store(write.collectionName)
        const existing = write.merge ? collection.get(write.id) : undefined
        collection.set(write.id, { ...(existing ?? {}), ...write.data })
      } else {
        const collection = (
          this.db as unknown as { store: (name: string) => Map<string, Data> }
        ).store(write.collectionName)
        const existing = collection.get(write.id)
        if (!existing) throw new Error(`Document ${write.collectionName}/${write.id} not found`)
        collection.set(write.id, { ...existing, ...write.data })
      }
    }
  }
}
