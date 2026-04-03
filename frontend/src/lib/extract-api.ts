/**
 * FastAPI 提取服务：POST /api/v1/extract
 * - 本地开发：未设置 VITE_API_BASE_URL 时使用相对路径 `/api/v1/extract`，由 Vite 代理到本机 FastAPI。
 * - 生产构建：使用 `import.meta.env.VITE_API_BASE_URL`，未设置时回退到部署的 Render 地址。
 */

export type ExtractRequestBody = {
  page_content?: string;
  source_url?: string;
};

function getExtractApiBaseUrl(): string | null {
  const raw = import.meta.env.VITE_API_BASE_URL;
  if (raw != null && String(raw).trim() !== "") {
    return String(raw).replace(/\/$/, "");
  }
  if (import.meta.env.DEV) {
    return null;
  }
  return "https://songsongsong-3.onrender.com";
}

/** 完整提取接口 URL（含 origin）。 */
export function getExtractEndpointUrl(): string {
  const base = getExtractApiBaseUrl();
  if (base == null) {
    return "/api/v1/extract";
  }
  return `${base}/api/v1/extract`;
}

/**
 * 调用后端提取接口。成功时返回 JSON（一般为事件数组）；失败时抛出 Error（信息含状态码与响应体摘要）。
 */
export async function extractContent(data: ExtractRequestBody): Promise<unknown> {
  const url = getExtractEndpointUrl();
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  } catch (err) {
    console.error("提取请求错误:", err);
    throw err instanceof Error ? err : new Error(String(err));
  }

  const text = await response.text();
  let parsed: unknown;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }

  if (!response.ok) {
    const detail =
      typeof parsed === "object" && parsed !== null && "message" in parsed
        ? String((parsed as { message?: unknown }).message)
        : typeof parsed === "string"
          ? parsed
          : text;
    const err = new Error(`提取失败: ${response.status} — ${detail || response.statusText}`);
    console.error("提取失败:", err.message, parsed);
    throw err;
  }

  // 后端错误 JSON：{ ok: false, error, message }
  if (
    typeof parsed === "object" &&
    parsed !== null &&
    "ok" in parsed &&
    (parsed as { ok?: boolean }).ok === false
  ) {
    const p = parsed as { error?: string; message?: string };
    const err = new Error(p.message ?? p.error ?? "提取失败");
    console.error("提取接口返回错误:", parsed);
    throw err;
  }

  console.log("提取成功:", parsed);
  return parsed;
}
