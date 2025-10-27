from openai import OpenAI
from datetime import datetime
import json
import requests
import os
import subprocess
import logging # Import logging module
import google.generativeai as genai # Import Google Generative AI

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

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

1. **File Contents**
   • Provide each file in a separate fenced code block.
   • Use the correct language tag for syntax highlighting (```python, ```html, ```javascript, etc.).
   • The first line inside each code block should be a comment showing the file path (e.g. `# project_name/main.py`).

2. **Style & Tone**
   • Output only the code.
   • Explanations are optional and limited to one short sentence at the end if absolutely necessary.
   • Never refuse standard coding or project-creation tasks.

3. **Quality**
   • Ensure code is runnable and logically organized.
   • If multiple files are needed, include all required dependencies (e.g., requirements.txt) in the code blocks.

Follow these rules for every “create/build/generate” request.
"""

def generate_code_content(prompt_data):
    logging.debug(f"generate_code_content function called with data: {prompt_data}")

    messages = []
    # Check if prompt_data is a string (for backward compatibility and conversational history)
    if isinstance(prompt_data, str):
        # Handle conversational history string
        if "user:" in prompt_data.lower() or "assistant:" in prompt_data.lower():
            messages.append({"role": "system", "content": SYSTEM_PROMPT})
            # Split the string into turns
            turns = prompt_data.strip().split('\n')
            for turn in turns:
                if turn.lower().startswith("user:"):
                    messages.append({"role": "user", "content": turn[len("user:"):].strip()})
                elif turn.lower().startswith("assistant:"):
                    messages.append({"role": "assistant", "content": turn[len("assistant:"):].strip()})
        else: # It's a single user query
            messages = [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt_data}
            ]
    # Check if it's a list of dicts (standard message format)
    elif isinstance(prompt_data, list):
        # Assume it's already in the correct message format
        messages = prompt_data
        # Ensure system prompt is present
        if not any(m['role'] == 'system' for m in messages):
            messages.insert(0, {"role": "system", "content": SYSTEM_PROMPT})

    response_content = None
    
    if gemini_model:
        try:
            gemini_messages = []
            for msg in messages:
                if msg["role"] == "system":
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
    
    if response_content is None and openai_client:
        try:
            openai_response = openai_client.chat.completions.create(
                model="gpt-4",
                messages=messages
            )
            response_content = openai_response.choices[0].message.content
        except OpenAI.APIError as e:
            logging.error(f"OpenAI API error: {e}")
            response_content = json.dumps({"error": f"OpenAI API error: {e}"})
        except Exception as e:
            logging.error(f"An unexpected error occurred with OpenAI API: {e}", exc_info=True)
            response_content = json.dumps({"error": f"An unexpected OpenAI API error occurred."})

    if response_content is None:
        return json.dumps({"error": "Neither Gemini nor OpenAI API could generate a response. Please check API keys and service status."})
    
    try:
        error_data = json.loads(response_content)
        if "error" in error_data:
            return json.dumps(error_data)
    except json.JSONDecodeError:
        pass

    return response_content

