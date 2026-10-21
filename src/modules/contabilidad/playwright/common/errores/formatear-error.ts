export function formatearError(error: unknown): string {
  const partes: string[] = [];
  let actual: unknown = error;

  while (actual !== undefined && actual !== null) {
    partes.push(actual instanceof Error ? (actual.stack ?? actual.message) : String(actual));

    actual = actual instanceof Error ? actual.cause : undefined;
  }

  return partes.join('\n\nCausado por:\n');
}
