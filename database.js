const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'cafeteria.db'));

db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS menu_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    FOREIGN KEY (category_id) REFERENCES menu_categories(id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    total REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    menu_item_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
  );
`);

const categoryCount = db.prepare('SELECT COUNT(*) as count FROM menu_categories').get();

if (categoryCount.count === 0) {
  const insertCategory = db.prepare(
    'INSERT INTO menu_categories (name, description) VALUES (?, ?)'
  );
  const insertItem = db.prepare(
    'INSERT INTO menu_items (category_id, name, description, price) VALUES (?, ?, ?, ?)'
  );

  const bebidasId = insertCategory.run(
    'Bebidas Calientes',
    'Cafés, tés y chocolate caliente'
  ).lastInsertRowid;

  const comidasId = insertCategory.run(
    'Comidas y Postres',
    'Sandwiches, pasteles y snacks'
  ).lastInsertRowid;

  const bebidas = [
    ['Espresso', 'Café concentrado y aromático', 2.50],
    ['Cappuccino', 'Espresso con leche espumosa', 3.50],
    ['Latte', 'Espresso suave con leche vaporizada', 3.80],
    ['Americano', 'Espresso diluido con agua caliente', 2.80],
    ['Té Verde', 'Té natural antioxidante', 2.20],
    ['Chocolate Caliente', 'Chocolate belga cremoso', 3.20]
  ];

  const comidas = [
    ['Croissant', 'Crujiente mantequilla francesa', 2.80],
    ['Sandwich Club', 'Pollo, bacon, lechuga y tomate', 5.50],
    ['Ensalada César', 'Lechuga, crutones y parmesano', 4.90],
    ['Cheesecake', 'Tarta de queso casera', 4.20],
    ['Brownie', 'Chocolate intenso con nueces', 3.50],
    ['Muffin de Arándanos', 'Horneado fresco del día', 2.90]
  ];

  bebidas.forEach(([name, desc, price]) => {
    insertItem.run(bebidasId, name, desc, price);
  });

  comidas.forEach(([name, desc, price]) => {
    insertItem.run(comidasId, name, desc, price);
  });
}

module.exports = db;
