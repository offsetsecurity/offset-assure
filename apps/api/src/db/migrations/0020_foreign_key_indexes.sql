-- Indexes for two links that had none, so deleting a risk or a person, and
-- looking up what they touched, does not scan the whole table as it grows.
create index if not exists tasks_risk_id on tasks (risk_id);
create index if not exists audit_log_actor_id on audit_log (actor_id);
