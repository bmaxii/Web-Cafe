const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    secret: 'cafeteria-secreto-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
  })
);

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Debes iniciar sesión' });
  }
  next();
}

app.post('/api/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  const existing = db
    .prepare('SELECT id FROM users WHERE username = ? OR email = ?')
    .get(username, email);

  if (existing) {
    return res.status(409).json({ error: 'El usuario o email ya existe' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);

  const result = db
    .prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)')
    .run(username, email, passwordHash);

  req.session.userId = result.lastInsertRowid;
  req.session.username = username;

  res.status(201).json({
    message: 'Registro exitoso',
    user: { id: result.lastInsertRowid, username }
  });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son obligatorios' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  }

  req.session.userId = user.id;
  req.session.username = user.username;

  res.json({
    message: 'Inicio de sesión exitoso',
    user: { id: user.id, username: user.username }
  });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Sesión cerrada' });
  });
});

app.get('/api/me', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  res.json({ user: { id: req.session.userId, username: req.session.username } });
});

app.get('/api/menus', (req, res) => {
  const categories = db.prepare('SELECT * FROM menu_categories ORDER BY id').all();

  const items = db.prepare('SELECT * FROM menu_items ORDER BY category_id, id').all();

  const menus = categories.map((cat) => ({
    ...cat,
    items: items.filter((item) => item.category_id === cat.id)
  }));

  res.json(menus);
});

app.post('/api/purchase', requireAuth, (req, res) => {
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Debes seleccionar al menos un producto' });
  }

  const getItem = db.prepare('SELECT * FROM menu_items WHERE id = ?');
  let total = 0;
  const orderItems = [];

  for (const { menuItemId, quantity } of items) {
    const qty = parseInt(quantity, 10);
    if (!menuItemId || !qty || qty < 1) continue;

    const menuItem = getItem.get(menuItemId);
    if (!menuItem) {
      return res.status(400).json({ error: `Producto no encontrado: ${menuItemId}` });
    }

    const subtotal = menuItem.price * qty;
    total += subtotal;
    orderItems.push({ menuItem, quantity: qty, unitPrice: menuItem.price });
  }

  if (orderItems.length === 0) {
    return res.status(400).json({ error: 'No hay productos válidos en la compra' });
  }

  const createOrder = db.transaction(() => {
    const orderResult = db
      .prepare('INSERT INTO orders (user_id, total) VALUES (?, ?)')
      .run(req.session.userId, total);

    const insertOrderItem = db.prepare(
      'INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price) VALUES (?, ?, ?, ?)'
    );

    orderItems.forEach(({ menuItem, quantity, unitPrice }) => {
      insertOrderItem.run(orderResult.lastInsertRowid, menuItem.id, quantity, unitPrice);
    });

    return orderResult.lastInsertRowid;
  });

  const orderId = createOrder();

  res.status(201).json({
    message: 'Compra registrada exitosamente',
    order: { id: orderId, total: total.toFixed(2) }
  });
});

app.get('/api/orders', requireAuth, (req, res) => {
  const orders = db
    .prepare(
      `SELECT o.id, o.total, o.created_at
       FROM orders o
       WHERE o.user_id = ?
       ORDER BY o.created_at DESC`
    )
    .all(req.session.userId);

  const getItems = db.prepare(
    `SELECT oi.quantity, oi.unit_price, mi.name
     FROM order_items oi
     JOIN menu_items mi ON mi.id = oi.menu_item_id
     WHERE oi.order_id = ?`
  );

  const ordersWithItems = orders.map((order) => ({
    ...order,
    items: getItems.all(order.id)
  }));

  res.json(ordersWithItems);
});

app.listen(PORT, () => {
  console.log(`☕ Cafetería corriendo en http://localhost:${PORT}`);
});
