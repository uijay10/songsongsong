-- 一次性修复：若库里 last_slot_pull 曾被误写成「与注册时间几乎相同」且代币仍为 0，
-- 可执行本脚本（在 Render PostgreSQL / 任意 psql 中）。部署新 API 后多数情况可不跑。
--
-- 执行前请备份；若不确定，先 SELECT 预览：
--
-- SELECT wallet, tokens, created_at, last_slot_pull
-- FROM users
-- WHERE tokens = 0
--   AND last_slot_pull IS NOT NULL
--   AND ABS(EXTRACT(EPOCH FROM (last_slot_pull - created_at))) < 60;

UPDATE users
SET last_slot_pull = NULL
WHERE tokens = 0
  AND last_slot_pull IS NOT NULL
  AND created_at IS NOT NULL
  AND ABS(EXTRACT(EPOCH FROM (last_slot_pull - created_at))) < 60;
