'use strict'

exports.up = function (db, callback) {
  db.runSql(`
    CREATE TABLE IF NOT EXISTS brands (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL UNIQUE,
      description TEXT,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    ALTER TABLE products ADD COLUMN IF NOT EXISTS brand_id BIGINT REFERENCES brands(id) ON DELETE RESTRICT;
    CREATE INDEX IF NOT EXISTS products_brand_id_idx ON products(brand_id);
  `, callback)
}

exports.down = function (db, callback) {
  db.runSql('ALTER TABLE products DROP COLUMN IF EXISTS brand_id; DROP TABLE IF EXISTS brands;', callback)
}
