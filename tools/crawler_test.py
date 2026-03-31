"""
crawler_test.py — Web3 事件提取测试脚本

依赖安装：
    pip install requests beautifulsoup4 groq

如需抓取 JS 渲染页面，额外安装：
    pip install crawl4ai
    crawl4ai-setup   # 首次运行需要

使用方法：
    python crawler_test.py                        # 交互式输入 URL
    python crawler_test.py https://example.com   # 命令行传入 URL
    python crawler_test.py --js https://example.com  # 使用 Crawl4AI 渲染 JS
"""

import sys
import json
import os
import re

from prompt import WEB3_EXTRACTION_PROMPT, CATEGORY_MAP

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_MODEL = "llama-3.3-70b-versatile"  # 快、免费额度充足
MAX_CONTENT_CHARS = 40_000              # 超出截断，避免超 token 限制


# ──────────────────────────────────────────────
# 1. 抓取网页内容
# ──────────────────────────────────────────────

def fetch_with_requests(url: str) -> str:
    """使用 requests + BeautifulSoup 抓取静态页面"""
    import requests
    from bs4 import BeautifulSoup

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    }
    resp = requests.get(url, headers=headers, timeout=20)
    resp.raise_for_status()
    resp.encoding = resp.apparent_encoding or "utf-8"

    soup = BeautifulSoup(resp.text, "html.parser")

    for tag in soup(["script", "style", "nav", "footer", "aside", "iframe"]):
        tag.decompose()

    text = soup.get_text(separator="\n", strip=True)
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    lines = [ln for ln in lines if len(ln) > 1]
    return "\n".join(lines)


def fetch_with_crawl4ai(url: str) -> str:
    """使用 Crawl4AI 抓取 JS 渲染页面（需要额外安装）"""
    try:
        import asyncio
        from crawl4ai import AsyncWebCrawler

        async def _crawl():
            async with AsyncWebCrawler(verbose=False) as crawler:
                result = await crawler.arun(url=url)
                return result.markdown or result.cleaned_html or ""

        return asyncio.run(_crawl())
    except ImportError:
        print("⚠️  crawl4ai 未安装，回退到 requests 模式")
        return fetch_with_requests(url)


# ──────────────────────────────────────────────
# 2. 调用 LLM 进行 JSON 提取
# ──────────────────────────────────────────────

def extract_with_groq(page_text: str, url: str) -> list:
    """调用 Groq API 提取 Web3 事件"""
    from groq import Groq

    if not GROQ_API_KEY:
        raise ValueError(
            "未设置 GROQ_API_KEY 环境变量。\n"
            "请在 https://console.groq.com 申请免费 API Key，然后：\n"
            "  export GROQ_API_KEY=gsk_xxxxx"
        )

    truncated = page_text[:MAX_CONTENT_CHARS]
    if len(page_text) > MAX_CONTENT_CHARS:
        print(f"⚠️  内容过长，已截断至 {MAX_CONTENT_CHARS} 字符（原始：{len(page_text)} 字符）")

    prompt = WEB3_EXTRACTION_PROMPT.replace("{{PAGE_CONTENT}}", f"URL: {url}\n\n{truncated}")

    client = Groq(api_key=GROQ_API_KEY)
    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
        max_tokens=8192,
    )

    raw = response.choices[0].message.content.strip()
    return parse_json_response(raw)


def parse_json_response(raw: str) -> list:
    """从 LLM 输出中提取 JSON 数组"""
    raw = raw.strip()

    if raw.startswith("["):
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            pass

    match = re.search(r"\[[\s\S]*\]", raw)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    print("⚠️  无法解析为 JSON，原始输出：")
    print(raw[:2000])
    return []


# ──────────────────────────────────────────────
# 3. 映射 category → section
# ──────────────────────────────────────────────

def map_categories(events: list) -> list:
    """将中文 category 映射为英文 section"""
    for ev in events:
        cats = ev.get("category", [])
        sections = []
        for cat in cats:
            sec = CATEGORY_MAP.get(cat)
            if sec and sec not in sections:
                sections.append(sec)
        ev["section"] = sections[0] if sections else "events"
        ev["sections_all"] = sections
    return events


# ──────────────────────────────────────────────
# 4. 主流程
# ──────────────────────────────────────────────

def main():
    args = sys.argv[1:]
    use_js = "--js" in args
    if use_js:
        args = [a for a in args if a != "--js"]

    if args:
        url = args[0]
    else:
        url = input("请输入要抓取的网页 URL：").strip()

    if not url.startswith("http"):
        print("❌ URL 必须以 http:// 或 https:// 开头")
        sys.exit(1)

    print(f"\n{'='*60}")
    print(f"🌐 目标 URL：{url}")
    print(f"📡 抓取模式：{'Crawl4AI (JS渲染)' if use_js else 'requests (静态)'}")
    print(f"🤖 模型：{GROQ_MODEL}")
    print("="*60)

    print("\n[1/3] 抓取网页内容...")
    try:
        if use_js:
            page_text = fetch_with_crawl4ai(url)
        else:
            page_text = fetch_with_requests(url)
        print(f"✅ 抓取成功，内容长度：{len(page_text)} 字符")
    except Exception as e:
        print(f"❌ 抓取失败：{e}")
        sys.exit(1)

    if len(page_text.strip()) < 100:
        print("⚠️  抓取内容过少，可能是 JS 渲染页面，建议使用 --js 参数重试")

    print("\n[2/3] 调用 LLM 提取事件...")
    try:
        events = extract_with_groq(page_text, url)
        print(f"✅ LLM 返回 {len(events)} 条事件")
    except Exception as e:
        print(f"❌ LLM 调用失败：{e}")
        sys.exit(1)

    print("\n[3/3] 映射分类并输出结果...")
    events = map_categories(events)

    print("\n" + "="*60)
    print(f"📋 提取结果（共 {len(events)} 条）：")
    print("="*60)
    print(json.dumps(events, ensure_ascii=False, indent=2))

    out_file = "extraction_result.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(events, f, ensure_ascii=False, indent=2)
    print(f"\n💾 结果已保存到 {out_file}")

    if events:
        print("\n📊 摘要：")
        for i, ev in enumerate(events, 1):
            imp = ev.get("importance", "?")
            conf = ev.get("ai_confidence", 0)
            section = ev.get("section", "?")
            title = ev.get("title", "无标题")
            print(f"  {i}. [{imp.upper():6}] [{section:12}] (置信度 {conf:.0%}) {title}")


if __name__ == "__main__":
    main()
