exports.up = function (db) {
  return db.runSql(`
    ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS delivery_latitude DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS delivery_longitude DOUBLE PRECISION;
  `)
}

exports.down = function (db) {
  return db.runSql(`
    ALTER TABLE orders
      DROP COLUMN IF EXISTS delivery_longitude,
      DROP COLUMN IF EXISTS delivery_latitude;
  `)
}
