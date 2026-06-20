import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'inventory.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  _db.pragma('synchronous = NORMAL');

  initSchema(_db);
  seedIfEmpty(_db);

  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      price REAL NOT NULL DEFAULT 0,
      quantity INTEGER NOT NULL DEFAULT 0,
      reserved INTEGER NOT NULL DEFAULT 0,
      category TEXT NOT NULL DEFAULT 'General',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'reserved',
      customer_name TEXT NOT NULL DEFAULT 'Anonymous',
      total_price REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_orders_product_id ON orders(product_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
  `);
}

function seedIfEmpty(db: Database.Database) {
  const count = (db.prepare('SELECT COUNT(*) as c FROM products').get() as { c: number }).c;
  if (count > 0) return;

  const products = [
    { id: uuidv4(), name: 'Sony WH-1000XM5 Headphones', sku: 'SNY-WH1000XM5', price: 349.99, quantity: 25, category: 'Electronics' },
    { id: uuidv4(), name: 'Apple iPad Pro 12.9"', sku: 'APL-IPADPRO12', price: 1099.00, quantity: 15, category: 'Electronics' },
    { id: uuidv4(), name: 'Samsung 65" QLED TV', sku: 'SMS-QLED65', price: 1299.99, quantity: 8, category: 'Electronics' },
    { id: uuidv4(), name: 'Nike Air Max 270', sku: 'NKE-AM270-10', price: 149.99, quantity: 50, category: 'Footwear' },
    { id: uuidv4(), name: 'Adidas Ultraboost 22', sku: 'ADI-UB22-9', price: 189.99, quantity: 35, category: 'Footwear' },
    { id: uuidv4(), name: "Levi's 501 Original Jeans", sku: 'LVS-501-32', price: 79.99, quantity: 60, category: 'Apparel' },
    { id: uuidv4(), name: 'Instant Pot Duo 7-in-1', sku: 'IP-DUO7-6QT', price: 99.95, quantity: 20, category: 'Kitchen' },
    { id: uuidv4(), name: 'Dyson V15 Vacuum', sku: 'DYS-V15-DETECT', price: 749.99, quantity: 12, category: 'Home' },
    { id: uuidv4(), name: 'Kindle Paperwhite 5', sku: 'AMZ-KPW5-8G', price: 139.99, quantity: 5, category: 'Electronics' },
    { id: uuidv4(), name: 'Logitech MX Master 3S', sku: 'LGT-MXM3S-BLK', price: 99.99, quantity: 3, category: 'Electronics' },
  ];

  const insertProduct = db.prepare(`
    INSERT INTO products (id, name, sku, price, quantity, category)
    VALUES (@id, @name, @sku, @price, @quantity, @category)
  `);

  const insertLog = db.prepare(`
    INSERT INTO audit_logs (id, action, entity_type, entity_id, details)
    VALUES (@id, @action, @entity_type, @entity_id, @details)
  `);

  const seedAll = db.transaction(() => {
    for (const p of products) {
      insertProduct.run(p);
      insertLog.run({
        id: uuidv4(),
        action: 'PRODUCT_CREATED',
        entity_type: 'product',
        entity_id: p.id,
        details: JSON.stringify({ name: p.name, sku: p.sku, quantity: p.quantity }),
      });
    }
  });

  seedAll();
}
