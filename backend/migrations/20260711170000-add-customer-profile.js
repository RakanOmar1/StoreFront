module.exports = {
  up: async (queryInterface) => queryInterface.sequelize.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS address VARCHAR(500), ADD COLUMN IF NOT EXISTS city VARCHAR(120), ADD COLUMN IF NOT EXISTS avatar_url TEXT;`),
  down: async (queryInterface) => queryInterface.sequelize.query(`ALTER TABLE users DROP COLUMN IF EXISTS avatar_url, DROP COLUMN IF EXISTS city, DROP COLUMN IF EXISTS address;`)
}
