/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 后端 API 根地址（无尾斜杠），例如 https://songsongsong-3.onrender.com */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
