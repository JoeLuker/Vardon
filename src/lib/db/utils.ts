export function parseRow<T>(row: Partial<T> | {} | null | undefined): T | null {
    return row && Object.keys(row).length > 0 ? (row as T) : null;
  }
  