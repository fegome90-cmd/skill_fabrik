// ❌ ESTE DEBE GENERAR BLOCK (TRUNCATE sin contexto seguro)
export async function dangerousMigration() {
  return `TRUNCATE TABLE users;`;
}

// ❌ ESTE DEBE GENERAR BLOCK (DROP sin contexto seguro)
export async function dropTableMigration() {
  return `DROP TABLE users;`;
}
