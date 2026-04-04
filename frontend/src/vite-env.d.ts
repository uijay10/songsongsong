/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 后端 API 根地址（无尾斜杠），例如 https://songsongsong-3.onrender.com */
  readonly VITE_API_BASE_URL?: string;
  /** 设为 `1` 或 `true` 时使用 hash 路由（不依赖服务端 SPA rewrite） */
  readonly VITE_SPA_HASH_ROUTER?: string;
  /** 抽奖冷却毫秒数；未设置时默认 24h。`0` 仅关闭前端冷却条（调试用） */
  readonly VITE_SLOT_COOLDOWN_MS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
