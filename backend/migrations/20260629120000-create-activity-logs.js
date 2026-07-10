exports.up = function (db) {
  return db.runSql(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id SERIAL PRIMARY KEY,
      entity_type VARCHAR(50) NOT NULL,
      record_id VARCHAR(80) NOT NULL,
      event_type VARCHAR(30) NOT NULL,
      message TEXT,
      field_name VARCHAR(100),
      old_value TEXT,
      new_value TEXT,
      metadata JSONB,
      created_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS activity_logs_record_idx ON activity_logs(entity_type, record_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS activity_logs_actor_idx ON activity_logs(created_by_user_id);
    CREATE INDEX IF NOT EXISTS activity_logs_event_idx ON activity_logs(event_type);
  `)
}

exports.down = function (db) {
  return db.runSql(`
    DROP INDEX IF EXISTS activity_logs_record_idx;
    DROP INDEX IF EXISTS activity_logs_actor_idx;
    DROP INDEX IF EXISTS activity_logs_event_idx;
    DROP TABLE IF EXISTS activity_logs;
  `)
}
