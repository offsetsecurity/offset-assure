-- The other half of each link: nine link tables were looked up and deleted
-- from by their second column (a control or a risk) with no index, so every
-- such lookup scanned the whole table. The first column is already covered by
-- the primary key.
create index if not exists risk_controls_control_idx on risk_controls (control_id);
create index if not exists vendor_controls_control_idx on vendor_controls (control_id);
create index if not exists vendor_risks_risk_idx on vendor_risks (risk_id);
create index if not exists training_controls_control_idx on training_controls (control_id);
create index if not exists objective_controls_control_idx on objective_controls (control_id);
create index if not exists objective_risks_risk_idx on objective_risks (risk_id);
create index if not exists party_controls_control_idx on party_controls (control_id);
create index if not exists review_controls_control_idx on review_controls (control_id);
create index if not exists communication_controls_control_idx on communication_controls (control_id);
