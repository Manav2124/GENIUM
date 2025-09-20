from openai import OpenAI
from datetime import datetime
import json
import requests
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai # Import Google Generative AI

# Manually load environment variables from .env file
def load_env_vars(env_path):
    env_vars = {}
    try:
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    key, value = line.split('=', 1)
                    env_vars[key.strip()] = value.strip()
    except FileNotFoundError:
        print(f"WARNING: .env file not found at {env_path}")
    return env_vars

def get_gemini_model_name():
    try:
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                # Prefer newer models if available, otherwise fallback
                if 'gemini-2.5-flash' in m.name: # Prioritize Gemini 2.5 Flash
                    return m.name
                if 'gemini-2.5-pro' in m.name:
                    return m.name
                if 'gemini-pro' in m.name:
                    return m.name
        print("WARNING: No suitable Gemini model found with 'generateContent' support. Defaulting to 'gemini-2.5-flash'.")
        return 'gemini-2.5-flash' # Fallback if listing fails or no suitable model found
    except Exception as e:
        print(f"WARNING: Could not list Gemini models: {e}. Defaulting to 'gemini-2.5-flash'.")
        return 'gemini-2.5-flash'

# Determine the path to the .env file
script_dir = os.path.dirname(os.path.abspath(__file__))
dotenv_path = os.path.join(script_dir, '.env')
env_config = load_env_vars(dotenv_path)

# Initialize OpenAI client
OPENAI_API_KEY = env_config.get("OPENAI_API_KEY")
openai_client = None
if OPENAI_API_KEY:
    openai_client = OpenAI(api_key=OPENAI_API_KEY)
    print(f"DEBUG: OpenAI client initialized.")
else:
    print(f"DEBUG: OPENAI_API_KEY not found. OpenAI client will not be available.")

# Initialize Gemini client
GEMINI_API_KEY = env_config.get("GOOGLE_API_KEY") # Assuming GOOGLE_API_KEY is used for Gemini
print(f"DEBUG: GEMINI_API_KEY loaded: {'Yes' if GEMINI_API_KEY else 'No'}")
gemini_model = None
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model_name = get_gemini_model_name()
    gemini_model = genai.GenerativeModel(gemini_model_name)
    print(f"DEBUG: Gemini client initialized with model: {gemini_model_name}")
else:
    print("WARNING: GEMINI_API_KEY not found. Gemini API will not be available.")

# Add a check for API keys at the start of generate_code
@app.route('/generate-code', methods=['POST'])
def generate_code():
    print(f"DEBUG: OPENAI_API_KEY status: {'Present' if OPENAI_API_KEY else 'Missing'}")
    print(f"DEBUG: GEMINI_API_KEY status: {'Present' if GEMINI_API_KEY else 'Missing'}")

    if not gemini_model and not openai_client:
        return jsonify({"error": "Neither Gemini nor OpenAI API keys are configured. Please check your .env file."}), 500

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

def run_command(cmd: str):
    result = os.system(cmd)
    return result

def get_weather(city: str):
    url = f"https://wttr.in/{city}?format=%C+%t"
    response = requests.get(url)

    if response.status_code == 200:
        return f"The weather in {city} is {response.text}."
    
    return "Something went wrong"

available_tools = {
    "get_weather": get_weather,
    "run_command": run_command
}

SYSTEM_PROMPT = f"""
    You are an helpfull AI Assistant who is specialized in resolving user query.
    You work on start, plan, action, observe mode.

    For the given user query and available tools, plan the step by step execution, based on the planning,
    select the relevant tool from the available tool. and based on the tool selection you perform an action to call the tool.

    Wait for the observation and based on the observation from the tool call resolve the user query.

    Rules:
    - Follow the Output JSON Format.
    - Always perform one step at a time and wait for next input
    - Carefully analyse the user query

    Output JSON Format:
    {{
        "step": "string",
        "content": "string",
        "function": "The name of function if the step is action",
        "input": "The input parameter for the function",
    }}

    Available Tools:
    - "get_weather": Takes a city name as an input and returns the current weather for the city
    - "run_command": Takes linux command as a string and executes the command and returns the output after executing it.

    Example:
    User Query: What is the weather of new york?
    Output: {{ "step": "plan", "content": "The user is interseted in weather data of new york" }}
    Output: {{ "step": "plan", "content": "From the available tools I should call get_weather" }}
    Output: {{ "step": "action", "function": "get_weather", "input": "new york" }}
    Output: {{ "step": "observe", "output": "12 Degree Cel" }}
    Output: {{ "step": "output", "content": "The weather for new york seems to be 12 degrees." }}

"""

@app.route('/', methods=['GET'])
def index():
    return jsonify({"message": "Backend server is running"}), 200

@app.route('/generate-code', methods=['POST'])
def generate_code():
    data = request.get_json()
    print(f"DEBUG: /generate-code endpoint called with data: {data}")
    user_query = data.get('prompt')

    if not user_query:
        return jsonify({"error": "Prompt is required"}), 400

    messages = [
        { "role": "system", "content": SYSTEM_PROMPT },
        { "role": "user", "content": user_query }
    ]

    while True:
        response_content = None
        parsed_response = None
        
        if gemini_model:
            try:
                gemini_messages = []
                system_instruction_content = ""
                for msg in messages:
                    if msg["role"] == "system":
                        system_instruction_content = msg["content"]
                    elif msg["role"] == "user":
                        # Prepend system instruction to the first user message
                        if system_instruction_content:
                            gemini_messages.append({'role': 'user', 'parts': [system_instruction_content + "\n" + msg["content"]]})
                            system_instruction_content = "" # Clear after use
                        else:
                            gemini_messages.append({'role': 'user', 'parts': [msg["content"]]})
                    elif msg["role"] == "assistant":
                        gemini_messages.append({'role': 'model', 'parts': [msg["content"]]})
                
                # Ensure the system instruction is not lost if there are no user messages after it
                if system_instruction_content and not gemini_messages:
                    gemini_messages.append({'role': 'user', 'parts': [system_instruction_content]})

                gemini_response = gemini_model.generate_content(gemini_messages)
                response_content = gemini_response.candidates[0].content.parts[0].text
                parsed_response = json.loads(response_content)
                messages.append({ "role": "assistant", "content": response_content })
            except Exception as e:
                print(f"Gemini API error: {e}")
                import traceback
                traceback.print_exc() # Print full traceback for debugging
                response_content = json.dumps({"error": f"Gemini API error: {e}"}) # Include error in response
                parsed_response = None # Reset to try OpenAI
        
        if parsed_response is None and openai_client: # Only try OpenAI if Gemini failed or not available
            try:
                openai_response = openai_client.chat.completions.create(
                    model="gpt-4.1",
                    response_format={"type": "json_object"},
                    messages=messages
                )
                response_content = openai_response.choices[0].message.content
                parsed_response = json.loads(response_content)
                messages.append({ "role": "assistant", "content": response_content })
            except Exception as e:
                print(f"OpenAI API error: {e}")
                import traceback
                traceback.print_exc() # Print full traceback for debugging
                response_content = json.dumps({"error": f"OpenAI API error: {e}"}) # Include error in response
                parsed_response = None

        if parsed_response is None:
            # If response_content was set by an exception, use that error
            if response_content:
                try:
                    error_data = json.loads(response_content)
                    return jsonify({"error": error_data.get("error", "Unknown API error.")}), 500
                except json.JSONDecodeError:
                    return jsonify({"error": f"API error: {response_content}"}), 500
            else:
                return jsonify({"error": "Neither Gemini nor OpenAI API could generate a response. Please check API keys and service status."}), 500


        if parsed_response.get("step") == "plan":
            messages.append({ "role": "user", "content": json.dumps({ "step": "observe", "output": f"🧠: {parsed_response.get('content')}" }) })
            continue

        if parsed_response.get("step") == "action":
            tool_name = parsed_response.get("function")
            tool_input = parsed_response.get("input")

            if available_tools.get(tool_name):
                output = available_tools[tool_name](tool_input)
                messages.append({ "role": "user", "content": json.dumps({ "step": "observe", "output": output }) })
                continue
            else:
                messages.append({ "role": "user", "content": json.dumps({ "step": "observe", "output": f"Error: Tool {tool_name} not found." }) })
                continue
        
        if parsed_response.get("step") == "output":
            return jsonify({"code": parsed_response.get('content')})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002)