exports.up = function (db) {
  return db.runSql(`
    CREATE TABLE IF NOT EXISTS order_products (
      id SERIAL PRIMARY KEY,
      order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
      product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL
    );
  `)
}

exports.down = function (db) {
  return db.runSql('DROP TABLE IF EXISTS order_products CASCADE;')
}
