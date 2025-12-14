import os
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_connection():
    api_key = os.getenv("DASHSCOPE_API_KEY") or os.getenv("OPENAI_API_KEY")
    base_url = os.getenv("OPENAI_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1")
    model = os.getenv("AI_MODEL", "qwen-plus")

    print(f"Testing connection to: {base_url}")
    print(f"Using model: {model}")
    print(f"API Key present: {'Yes' if api_key and api_key != 'sk-placeholder' else 'No (or placeholder)'}")

    if not api_key or api_key == "sk-placeholder":
        print("Error: Invalid API Key. Please update .env file.")
        return

    client = OpenAI(
        api_key=api_key,
        base_url=base_url
    )

    try:
        print("Sending request...")
        completion = client.chat.completions.create(
            model=model,
            messages=[{'role': 'user', 'content': '你好，请做一个简短的自我介绍。'}]
        )
        print("\n--- Response from AI ---")
        print(completion.choices[0].message.content)
        print("------------------------")
        print("\n✅ Connection verification successful!")
    except Exception as e:
        print(f"\n❌ Connection failed: {e}")

if __name__ == "__main__":
    test_connection()
