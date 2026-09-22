exports.up = function (db) {
  return db.runSql(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
  `)
}

exports.down = function (db) {
  return db.runSql(`
    ALTER TABLE users
      DROP COLUMN IF EXISTS longitude,
      DROP COLUMN IF EXISTS latitude;
  `)
}
