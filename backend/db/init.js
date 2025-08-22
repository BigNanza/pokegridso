// db/init.js
const sqlite3 = require("sqlite3").verbose();

function initializeDatabase() {
  const db = new sqlite3.Database("./game.db");

  db.serialize(() => {
    // Updated users table to include picture field
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      firebase_uid TEXT UNIQUE,
      picture TEXT,
      is_guest INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  });

  return db;
}

module.exports = { initializeDatabase };
