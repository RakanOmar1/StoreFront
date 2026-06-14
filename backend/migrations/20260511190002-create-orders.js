exports.up = function (db) {
  return db.runSql(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
      status VARCHAR(20) NOT NULL
    );
  `)
}

exports.down = function (db) {
  return db.runSql('DROP TABLE IF EXISTS orders CASCADE;')
}
