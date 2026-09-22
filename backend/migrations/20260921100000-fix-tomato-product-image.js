const brokenImage =
  'https://images.unsplash.com/photo-1546470427-e5ac89cd0b31?auto=format&fit=crop&w=900&q=80'
const replacementImage =
  'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=900&q=80'

exports.up = function (db) {
  return db.runSql(
    `UPDATE products
     SET url = $1, updated_at = NOW()
     WHERE url = $2`,
    [replacementImage, brokenImage]
  )
}

exports.down = function (db) {
  return db.runSql(
    `UPDATE products
     SET url = $1, updated_at = NOW()
     WHERE url = $2`,
    [brokenImage, replacementImage]
  )
}
