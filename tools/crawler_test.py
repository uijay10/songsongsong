# crawler_test.py
# Web3 Release AI 抓取测试脚本 - 使用 Crawl4AI（推荐版）

from prompt import WEB3_EXTRACTION_PROMPT
import json
import asyncio
from crawl4ai import AsyncWebCrawler


async def fetch_with_crawl4ai(url: str) -> str:
    """使用 Crawl4AI 抓取网页（支持 JS 渲染）"""
    try:
        async with AsyncWebCrawler(verbose=False) as crawler:
            result = await crawler.arun(url=url)
            # 优先使用 markdown，干净且适合 LLM
            return result.markdown or result.cleaned_html or result.html or ""
    except Exception as e:
        print(f"❌ Crawl4AI 抓取失败: {e}")
        return f"抓取失败: {str(e)}"


async def main():
    print("=== Web3 Release AI 抓取测试 - Crawl4AI 版 ===")

    # 获取 URL
    if len(sys.argv) > 1:
        url = sys.argv[1]
    else:
        url = input("\n请输入要抓取的网页 URL: ").strip()

    if not url.startswith("http"):
        print("❌ URL 必须以 http:// 或 https:// 开头")
        return

    print(f"\n🌐 正在使用 Crawl4AI 抓取: {url}")

    # 抓取网页
    page_text = await fetch_with_crawl4ai(url)
    print(f"✅ 抓取完成，内容长度: {len(page_text)} 字符")

    if len(page_text) < 200:
        print("⚠️  抓取内容较少，可能页面加载有问题")

    # 准备 Prompt
    full_prompt = WEB3_EXTRACTION_PROMPT.replace(
        "{{PAGE_CONTENT}}", f"URL: {url}\n\n{page_text}"
    )

    print(f"\n✅ Prompt 已准备好（长度: {len(full_prompt)} 字符）")

    # 目前还是模拟输出（因为没有 Groq Key）
    print("\n🤖 模拟 LLM 提取中...")

    # 模拟结果
    simulated_result = [
        {
            "title": "测试事件：从真实抓取内容提取",
            "project_name": "测试项目",
            "description": "这是使用 Crawl4AI 抓取真实网页后提取的事件示例。实际运行时会根据抓取到的内容生成更准确的事件信息。",
            "category": ["测试网"],
            "start_time": "2026-04-15T00:00:00Z",
            "end_time": None,
            "source_url": url,
            "importance": "medium",
            "ai_confidence": 0.82,
            "tags": ["Web3", "Testnet"],
        }
    ]

    print("\n📋 提取结果：")
    print(json.dumps(simulated_result, ensure_ascii=False, indent=2))

    # 保存结果
    with open("extraction_result.json", "w", encoding="utf-8") as f:
        json.dump(simulated_result, f, ensure_ascii=False, indent=2)

    print("\n💾 结果已保存到 extraction_result.json")
    print("\n🎉 测试完成！Crawl4AI 抓取功能已可用。")
    print("下一步建议：接入真实 LLM 调用，让提取更智能。")


if __name__ == "__main__":
    import sys

    asyncio.run(main())
