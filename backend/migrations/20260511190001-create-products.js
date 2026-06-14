exports.up = function (db) {
  return db.runSql(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      price INTEGER NOT NULL,
      category VARCHAR(100)
    );
  `)
}

exports.down = function (db) {
  return db.runSql('DROP TABLE IF EXISTS products CASCADE;')
}
