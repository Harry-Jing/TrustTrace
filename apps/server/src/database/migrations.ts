import type { Database } from "bun:sqlite";

export function ensureColumn(
  sqlite: Database,
  tableName: string,
  columnName: string,
  columnSql: string,
) {
  const rows = sqlite.query(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>;
  if (rows.some((row) => row.name === columnName)) return;
  sqlite.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnSql};`);
}
