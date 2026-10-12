/** Extract a human-readable message from an unknown thrown value. */
export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback
}
