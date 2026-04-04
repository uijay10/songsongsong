/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 后端 API 根地址（无尾斜杠），例如 https://songsongsong-3.onrender.com */
  readonly VITE_API_BASE_URL?: string;
  /** 设为 `1` 或 `true` 时使用 hash 路由（不依赖服务端 SPA rewrite） */
  readonly VITE_SPA_HASH_ROUTER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
