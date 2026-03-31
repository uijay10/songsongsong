# crawler_test.py
# Web3 Release AI 抓取 + 真实 LLM 调用测试（最终推荐版）

from prompt import WEB3_EXTRACTION_PROMPT
import json
import asyncio
import sys
from crawl4ai import AsyncWebCrawler
import os


async def fetch_with_crawl4ai(url: str) -> str:
    """使用 Crawl4AI 抓取网页"""
    try:
        async with AsyncWebCrawler(verbose=False) as crawler:
            result = await crawler.arun(url=url)
            return result.markdown or result.cleaned_html or ""
    except Exception as e:
        print(f"❌ Crawl4AI 抓取失败: {e}")
        return f"抓取失败: {str(e)}"


async def extract_with_llm(page_text: str, url: str):
    """真实 LLM 调用（目前使用模拟，如果有 GROQ_API_KEY 则尝试真实调用）"""
    groq_key = os.environ.get("GROQ_API_KEY", "")

    if groq_key:
        print("🔑 检测到 GROQ_API_KEY，尝试真实 LLM 调用...")
        try:
            from groq import Groq

            client = Groq(api_key=groq_key)
            full_prompt = WEB3_EXTRACTION_PROMPT.replace(
                "{{PAGE_CONTENT}}", f"URL: {url}\n\n{page_text}"
            )

            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": full_prompt}],
                temperature=0.1,
                max_tokens=4000,
            )
            raw = response.choices[0].message.content.strip()
            try:
                return json.loads(raw)
            except:
                return [{"title": "解析失败", "description": raw[:500]}]
        except Exception as e:
            print(f"❌ Groq 调用失败: {e}，使用模拟输出")

    # 如果没有 Key 或调用失败，使用模拟输出
    print("🤖 使用模拟 LLM 输出（未设置 GROQ_API_KEY）")
    return [
        {
            "title": "从抓取内容提取的示例事件",
            "project_name": "测试项目",
            "description": f"这是从 {url} 抓取的内容中提取的事件示例。实际运行时会根据真实网页内容生成更准确的结果。",
            "category": ["测试网"],
            "start_time": "2026-04-15T00:00:00Z",
            "end_time": None,
            "source_url": url,
            "importance": "high",
            "ai_confidence": 0.85,
            "tags": ["Web3", "Testnet"],
        }
    ]


async def main():
    print("=== Web3 Release AI 抓取 + LLM 提取测试 ===")

    if len(sys.argv) > 1:
        url = sys.argv[1]
    else:
        try:
            url = input("\n请输入要抓取的网页 URL (默认 https://solana.com): ").strip()
        except EOFError:
            url = ""
        url = url or "https://solana.com"

    print(f"\n🌐 正在抓取: {url}")
    page_text = await fetch_with_crawl4ai(url)
    print(f"✅ 抓取完成，内容长度: {len(page_text)} 字符")

    print("\n🤖 正在调用 LLM 提取事件...")
    events = await extract_with_llm(page_text, url)

    print("\n📋 提取结果：")
    print(json.dumps(events, ensure_ascii=False, indent=2))

    with open("extraction_result.json", "w", encoding="utf-8") as f:
        json.dump(events, f, ensure_ascii=False, indent=2)

    print("\n💾 结果已保存到 extraction_result.json")
    print("\n🎉 测试完成！")

    if not os.environ.get("GROQ_API_KEY"):
        print("\n💡 提示：设置 GROQ_API_KEY 后即可使用真实 AI 提取")


if __name__ == "__main__":
    asyncio.run(main())
