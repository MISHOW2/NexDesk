CREATE INDEX IF NOT EXISTS tickets_created_by_idx ON tickets (created_by);
CREATE INDEX IF NOT EXISTS tickets_status_idx ON tickets (status);
CREATE INDEX IF NOT EXISTS tickets_assigned_to_idx ON tickets (assigned_to);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tickets_created_by_users_fkey'
      AND conrelid = 'tickets'::regclass
  ) THEN
    ALTER TABLE tickets
      ADD CONSTRAINT tickets_created_by_users_fkey
      FOREIGN KEY (created_by) REFERENCES users (user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tickets_assigned_to_users_fkey'
      AND conrelid = 'tickets'::regclass
  ) THEN
    ALTER TABLE tickets
      ADD CONSTRAINT tickets_assigned_to_users_fkey
      FOREIGN KEY (assigned_to) REFERENCES users (user_id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tickets_status_check'
      AND conrelid = 'tickets'::regclass
  ) THEN
    ALTER TABLE tickets
      ADD CONSTRAINT tickets_status_check
      CHECK (status IN ('open', 'in_progress', 'resolved', 'closed'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tickets_priority_check'
      AND conrelid = 'tickets'::regclass
  ) THEN
    ALTER TABLE tickets
      ADD CONSTRAINT tickets_priority_check
      CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS ticket_status_history (
  history_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets (ticket_id) ON DELETE CASCADE,
  changed_by INTEGER NOT NULL REFERENCES users (user_id),
  previous_status TEXT NOT NULL CHECK (previous_status IN ('open', 'in_progress', 'resolved', 'closed')),
  new_status TEXT NOT NULL CHECK (new_status IN ('open', 'in_progress', 'resolved', 'closed')),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ticket_status_history_ticket_idx
  ON ticket_status_history (ticket_id, changed_at DESC);
