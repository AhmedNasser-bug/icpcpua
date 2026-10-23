export class RequestBodyError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "RequestBodyError"
    this.status = status
  }
}

const DEFAULT_MAX_BODY_BYTES = 64 * 1024

export async function readJsonBody(
  request: Request,
  maxBytes = DEFAULT_MAX_BODY_BYTES
): Promise<unknown> {
  const text = await request.text()
  if (Buffer.byteLength(text, "utf8") > maxBytes) {
    throw new RequestBodyError(413, "Request body is too large.")
  }

  if (!text.trim()) return {}

  try {
    return JSON.parse(text)
  } catch {
    throw new RequestBodyError(400, "Request body must be valid JSON.")
  }
}

export function asObject(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}
