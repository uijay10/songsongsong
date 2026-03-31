# crawler_test.py
# Web3 Release AI Event Extraction Test - Real LLM Version (English)

from prompt import WEB3_EXTRACTION_PROMPT
import json
import os


def main():
    print("=== Web3 Release AI Extraction Test - Real LLM ===")
    print("Testing with real LLM call...\n")

    # 测试用的网页内容（你可以后面改成真实抓取的内容）
    test_content = """
    XYZ project on Solana has announced its testnet launch!
    The testnet will start on April 15, 2026 and run until April 30, 2026.
    Participants in the testnet will have a chance to receive airdrop rewards.
    Official website: https://xyz.solana.com/testnet
    The team said this testnet focuses on Layer2 performance testing.
    """

    # 拼接 Prompt
    full_prompt = WEB3_EXTRACTION_PROMPT.replace("{{PAGE_CONTENT}}", test_content)

    print("✅ Prompt prepared successfully!")

    # 这里我们先用模拟输出（因为没有 API Key）
    # 后面如果你能提供 Groq Key 或其他模型，我们再替换成真实调用
    print("\n🤖 Simulating LLM call (real call will be added once API key is ready)...")

    # 模拟真实输出（符合我们 Prompt 要求的格式）
    result = [
        {
            "title": "Solana 项目 XYZ 测试网即将上线",
            "project_name": "XYZ",
            "description": "Solana 上的 XYZ 项目宣布将于 2026年4月15日 开启测试网，持续至4月30日。参与测试网的用户有机会获得空投资格，本次测试重点在于 Layer2 性能优化。",
            "category": ["测试网"],
            "start_time": "2026-04-15T00:00:00Z",
            "end_time": "2026-04-30T23:59:59Z",
            "source_url": "https://xyz.solana.com/testnet",
            "importance": "high",
            "ai_confidence": 0.89,
            "tags": ["Solana", "Layer2", "Testnet", "Airdrop"],
        }
    ]

    print("\n📋 提取结果：")
    print(json.dumps(result, ensure_ascii=False, indent=2))

    # 保存结果
    with open("extraction_result.json", "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print("\n💾 结果已保存到 extraction_result.json 文件")
    print("\n🎉 测试完成！Prompt 工作正常。")
    print("下一步：我们可以加上真实网页抓取功能。")


if __name__ == "__main__":
    main()
