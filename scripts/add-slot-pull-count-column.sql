-- 在部署含 slot_pull_count 的 API 之前，在 PostgreSQL 中执行一次：
-- （Render → PostgreSQL → Shell 或任意 psql）

ALTER TABLE users ADD COLUMN IF NOT EXISTS slot_pull_count integer NOT NULL DEFAULT 0;

-- 若仍有个别账号卡住，可再执行（会清空 0 代币用户的 last_slot_pull，请确认可接受）：
-- UPDATE users SET last_slot_pull = NULL, slot_pull_count = 0 WHERE tokens = 0 AND last_slot_pull IS NOT NULL;
