/**
 * FastAPI 提取服务：POST /api/v1/extract
 * 本地可把 `VITE_API_BASE_URL` 设为 `http://127.0.0.1:8000`（与 Vite 代理一致）。
 */

export const API_BASE_URL = String(
  import.meta.env.VITE_API_BASE_URL || "https://songsongsong-3.onrender.com",
).replace(/\/$/, "");

export type ExtractRequestBody = {
  page_content?: string;
  source_url?: string;
};

/** 完整提取接口 URL（调试用）。 */
export function getExtractEndpointUrl(): string {
  return `${API_BASE_URL}/api/v1/extract`;
}

export async function extractContent(params: {
  page_content?: string;
  source_url?: string;
}): Promise<unknown> {
  const response = await fetch(`${API_BASE_URL}/api/v1/extract`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`提取失败: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}
