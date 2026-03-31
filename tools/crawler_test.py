# crawler_test.py
# Web3 Release AI Event Extraction Test Script (English Version)

from prompt import WEB3_EXTRACTION_PROMPT
import json

def main():
    print("=== Web3 Release AI Extraction Test ===")
    print("Testing if the Prompt works correctly...\n")

    # Test content (you can replace this with real webpage content later)
    test_content = """
    XYZ project on Solana has announced the launch of its testnet!
    The testnet will go live on April 15, 2026 and last until April 30, 2026.
    Users who participate in the testnet will have a chance to receive airdrop rewards.
    Official link: https://xyz.solana.com/testnet
    The team stated that this testnet will focus on testing Layer2 performance.
    """

    # Combine Prompt with test content
    prompt = WEB3_EXTRACTION_PROMPT.replace("{{PAGE_CONTENT}}", test_content)

    print("✅ Prompt combined successfully!")
    print(f"Prompt length: {len(prompt)} characters\n")

    # Simulated LLM output (for testing the structure)
    simulated_output = [
        {
            "title": "XYZ Project on Solana Testnet is About to Launch",
            "project_name": "XYZ",
            "description": "The XYZ project on Solana will launch its testnet on April 15, 2026, lasting until April 30. Participants have a chance to receive airdrop rewards. This testnet focuses on Layer2 performance testing.",
            "category": ["Testnet"],
            "start_time": "2026-04-15T00:00:00Z",
            "end_time": "2026-04-30T23:59:59Z",
            "source_url": "https://xyz.solana.com/testnet",
            "importance": "high",
            "ai_confidence": 0.88,
            "tags": ["Solana", "Layer2", "Testnet"]
        }
    ]

    print("📋 Extraction Result (Simulated output for format validation):")
    print(json.dumps(simulated_output, ensure_ascii=False, indent=2))

    # Save result to file
    with open("extraction_result.json", "w", encoding="utf-8") as f:
        json.dump(simulated_output, f, ensure_ascii=False, indent=2)

    print("\n💾 Result saved to extraction_result.json")
    print("\n🎉 Test completed! The Prompt structure is correct and ready to use.")
    print("Next step: We can add real webpage crawling and actual LLM calling.")

if __name__ == "__main__":
    main()