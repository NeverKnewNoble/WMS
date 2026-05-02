-- Adds the bits of docs/database.md that Prisma can't express:
--   §6  partial / GIN indexes for fast search and low-stock filters
--   §7  CHECK constraints (kind/direction encoded into one constraint)
--   §8  triggers that keep items.current_stock in sync with movement items
--   §9  read-side views the UI consumes
--  §11  partial index on notifications(user_id, created_at) for unread

-- ────────────────────────────────────────────────────────────────────
-- §6 Items — search + reorder partial indexes
-- ────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS "idx_items_alive"
  ON "items" ("deleted_at")
  WHERE "deleted_at" IS NULL;

CREATE INDEX IF NOT EXISTS "idx_items_name_trgm"
  ON "items" USING gin ("name" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "idx_items_low_stock"
  ON "items" ("current_stock")
  WHERE "deleted_at" IS NULL AND "current_stock" <= "reorder_level";

ALTER TABLE "items"
  ADD CONSTRAINT "items_reorder_ge_min"   CHECK ("reorder_level" >= "min_stock"),
  ADD CONSTRAINT "items_max_ge_reorder"   CHECK ("max_stock"     >= "reorder_level");

-- ────────────────────────────────────────────────────────────────────
-- §5 Projects — partial index on alive rows by status
-- ────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS "idx_projects_status_alive"
  ON "projects" ("status")
  WHERE "deleted_at" IS NULL;

CREATE INDEX IF NOT EXISTS "idx_projects_search"
  ON "projects" USING gin (
    (coalesce("wbs",'') || ' ' || coalesce("name",'') || ' ' || coalesce("location",'')) gin_trgm_ops
  );

-- ────────────────────────────────────────────────────────────────────
-- §4 Users + sessions — partial indexes
-- ────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS "idx_users_status_alive"
  ON "users" ("status")
  WHERE "deleted_at" IS NULL;

CREATE INDEX IF NOT EXISTS "idx_sessions_user_alive"
  ON "user_sessions" ("user_id")
  WHERE "revoked_at" IS NULL;

-- ────────────────────────────────────────────────────────────────────
-- §7 Stock movements — composite + GIN indexes + business CHECK
-- ────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS "idx_movements_kind_dir_date"
  ON "stock_movements" ("kind", "direction", "movement_date" DESC)
  WHERE "deleted_at" IS NULL;

CREATE INDEX IF NOT EXISTS "idx_movements_ref_trgm"
  ON "stock_movements" USING gin ("ref_no" gin_trgm_ops);

ALTER TABLE "stock_movements"
  ADD CONSTRAINT "stock_movements_kind_payload_chk" CHECK (
       (kind = 'operations'  AND direction = 'in'  AND supplier_id IS NOT NULL)
    OR (kind = 'operations'  AND direction = 'out' AND project_id  IS NOT NULL)
    OR (kind = 'maintenance' AND site_id IS NOT NULL)
  );

ALTER TABLE "stock_movement_items"
  ADD CONSTRAINT "stock_movement_items_qty_positive" CHECK ("qty" > 0);

-- ────────────────────────────────────────────────────────────────────
-- §11 Notifications — unread partial index
-- ────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS "idx_notifications_user_unread"
  ON "notifications" ("user_id", "created_at" DESC)
  WHERE "read_at" IS NULL;

-- ────────────────────────────────────────────────────────────────────
-- §8 Triggers — keep items.current_stock honest
-- ────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION apply_movement_to_stock()
RETURNS TRIGGER AS $$
DECLARE
  v_direction movement_direction;
  v_alive     BOOLEAN;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT direction, deleted_at IS NULL
      INTO v_direction, v_alive
      FROM stock_movements WHERE id = NEW.movement_id;

    IF v_alive THEN
      UPDATE items SET
        current_stock = current_stock
          + CASE WHEN v_direction = 'in' THEN NEW.qty ELSE -NEW.qty END,
        updated_at = now()
      WHERE id = NEW.item_id;
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    SELECT direction, deleted_at IS NULL
      INTO v_direction, v_alive
      FROM stock_movements WHERE id = OLD.movement_id;

    IF v_alive THEN
      UPDATE items SET
        current_stock = current_stock
          - CASE WHEN v_direction = 'in' THEN OLD.qty ELSE -OLD.qty END,
        updated_at = now()
      WHERE id = OLD.item_id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_movement_items_stock ON stock_movement_items;
CREATE TRIGGER trg_movement_items_stock
AFTER INSERT OR DELETE ON stock_movement_items
FOR EACH ROW EXECUTE FUNCTION apply_movement_to_stock();

CREATE OR REPLACE FUNCTION apply_movement_soft_delete()
RETURNS TRIGGER AS $$
DECLARE
  sign INT;
BEGIN
  IF (OLD.deleted_at IS NULL) AND (NEW.deleted_at IS NOT NULL) THEN
    sign := -1;
  ELSIF (OLD.deleted_at IS NOT NULL) AND (NEW.deleted_at IS NULL) THEN
    sign := 1;
  ELSE
    RETURN NEW;
  END IF;

  UPDATE items i
  SET current_stock = i.current_stock
        + sign * CASE WHEN NEW.direction = 'in' THEN smi.qty ELSE -smi.qty END,
      updated_at = now()
  FROM stock_movement_items smi
  WHERE smi.movement_id = NEW.id AND smi.item_id = i.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_movement_soft_delete ON stock_movements;
CREATE TRIGGER trg_movement_soft_delete
AFTER UPDATE OF deleted_at ON stock_movements
FOR EACH ROW EXECUTE FUNCTION apply_movement_soft_delete();

-- ────────────────────────────────────────────────────────────────────
-- §9 Views — what the UI reads
-- ────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW v_items_with_status AS
SELECT
  i.id,
  i.rfq,
  i.name,
  c.label AS category,
  u.label AS unit,
  i.current_stock,
  i.reorder_level,
  i.min_stock,
  i.max_stock,
  CASE
    WHEN i.current_stock <= 0                  THEN 'out'
    WHEN i.current_stock <= i.min_stock        THEN 'critical'
    WHEN i.current_stock <= i.reorder_level    THEN 'low'
    ELSE 'in_stock'
  END::item_status AS status,
  i.is_maintenance_part,
  i.deleted_at IS NULL AS is_active
FROM items i
JOIN categories c ON c.id = i.category_id
JOIN units      u ON u.id = i.unit_id;

CREATE OR REPLACE VIEW v_reorder_alerts AS
SELECT
  i.id                AS item_id,
  i.name,
  c.label             AS category,
  i.current_stock     AS current,
  i.reorder_level     AS reorder,
  GREATEST(0, i.reorder_level - i.current_stock) AS shortfall,
  GREATEST(i.reorder_level * 2, i.max_stock)     AS suggested,
  s.name              AS supplier,
  CASE
    WHEN i.current_stock <= 0                  THEN 'critical'
    WHEN i.current_stock <= i.min_stock        THEN 'critical'
    WHEN i.current_stock <= i.reorder_level    THEN 'low'
    WHEN i.current_stock <= i.reorder_level * 1.15 THEN 'watch'
    ELSE NULL
  END::alert_severity AS severity
FROM items i
JOIN categories c        ON c.id = i.category_id
LEFT JOIN suppliers s    ON s.id = i.default_supplier_id
WHERE i.deleted_at IS NULL
  AND i.current_stock <= i.reorder_level * 1.15;

CREATE OR REPLACE VIEW v_project_consumption AS
SELECT
  p.id              AS project_id,
  p.wbs,
  p.name,
  p.location,
  COUNT(DISTINCT smi.item_id) FILTER (WHERE m.direction = 'out') AS items_issued,
  COALESCE(SUM(smi.qty)        FILTER (WHERE m.direction = 'out'), 0) AS qty_consumed,
  MAX(m.movement_date)         FILTER (WHERE m.direction = 'out') AS last_activity
FROM projects p
LEFT JOIN stock_movements      m   ON m.project_id = p.id AND m.deleted_at IS NULL
LEFT JOIN stock_movement_items smi ON smi.movement_id = m.id
WHERE p.deleted_at IS NULL
GROUP BY p.id;

CREATE OR REPLACE VIEW v_dashboard_kpis AS
SELECT
  (SELECT SUM(current_stock) FROM items WHERE deleted_at IS NULL)
    AS total_in_stock,

  (SELECT COUNT(*) FROM items
    WHERE deleted_at IS NULL AND current_stock <= reorder_level)
    AS items_below_reorder,

  COALESCE((
    SELECT SUM(smi.qty)
    FROM stock_movements m
    JOIN stock_movement_items smi ON smi.movement_id = m.id
    WHERE m.deleted_at IS NULL
      AND m.direction = 'in'
      AND m.movement_date = CURRENT_DATE
  ), 0) AS today_stock_in,

  COALESCE((
    SELECT SUM(smi.qty)
    FROM stock_movements m
    JOIN stock_movement_items smi ON smi.movement_id = m.id
    WHERE m.deleted_at IS NULL
      AND m.direction = 'out'
      AND m.movement_date = CURRENT_DATE
  ), 0) AS today_stock_out;

CREATE OR REPLACE VIEW v_stock_movement_history AS
SELECT
  m.id              AS movement_id,
  m.ref_no,
  m.direction,
  m.kind,
  m.movement_date,
  smi.qty,
  u.label           AS unit,
  it.name           AS item,
  c.label           AS category,
  s.name            AS supplier,
  p.name            AS project,
  p.wbs             AS project_wbs,
  d.label           AS department,
  st.label          AS site,
  tech.full_name    AS technician,
  m.application,
  m.activity,
  m.rfq
FROM stock_movements m
JOIN stock_movement_items smi ON smi.movement_id = m.id
JOIN items it      ON it.id = smi.item_id
JOIN categories c  ON c.id = it.category_id
JOIN units u       ON u.id = smi.unit_id
LEFT JOIN suppliers s   ON s.id = m.supplier_id
LEFT JOIN projects p    ON p.id = m.project_id
LEFT JOIN departments d ON d.id = m.department_id
LEFT JOIN sites st      ON st.id = m.site_id
LEFT JOIN users tech    ON tech.id = m.technician_user_id
WHERE m.deleted_at IS NULL;

CREATE OR REPLACE VIEW v_slow_moving_items AS
SELECT
  i.id,
  i.rfq,
  i.name,
  c.label AS category,
  i.current_stock,
  MAX(m.movement_date) FILTER (WHERE m.direction = 'out') AS last_issued,
  CURRENT_DATE
    - COALESCE(MAX(m.movement_date) FILTER (WHERE m.direction = 'out'), i.created_at::date)
    AS days_idle
FROM items i
JOIN categories c                  ON c.id = i.category_id
LEFT JOIN stock_movement_items smi ON smi.item_id = i.id
LEFT JOIN stock_movements m        ON m.id = smi.movement_id AND m.deleted_at IS NULL
WHERE i.deleted_at IS NULL
GROUP BY i.id, c.label
HAVING (CURRENT_DATE
        - COALESCE(MAX(m.movement_date) FILTER (WHERE m.direction = 'out'),
                   i.created_at::date)) >= 30;
