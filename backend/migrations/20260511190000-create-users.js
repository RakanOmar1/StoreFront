exports.up = function (db) {
  return db.runSql(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      firstname VARCHAR(100) NOT NULL,
      lastname VARCHAR(100) NOT NULL,
      password_digest TEXT NOT NULL
    );
  `)
}

exports.down = function (db) {
  return db.runSql('DROP TABLE IF EXISTS users CASCADE;')
}
