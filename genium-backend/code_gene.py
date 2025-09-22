from openai import OpenAI
from datetime import datetime
import json
import requests
import os
import subprocess
import logging # Import logging module
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai # Import Google Generative AI

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

from dotenv import load_dotenv
load_dotenv(dotenv_path='../.env')

# Initialize OpenAI client
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
openai_client = None
if OPENAI_API_KEY:
    openai_client = OpenAI(api_key=OPENAI_API_KEY)
    logging.info("OpenAI client initialized.")
else:
    logging.warning("OPENAI_API_KEY not found. OpenAI client will not be available.")

# Initialize Gemini client
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") # Use GEMINI_API_KEY for consistency with app.py
logging.info(f"GEMINI_API_KEY loaded: {'Yes' if GEMINI_API_KEY else 'No'}")
gemini_model = None
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    # Directly use the model name to avoid dynamic selection issues
    gemini_model_name = "gemini-2.5-flash"
    gemini_model = genai.GenerativeModel(gemini_model_name)
    logging.info(f"Gemini client initialized with model: {gemini_model_name}")
    logging.debug(f"Actual model name used by genai.GenerativeModel: {gemini_model.model_name}")
else:
    logging.warning("GEMINI_API_KEY not found. Gemini API will not be available.")

SYSTEM_PROMPT = """You are a professional code-generation assistant.

When the user requests a project or any code:

1. **Project Tree First**
   • Always begin with a Markdown code block labeled `text` that shows a VS-Code-style folder structure.
   • Use box-drawing characters (└──, ├──) for subfolders/files.

2. **File Contents**
   • After the tree, provide each file in a separate fenced code block.
   • Use the correct language tag for syntax highlighting (```python, ```html, ```javascript, etc.).
   • The first line inside each code block should be a comment showing the file path (e.g. `# project_name/main.py`).

3. **Style & Tone**
   • Output only the folder tree and code.
   • Explanations are optional and limited to one short sentence at the end if absolutely necessary.
   • Never refuse standard coding or project-creation tasks.

4. **Quality**
   • Ensure code is runnable and logically organized.
   • If multiple files are needed, include all required dependencies (e.g., requirements.txt) in the tree and code blocks.

Follow these rules for every “create/build/generate” request.
"""

@app.route('/', methods=['GET'])
def index():
    return jsonify({"message": "Backend server is running"}), 200

@app.route('/generate-code', methods=['POST'])
def generate_code():
    data = request.get_json()
    logging.debug(f"/generate-code endpoint called with data: {data}")
    user_query = data.get('prompt')

    if not user_query:
        return jsonify({"error": "Prompt is required"}), 400

    messages = [
        { "role": "system", "content": SYSTEM_PROMPT },
        { "role": "user", "content": user_query }
    ]

    response_content = None
    
    if gemini_model:
        try:
            # For Gemini, the system prompt is typically handled as the first user message
            # or as a dedicated system instruction if the API supports it.
            # Given the new SYSTEM_PROMPT, we can directly use it in the first user message.
            gemini_messages = []
            for msg in messages:
                if msg["role"] == "system":
                    # Prepend system instruction to the first user message
                    if gemini_messages and gemini_messages[0]['role'] == 'user':
                        gemini_messages[0]['parts'][0] = msg["content"] + "\n" + gemini_messages[0]['parts'][0]
                    else:
                        gemini_messages.append({'role': 'user', 'parts': [msg["content"]]})
                elif msg["role"] == "user":
                    gemini_messages.append({'role': 'user', 'parts': [msg["content"]]})
                elif msg["role"] == "assistant":
                    gemini_messages.append({'role': 'model', 'parts': [msg["content"]]})

            gemini_response = gemini_model.generate_content(gemini_messages)
            response_content = gemini_response.candidates[0].content.parts[0].text
        except genai.APIError as e:
            logging.error(f"Gemini API error: {e}")
            response_content = json.dumps({"error": f"Gemini API error: {e}"})
        except Exception as e:
            logging.error(f"An unexpected error occurred with Gemini API: {e}", exc_info=True)
            response_content = json.dumps({"error": f"An unexpected Gemini API error occurred."})
    
    if response_content is None and openai_client: # Only try OpenAI if Gemini failed or not available
        try:
            openai_response = openai_client.chat.completions.create(
                model="gpt-4",
                messages=messages # No response_format for plain text code
            )
            response_content = openai_response.choices[0].message.content
        except OpenAI.APIError as e:
            logging.error(f"OpenAI API error: {e}")
            response_content = json.dumps({"error": f"OpenAI API error: {e}"})
        except Exception as e:
            logging.error(f"An unexpected error occurred with OpenAI API: {e}", exc_info=True)
            response_content = json.dumps({"error": f"An unexpected OpenAI API error occurred."})

    if response_content is None:
        return jsonify({"error": "Neither Gemini nor OpenAI API could generate a response. Please check API keys and service status."}), 500
    
    # If the response_content is a JSON string due to an API error, return it as such
    try:
        error_data = json.loads(response_content)
        if "error" in error_data:
            return jsonify(error_data), 500
    except json.JSONDecodeError:
        pass # Not an error JSON, proceed to return as code

    return jsonify({"code": response_content})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002)