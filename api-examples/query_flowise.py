import requests
import json

# Flowise REST API Query Example (Python)
# Once you build and save a Chatflow in Flowise, click the '</> API Endpoint' button to get your Chatflow ID.

FLOWISE_URL = "http://localhost:3000/api/v1/prediction/<YOUR_CHATFLOW_ID>"

def query_flowise(question: str, history: list = None):
    payload = {
        "question": question,
        "history": history or []
    }
    headers = {
        "Content-Type": "application/json"
    }
    
    response = requests.post(FLOWISE_URL, json=payload, headers=headers)
    if response.status_code == 200:
        result = response.json()
        print("Response:", result.get("text"))
        return result
    else:
        print(f"Error {response.status_code}: {response.text}")
        return None

if __name__ == "__main__":
    print("Replace <YOUR_CHATFLOW_ID> in FLOWISE_URL before running.")
    # example usage:
    # query_flowise("Hello, tell me what you can do!")
