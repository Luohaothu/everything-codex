/**
 * Simple Express-like app for testing.
 * Contains intentional issues for coding standards review.
 */

// ISSUE: any type usage (intentional for TypeScript rules testing)
export function handleRequest(req: any, res: any): void {
  const userId = req.query.id;

  // ISSUE: no input validation (intentional for security testing)
  const data = getUserById(userId);

  res.json(data);
}

// ISSUE: inconsistent error handling (intentional for coding standards testing)
export function getUserById(id: string): Record<string, unknown> | null {
  if (!id) {
    return null;
  }
  return { id, name: "Test User", email: "test@example.com" };
}

// ISSUE: no type safety on return (intentional for testing)
export function parseConfig(raw: string) {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

// ISSUE: mutation of input parameter (intentional for pattern testing)
export function addTimestamp(obj: Record<string, unknown>): Record<string, unknown> {
  obj.timestamp = Date.now();
  return obj;
}
