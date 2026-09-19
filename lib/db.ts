import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { METRIC_IDS } from "./metrics";

/**
 * SQLite local, sem ORM. O volume e minusculo (um registo por dia) e todas as
 * vistas precisam do conjunto completo, por isso SQL direto chega e sobra.
 *
 * O ficheiro vive em DATABASE_FILE (por omissao ./data/medidas.db) e esta no
 * .gitignore: sao dados pessoais, nunca entram no repositorio.
 */
const DB_FILE =
  process.env.DATABASE_FILE ?? path.join(process.cwd(), "data", "medidas.db");

// As colunas das metricas sao geradas a partir de METRICS para que acrescentar
// uma metrica seja uma alteracao num unico ficheiro.
const METRIC_COLUMNS = METRIC_IDS.map((id) => `"${id}" REAL`).join(",\n    ");

function create(): Database.Database {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  const db = new Database(DB_FILE);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS entries (
      date TEXT PRIMARY KEY,
      ${METRIC_COLUMNS},
      nota TEXT,
      updated_at TEXT NOT NULL
    );
  `);

  // Migracao leve: acrescenta colunas de metricas novas a bases ja existentes.
  const existing = new Set(
    (db.prepare(`PRAGMA table_info(entries)`).all() as { name: string }[]).map(
      (c) => c.name,
    ),
  );
  for (const id of METRIC_IDS) {
    if (!existing.has(id)) {
      db.exec(`ALTER TABLE entries ADD COLUMN "${id}" REAL`);
    }
  }

  return db;
}

// Em dev o Next recarrega os modulos a cada alteracao; sem isto abririamos uma
// ligacao nova por recarregamento ate esgotar os descritores.
const globalForDb = globalThis as unknown as { __medidasDb?: Database.Database };

export const db: Database.Database = globalForDb.__medidasDb ?? create();

if (process.env.NODE_ENV !== "production") {
  globalForDb.__medidasDb = db;
}
