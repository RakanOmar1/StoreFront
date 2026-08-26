/* eslint-disable camelcase */

exports.up = async db => {
  await db.runSql(`
    ALTER TYPE promotion_type ADD VALUE IF NOT EXISTS 'BUNDLE';

    ALTER TABLE promotions
      ADD COLUMN IF NOT EXISTS bundle_quantity INTEGER,
      ADD COLUMN IF NOT EXISTS bundle_price NUMERIC(10, 2);
  `);
};

exports.down = async db => {
  await db.runSql(`
    ALTER TABLE promotions
      DROP COLUMN IF EXISTS bundle_quantity,
      DROP COLUMN IF EXISTS bundle_price;
  `);
};
