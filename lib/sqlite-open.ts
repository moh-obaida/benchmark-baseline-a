import fs from "fs";
import path from "path";
import { createRequire } from "node:module";

type SqlValue = string | number | bigint | null;

export type SqliteStatement = {
  run(...params: SqlValue[]): { changes: number; lastInsertRowid: number };
  get(...params: SqlValue[]): Record<string, unknown> | undefined;
  all(...params: SqlValue[]): Array<Record<string, unknown>>;
};

export type SqliteDatabase = {
  exec(sql: string): void;
  prepare(sql: string): SqliteStatement;
};

type SqlJsStatement = {
  bind(values?: unknown[]): boolean;
  step(): boolean;
  getAsObject(): Record<string, unknown>;
  free(): void;
};

type SqlJsDatabase = {
  prepare(sql: string): SqlJsStatement;
  exec(sql: string): void;
  export(): Uint8Array;
  getRowsModified(): number;
};

type SqlJsStatic = {
  Database: new (data?: Uint8Array) => SqlJsDatabase;
};

const nodeRequire = createRequire(path.join(process.cwd(), "package.json"));

function tryNative(filename: string): SqliteDatabase | null {
  try {
    const loaded = nodeRequire("node:sqlite") as {
      DatabaseSync: new (file: string) => SqliteDatabase;
    };
    return new loaded.DatabaseSync(filename);
  } catch {
    return null;
  }
}

let SqlJs: SqlJsStatic | null = null;

if (!tryNative(":memory:")) {
  const init = nodeRequire("sql.js/dist/sql-asm.js") as () => Promise<SqlJsStatic>;
  SqlJs = await init();
}

function bindValues(params: SqlValue[]) {
  return params.map((value) => (typeof value === "bigint" ? Number(value) : value));
}

function openSqlJs(filename: string): SqliteDatabase {
  if (!SqlJs) throw new Error("تعذر تجهيز قاعدة البيانات.");
  const existing = fs.existsSync(filename) ? fs.readFileSync(filename) : null;
  const db = existing && existing.length ? new SqlJs.Database(new Uint8Array(existing)) : new SqlJs.Database();
  const persist = () => {
    fs.writeFileSync(filename, Buffer.from(db.export()));
  };
  return {
    exec(sql: string) {
      db.exec(sql);
      persist();
    },
    prepare(sql: string): SqliteStatement {
      return {
        all(...params: SqlValue[]) {
          const statement = db.prepare(sql);
          const values = bindValues(params);
          if (values.length) statement.bind(values);
          const rows: Array<Record<string, unknown>> = [];
          while (statement.step()) rows.push({ ...statement.getAsObject() });
          statement.free();
          return rows;
        },
        get(...params: SqlValue[]) {
          return this.all(...params)[0];
        },
        run(...params: SqlValue[]) {
          const statement = db.prepare(sql);
          const values = bindValues(params);
          if (values.length) statement.bind(values);
          statement.step();
          statement.free();
          const changes = db.getRowsModified();
          persist();
          return { changes, lastInsertRowid: 0 };
        },
      };
    },
  };
}

export function openSqlite(filename: string): SqliteDatabase {
  return tryNative(filename) ?? openSqlJs(filename);
}
