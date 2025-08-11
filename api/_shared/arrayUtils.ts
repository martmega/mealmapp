export function asTextArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}

export function as2DTextArray(value: unknown): string[][] {
  if (!Array.isArray(value)) return [];
  return value.map((row) =>
    Array.isArray(row)
      ? row.filter((v): v is string => typeof v === 'string')
      : []
  );
}
