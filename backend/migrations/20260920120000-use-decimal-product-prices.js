exports.up = function (db) {
  return db.runSql(`
    ALTER TABLE products
      ALTER COLUMN price TYPE NUMERIC(10, 2)
      USING price::NUMERIC(10, 2);
  `)
}

exports.down = function (db) {
  return db.runSql(`
    ALTER TABLE products
      ALTER COLUMN price TYPE INTEGER
      USING ROUND(price)::INTEGER;
  `)
}
