exports.up = function (db) {
  return db.runSql(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS address VARCHAR(500),
      ADD COLUMN IF NOT EXISTS city VARCHAR(120),
      ADD COLUMN IF NOT EXISTS avatar_url TEXT;
  `)
}

exports.down = function (db) {
  return db.runSql(`
    ALTER TABLE users
      DROP COLUMN IF EXISTS avatar_url,
      DROP COLUMN IF EXISTS city,
      DROP COLUMN IF EXISTS address;
  `)
}
