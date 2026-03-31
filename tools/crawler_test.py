# crawler_test.py
# Web3 Release AI 抓取测试脚本 - 支持真实网页抓取（简化版）

import sys
import json
import requests
from bs4 import BeautifulSoup
from prompt import WEB3_EXTRACTION_PROMPT


def fetch_webpage(url: str) -> str:
    """简单抓取网页内容"""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")

        # 移除 script 和 style 标签
        for script in soup(["script", "style"]):
            script.decompose()

        text = soup.get_text(separator="\n", strip=True)
        return text[:15000]  # 限制长度，避免 token 超限

    except Exception as e:
        print(f"❌ 抓取失败: {e}")
        return f"抓取失败: {str(e)}"


def main():
    print("=== Web3 Release AI 真实网页抓取测试 ===")

    # 获取 URL
    if len(sys.argv) > 1:
        url = sys.argv[1]
    else:
        url = input("\n请输入要抓取的网页 URL: ").strip()

    if not url.startswith("http"):
        print("❌ URL 必须以 http:// 或 https:// 开头")
        return

    print(f"\n🌐 正在抓取: {url}")

    # 1. 抓取网页
    page_text = fetch_webpage(url)
    print(f"✅ 抓取完成，内容长度: {len(page_text)} 字符")

    if len(page_text) < 100:
        print("⚠️  抓取内容过少，可能需要更高级的抓取工具")

    # 2. 准备 Prompt
    full_prompt = WEB3_EXTRACTION_PROMPT.replace(
        "{{PAGE_CONTENT}}", f"URL: {url}\n\n{page_text}"
    )

    print("\n✅ Prompt 已准备好（长度: {} 字符）".format(len(full_prompt)))

    # 3. 模拟 LLM 输出（目前没有 API Key）
    print("\n🤖 模拟 LLM 提取中...（真实调用需设置 GROQ_API_KEY）")

    # 模拟结果
    simulated_result = [
        {
            "title": "示例事件：测试网即将开启",
            "project_name": "示例项目",
            "description": "这是一个从网页抓取后提取的测试事件。实际运行时会根据真实内容生成对应的事件信息。",
            "category": ["测试网"],
            "start_time": "2026-04-15T00:00:00Z",
            "end_time": None,
            "source_url": url,
            "importance": "medium",
            "ai_confidence": 0.75,
            "tags": ["Testnet", "Web3"],
        }
    ]

    print("\n📋 提取结果：")
    print(json.dumps(simulated_result, ensure_ascii=False, indent=2))

    # 保存结果
    with open("extraction_result.json", "w", encoding="utf-8") as f:
        json.dump(simulated_result, f, ensure_ascii=False, indent=2)

    print("\n💾 结果已保存到 extraction_result.json")
    print("\n🎉 测试完成！")
    print("当前是模拟输出。接下来我们可以：")
    print("1. 接入真实 LLM 调用")
    print("2. 优化抓取功能（支持 JS 渲染页面）")
    print("3. 自动保存到数据库并显示在首页")


if __name__ == "__main__":
    main()
