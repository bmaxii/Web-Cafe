# Café Aroma — Página web de cafetería

Aplicación web sencilla con registro/login de usuarios, dos menús de compra y base de datos relacional SQLite.

## Requisitos

- [Node.js](https://nodejs.org/) 18 o superior

## Instalación

```bash
npm install
```

## Ejecutar

```bash
npm start
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Funcionalidades

- **Registro e inicio de sesión** de usuarios (contraseñas encriptadas con bcrypt)
- **Dos menús**: Bebidas Calientes y Comidas y Postres
- **Compras** registradas en base de datos relacional SQLite
- **Historial de pedidos** por usuario

## Base de datos

SQLite con las siguientes tablas relacionales:

| Tabla | Descripción |
|-------|-------------|
| `users` | Usuarios registrados |
| `menu_categories` | Categorías de menú (2 menús) |
| `menu_items` | Productos de cada menú |
| `orders` | Pedidos realizados |
| `order_items` | Detalle de cada pedido |

La base de datos se crea automáticamente al iniciar el servidor (`cafeteria.db`).

## Estructura

```
├── server.js       # Servidor Express y API REST
├── database.js     # Configuración SQLite y datos iniciales
├── public/         # Frontend (HTML, CSS, JS)
└── package.json
```
