exports.up = function (db) {
  return db.runSql(`
    ALTER TABLE products
      ADD COLUMN IF NOT EXISTS images JSONB NOT NULL DEFAULT '[]'::jsonb;
  `)
}

exports.down = function (db) {
  return db.runSql(`
    ALTER TABLE products
      DROP COLUMN IF EXISTS images;
  `)
}
