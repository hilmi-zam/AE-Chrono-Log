-- schema.sql — Æ Chrono Log
-- Sumber: DDL asli dari konsol D1, tanggal 2026-10-23.
-- Query: SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name IN ('transactions', 'notes');
-- Jangan mengubah kolom tanpa rencana tertulis, backup, dan persetujuan pengguna (lihat PROJECT_RULES.md §7).

-- Tabel: transactions
CREATE TABLE transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount INTEGER NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL,
  transaction_date TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabel: notes
CREATE TABLE notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  note_date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
