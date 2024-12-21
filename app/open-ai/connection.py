import os
from openai import OpenAI
from dotenv import load_dotenv
# Set your API key

load_dotenv(dotenv_path='../.env.development')

os.environ['OPENAI_API_KEY'] = os.getenv('OPEN_AI_API_KEY')
client = OpenAI()


# Example function to call OpenAI's GPT model
def ask_openai(prompt):
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt},
            ],
            max_tokens=1000,  # Limit on response length
            temperature=0.7,  # Controls randomness
        )
        return response
    except Exception as e:
        return f"Error: {str(e)}"

# Example usage
user_prompt = "What is the capital of France?"
result = ask_openai(user_prompt)
print(f"OpenAI Response: {result}")