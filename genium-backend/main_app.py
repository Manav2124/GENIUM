import os
import tempfile
import requests
import json
from datetime import datetime
from flask import Flask, request, jsonify, Blueprint
from flask_cors import CORS
from dotenv import load_dotenv
from langchain_qdrant import QdrantVectorStore
import jwt
from functools import wraps
from qdrant_client import QdrantClient
from langchain_openai import OpenAIEmbeddings
from langchain_community.document_loaders import PyPDFLoader, TextLoader, Docx2txtLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
try:
    from langchain_community.vectorstores import FAISS
except ImportError:
    try:
        from langchain.vectorstores import FAISS
    except ImportError:
        print("Backend: FAISS not available, will use basic in-memory storage")
        FAISS = None
from openai import OpenAI
import google.generativeai as genai

# Load environment variables
load_dotenv(dotenv_path='../.env')

# Initialize Flask app
app = Flask(__name__)
CORS(app, supports_credentials=True, origins=["http://localhost:3000", "http://127.0.0.1:3000"])

# Get NextAuth secret from environment variables
NEXTAUTH_SECRET = os.getenv("NEXTAUTH_SECRET")
if not NEXTAUTH_SECRET:
    raise ValueError("NEXTAUTH_SECRET environment variable not set.")

# Initialize OpenAI client
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
print(f"DEBUG: OPENAI_API_KEY loaded: {'Yes' if OPENAI_API_KEY else 'No'}")
if OPENAI_API_KEY:
    key_prefix = OPENAI_API_KEY[:20] + "..." if len(OPENAI_API_KEY) > 20 else OPENAI_API_KEY
    print(f"DEBUG: OpenAI API key prefix: {key_prefix}")
    print(f"DEBUG: OpenAI API key length: {len(OPENAI_API_KEY)}")
    try:
        openai_client = OpenAI(api_key=OPENAI_API_KEY)
        print(f"DEBUG: OpenAI client initialized successfully.")
    except Exception as e:
        print(f"ERROR: Failed to initialize OpenAI client: {e}")
        openai_client = None
else:
    print(f"WARNING: OPENAI_API_KEY not found. OpenAI client will not be available.")
    openai_client = None

# Initialize Gemini client
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
print(f"DEBUG: GEMINI_API_KEY loaded: {'Yes' if GEMINI_API_KEY else 'No'}")
if GEMINI_API_KEY:
    key_prefix = GEMINI_API_KEY[:20] + "..." if len(GEMINI_API_KEY) > 20 else GEMINI_API_KEY
    print(f"DEBUG: Gemini API key prefix: {key_prefix}")
    print(f"DEBUG: Gemini API key length: {len(GEMINI_API_KEY)}")
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        gemini_model_name = 'gemini-2.5-pro-preview-03-25'
        gemini_model = genai.GenerativeModel(gemini_model_name)
        print(f"DEBUG: Gemini client initialized with model: {gemini_model_name}")
    except Exception as e:
        print(f"ERROR: Failed to initialize Gemini client: {e}")
        gemini_model = None
else:
    print("WARNING: GEMINI_API_KEY not found. Gemini API will not be available.")
    gemini_model = None

print("\n=== UNIFIED BACKEND STARTUP COMPLETE ===")
print(f"OpenAI Client: {'Available' if openai_client else 'Not Available'}")
print(f"Gemini Model: {'Available' if gemini_model else 'Not Available'}")
print("==========================================\n")

# Initialize Qdrant client
QDRANT_URL = os.getenv("QDRANT_URL")
qdrant_client = None
qdrant_available = False

if QDRANT_URL:
    try:
        qdrant_client = QdrantClient(url=QDRANT_URL)
        print(f"Backend: Qdrant client initialized successfully with URL: {QDRANT_URL}")
        collections = qdrant_client.get_collections()
        print(f"Backend: Qdrant connection test successful, found {len(collections.collections)} existing collections")
        qdrant_available = True
    except Exception as e:
        print(f"Backend: Failed to initialize Qdrant client with URL {QDRANT_URL}: {str(e)}")
        print("Backend: Qdrant not available, will use in-memory fallback storage")
else:
    print("WARNING: QDRANT_URL not found in environment variables. Qdrant will not be available.")
print(f"Backend: Qdrant available status: {qdrant_available}")

# Initialize embeddings model
embedding_model = OpenAIEmbeddings(model="text-embedding-3-large")

# Global variables for Documents & QA functionality
vector_db = {}
user_uploads = {}

# JWT required decorator
def jwt_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            print("Backend: Authorization header is missing")
            return jsonify({"error": "Authorization header is missing"}), 401

        try:
            if not auth_header.startswith("Bearer "):
                print(f"Backend: Invalid authorization header format: {auth_header[:20]}...")
                return jsonify({"error": "Invalid authorization header format. Expected 'Bearer <token>'"}), 401

            token = auth_header.split(" ")[1]
            if not token:
                print("Backend: Token part is empty after splitting")
                return jsonify({"error": "Invalid authorization header format"}), 401

            print(f"Backend: Received Authorization header: Bearer {token[:20]}...")
            print(f"Backend: Token length: {len(token)}")
            print(f"Backend: Using secret: {NEXTAUTH_SECRET[:10]}...")
            print(f"Backend: Full token (first 50 chars): {token[:50]}")
            print(f"Backend: Full token (last 50 chars): {token[-50:] if len(token) > 50 else token}")
            print(f"Backend: Token has {token.count('.')} dots (should be 2 for JWT)")

            token_parts = token.split('.')
            print(f"Backend: Token parts count: {len(token_parts)}")
            if len(token_parts) == 3:
                print(f"Backend: Token parts lengths: {[len(part) for part in token_parts]}")
                try:
                    import base64
                    header = base64.urlsafe_b64decode(token_parts[0] + '==')
                    print(f"Backend: Decoded header: {header.decode()}")
                except Exception as e:
                    print(f"Backend: Failed to decode header: {str(e)}")
            else:
                print(f"Backend: Token does not have 3 parts! Parts: {token_parts}")

            try:
                print(f"Backend: Attempting to decode JWT token...")
                payload = jwt.decode(token, NEXTAUTH_SECRET, algorithms=["HS256"])
                print(f"Backend: Successfully decoded JWT")
                print(f"Backend: Decoded payload keys: {list(payload.keys())}")
                print(f"Backend: Full decoded payload: {payload}")
                user_id = payload.get("sub") or payload.get("userId")
                print(f"Backend: Extracted user_id: {user_id}")
                if not user_id:
                    print("Backend: Token missing 'sub' or 'userId' claim")
                    return jsonify({"error": "Invalid token: missing user ID"}), 401

                if 'exp' in payload:
                    import time
                    current_time = time.time()
                    exp_time = payload['exp']
                    print(f"Backend: Token exp: {exp_time}, Current time: {current_time}")
                    print(f"Backend: Token expires at: {time.ctime(exp_time)}")
                    print(f"Backend: Current time: {time.ctime(current_time)}")
                    if exp_time < current_time:
                        print(f"Backend: Token expired. Exp: {exp_time}, Current: {current_time}")
                        return jsonify({"error": "Token has expired"}), 401
                else:
                    print("Backend: Token has no expiration claim")

            except jwt.ExpiredSignatureError as e:
                print(f"Backend: Token expired: {str(e)}")
                return jsonify({"error": "Token has expired. Please log in again."}), 401
            except jwt.InvalidSignatureError as e:
                print(f"Backend: Invalid token signature: {str(e)}")
                print(f"Backend: Expected signature with secret: {NEXTAUTH_SECRET[:10]}...")
                return jsonify({"error": "Invalid token signature"}), 401
            except jwt.InvalidTokenError as e:
                print(f"Backend: Invalid token error: {str(e)}")
                return jsonify({"error": "Invalid token"}), 401
            except Exception as e:
                print(f"Backend: Unexpected JWT error: {str(e)}")
                print(f"Backend: Error type: {type(e)}")
                import traceback
                print(f"Backend: Full traceback: {traceback.format_exc()}")
                return jsonify({"error": "Token validation failed"}), 401

            return f(user_id, *args, **kwargs)

        except IndexError as e:
            print(f"Backend: Error splitting authorization header: {str(e)}")
            return jsonify({"error": "Invalid authorization header format"}), 401
        except Exception as e:
            print(f"Backend: Unexpected authentication error: {str(e)}")
            return jsonify({"error": "Authentication failed"}), 401

    return decorated_function

# Copy core functions from app.py
def get_fallback_answer(query, context_available=True):
    """Provide a basic fallback answer when AI service is unavailable"""
    query_lower = query.lower()

    if any(word in query_lower for word in ['hello', 'hi', 'greetings']):
        return "Hello! I'm here to help you with questions about your documents. Please upload a document first if you haven't already."

    if any(word in query_lower for word in ['help', 'what can you do', 'how to use']):
        return "I can help you analyze documents and answer questions about their content. Upload a PDF, DOCX, or TXT file, then ask me questions about it. I can also search the web for additional information if you enable global search."

    if any(word in query_lower for word in ['upload', 'file', 'document']):
        return "To get started, please upload a document using the file upload section. I support PDF, DOCX, and TXT files up to 10MB in size."

    if context_available:
        return f"I understand you're asking about: '{query}'. I'm currently unable to provide a detailed AI-generated response. Please try again later when the service is back online."
    else:
        return f"I understand you're asking: '{query}'. Please upload a document first so I can help answer your questions about it."

def process_uploaded_file(file_storage):
    """Process uploaded PDF, DOCX, or text file and return chunks"""
    tmp_path = None
    try:
        print(f"Backend: Processing file: {file_storage.filename}, size: {file_storage.content_length} bytes")

        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file_storage.filename)[1]) as tmp:
            file_storage.save(tmp.name)
            tmp_path = tmp.name
            print(f"Backend: File saved to temporary path: {tmp_path}")

        filename_lower = file_storage.filename.lower()
        if filename_lower.endswith('.pdf'):
            print("Backend: Loading PDF file")
            loader = PyPDFLoader(file_path=tmp_path)
        elif filename_lower.endswith('.docx'):
            print("Backend: Loading DOCX file")
            loader = Docx2txtLoader(file_path=tmp_path)
        elif filename_lower.endswith('.txt'):
            print("Backend: Loading TXT file")
            loader = TextLoader(file_path=tmp_path)
        else:
            raise ValueError("Unsupported file type for processing.")

        print("Backend: Loading document content...")
        docs = loader.load()
        print(f"Backend: Loaded {len(docs)} document pages/sections")

        if not docs:
            raise ValueError("No content extracted from the file. It might be empty or corrupted.")

        if docs:
            first_doc_preview = docs[0].page_content[:200] + "..." if len(docs[0].page_content) > 200 else docs[0].page_content
            print(f"Backend: First document preview: {first_doc_preview}")

        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=400
        )
        print("Backend: Splitting document into chunks...")
        chunks = text_splitter.split_documents(documents=docs)
        print(f"Backend: Created {len(chunks)} chunks")

        if not chunks:
            raise ValueError("Failed to split document into chunks. Content might be too short or unprocessable.")

        total_chars = sum(len(chunk.page_content) for chunk in chunks)
        print(f"Backend: Total characters in chunks: {total_chars}")
        print(f"Backend: Average chunk size: {total_chars / len(chunks):.0f} characters")

        return chunks
    except Exception as e:
        print(f"Backend: Error in process_uploaded_file: {str(e)}")
        print(f"Backend: Error type: {type(e).__name__}")
        import traceback
        print(f"Backend: Full traceback: {traceback.format_exc()}")
        raise
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
            print("Backend: Cleaned up temporary file")

def initialize_vector_store(user_id, docs):
    global vector_db
    try:
        print(f"Backend: Initializing vector store for user {user_id}")
        print(f"Backend: Processing {len(docs)} document chunks")

        print("Backend: Creating embeddings and storing in vector database...")

        if qdrant_available and qdrant_client is not None:
            collection_name = f"user_{user_id}_documents"
            print(f"Backend: Using Qdrant collection: {collection_name}")
            vector_db[user_id] = QdrantVectorStore.from_documents(
                documents=docs,
                client=qdrant_client,
                collection_name=collection_name,
                embedding=embedding_model
            )
        elif FAISS is not None:
            print("Backend: Using FAISS in-memory storage as fallback")
            vector_db[user_id] = FAISS.from_documents(docs, embedding_model)
        else:
            print("Backend: Using basic in-memory storage (limited functionality)")
            vector_db[user_id] = {
                "type": "basic_memory",
                "documents": docs,
                "embeddings": [embedding_model.embed_query(doc.page_content) for doc in docs]
            }

        print(f"Backend: Successfully initialized vector store for user {user_id}")
        print(f"Backend: Vector database now contains {len(vector_db)} user collections")
        return True

    except Exception as e:
        print(f"Backend: Error initializing vector store for user {user_id}: {str(e)}")
        print(f"Backend: Error type: {type(e).__name__}")
        import traceback
        print(f"Backend: Vector store initialization traceback: {traceback.format_exc()}")
        if user_id in vector_db:
            del vector_db[user_id]
        return False

def search_google(query):
    google_api_key = os.getenv("GOOGLE_API_KEY")
    search_engine_id = os.getenv("GOOGLE_SEARCH_ENGINE_ID")

    if not google_api_key or not search_engine_id:
        return "Google search is not configured. Please set GOOGLE_API_KEY and GOOGLE_SEARCH_ENGINE_ID in your .env file."

    trusted_sites = [
        "site:geeksforgeeks.org",
        "site:tutorialspoint.com",
        "site:tpointtech.com"
    ]

    try:
        restricted_query = f"{query} {' OR '.join(trusted_sites)}"

        url = f"https://www.googleapis.com/customsearch/v1?key={google_api_key}&cx={search_engine_id}&q={restricted_query}&num=5"
        response = requests.get(url)
        response.raise_for_status()

        data = response.json()
        results = []

        if 'items' in data:
            for i, item in enumerate(data['items'][:5], 1):
                title = item.get('title', 'No title')
                link = item.get('link', 'No link')
                snippet = item.get('snippet', 'No description')

                is_trusted = any(trusted_domain in link.lower() for trusted_domain in ['geeksforgeeks.org', 'tutorialspoint.com', 'tpointtech.com'])

                if is_trusted:
                    results.append(f"[{i}] **[{title}]({link})**\n{snippet}")

        return "\n\n".join(results) if results else "No relevant results found from trusted educational sites. Please try rephrasing your question."
    except Exception as e:
        return f"Error performing Google search: {str(e)}"

# Copy functions from code_gene.py
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

# Create blueprints
docsqa_bp = Blueprint('docsqa', __name__, url_prefix='/docsqa')
promptcode_bp = Blueprint('promptcode', __name__, url_prefix='/promptcode')

# Documents & QA routes
@docsqa_bp.route('/health', methods=['GET'])
def docs_health():
    """Health check endpoint for Documents & QA"""
    health_status = {
        "status": "healthy",
        "service": "Documents & QA",
        "qdrant": "available" if qdrant_available else "not_available",
        "openai": "available" if openai_client else "not_available",
        "gemini": "available" if gemini_model else "not_available",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
    return jsonify(health_status), 200

@docsqa_bp.route('/upload', methods=['POST'])
def docs_upload():
    """Upload file endpoint for Documents & QA"""
    auth_header = request.headers.get('Authorization')
    user_id = None

    if auth_header and auth_header.startswith("Bearer "):
        try:
            token = auth_header.split(" ")[1]
            payload = jwt.decode(token, NEXTAUTH_SECRET, algorithms=["HS256"])
            user_id = payload.get("sub") or payload.get("userId")
            print(f"Backend: Authenticated user_id: {user_id}")
        except Exception as e:
            print(f"Backend: Token validation failed, proceeding with anonymous upload: {str(e)}")

    if not user_id:
        user_id = "anonymous"
        print(f"Backend: Using anonymous user_id: {user_id}")

    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    allowed_extensions = ['.pdf', '.docx', '.txt']
    filename_lower = file.filename.lower()
    if not any(filename_lower.endswith(ext) for ext in allowed_extensions):
        return jsonify({"error": "Invalid file type. Only PDF, DOCX, and TXT files are allowed"}), 400

    file.seek(0, 2)
    file_size = file.tell()
    file.seek(0)
    if file_size > 10 * 1024 * 1024:
        return jsonify({"error": "File size exceeds 10MB limit"}), 400

    try:
        print(f"Backend: Starting file upload processing for user {user_id}")
        print(f"Backend: File details - Name: {file.filename}, Size: {file_size} bytes")

        chunks = process_uploaded_file(file)
        if not chunks:
            print("Backend: No chunks returned from file processing")
            return jsonify({"error": "Failed to extract content from file. The file might be empty or corrupted."}), 400

        print(f"Backend: Successfully processed {len(chunks)} chunks")
        vector_store_success = initialize_vector_store(user_id, chunks)

        if user_id not in user_uploads:
            user_uploads[user_id] = []
        user_uploads[user_id].append({
            "file_name": file.filename,
            "file_size": file_size,
            "chunks_count": len(chunks),
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "vector_store_success": vector_store_success
        })

        if vector_store_success and user_id in vector_db and vector_db[user_id] is not None:
            print(f"Backend: Vector store successfully created for user {user_id}")
            print(f"Backend: Current vector_db keys: {list(vector_db.keys())}")
            print(f"Backend: User uploads tracking: {user_uploads}")
        else:
            print(f"Backend: Warning - Vector store may not have been created properly for user {user_id}")
            if qdrant_client is None:
                print("Backend: Qdrant service is not available")

        response_data = {
            "message": "File uploaded and processed successfully",
            "chunks_count": len(chunks),
            "user_id": user_id,
            "file_name": file.filename,
            "file_size": file_size,
            "vector_store_created": vector_store_success
        }

        print(f"Backend: Upload completed successfully: {response_data}")
        return jsonify(response_data), 200

    except ValueError as ve:
        print(f"Backend: Validation/Processing Error: {str(ve)}")
        return jsonify({"error": f"File processing failed: {str(ve)}"}), 400
    except Exception as e:
        print(f"Backend: Internal Server Error during file upload: {str(e)}")
        print(f"Backend: Error type: {type(e).__name__}")
        import traceback
        print(f"Backend: Upload error traceback: {traceback.format_exc()}")
        return jsonify({"error": "An unexpected error occurred while processing your file. Please try again later."}), 500

@docsqa_bp.route('/ask', methods=['POST'])
def docs_ask():
    """Ask question endpoint for Documents & QA"""
    data = request.get_json()
    if not data or 'question' not in data:
        return jsonify({"error": "Question not provided"}), 400

    auth_header = request.headers.get('Authorization')
    user_id = "anonymous"

    if auth_header and auth_header.startswith("Bearer "):
        try:
            token = auth_header.split(" ")[1]
            payload = jwt.decode(token, NEXTAUTH_SECRET, algorithms=["HS256"])
            user_id = payload.get("sub") or payload.get("userId") or "anonymous"
        except Exception as e:
            print(f"Token validation failed, using anonymous: {str(e)}")

    print(f"Backend: /docsqa/ask - Using user_id: {user_id}")
    question = data['question']
    global_search = data.get('globalSearch', False)

    # Simplified answer function
    global vector_db

    print(f"Backend: Processing query for user {user_id}: '{question[:50]}...'")

    if user_id not in vector_db or vector_db[user_id] is None:
        if qdrant_client is None:
            return jsonify({"error": "The document storage service is currently unavailable. Please try again later or contact support if the issue persists."}), 500
        else:
            return jsonify({"error": "No document has been uploaded yet. Please upload a PDF, DOCX, or TXT file first, then ask your questions."}), 400

    try:
        search_results = vector_db[user_id].similarity_search(query=question, k=5)
        context = "\n\n".join([
            f"Page Content: {result.page_content}\nPage Number: {result.metadata.get('page_label', 'N/A')}"
            for result in search_results
        ])
        print(f"Backend: Retrieved {len(search_results)} relevant chunks from vector database")

    except Exception as e:
        print(f"Backend: Error retrieving from vector database: {e}")
        return jsonify({"error": "Error accessing document database. Please try again or contact support."}), 500

    google_context = ""
    if global_search:
        try:
            google_results = search_google(question)
            if google_results:
                google_context = f"\n\nAdditional Information from Web Search:\n{google_results}"
                print("Backend: Added Google search results to context")
        except Exception as e:
            print(f"Backend: Google search failed: {e}")

    system_prompt = f"""
    You are a helpful AI Assistant who answers user queries based on the available context
    retrieved from a document. Provide detailed answers and include page references when available.

    CRITICAL FORMATTING INSTRUCTIONS:
    - Use ONLY standard markdown bold formatting: **text** for emphasis
    - NEVER use HTML tags like <b>, <strong>, or custom tags
    - Apply bold formatting to ALL important terms throughout your entire response
    - Highlight every key concept, definition, important word, and significant term with **bold**
    - Make your response visually rich by bolding terms like: **Database-Management System (DBMS)**, **primary**, **goal**, **important**, **key**, **essential**,
      **definition**, **concept**, **theory**, **principle**, **example**, **summary**, **conclusion**, **result**, **finding**, **analysis**,
      **database**, **system**, **collection**, **program**, **access**, **information**, **enterprise**, **storage**, **mechanism**,
      **safety**, **crash**, **unauthorized**, **access**, **share**, **user**, **anomalous**, **result**

    {google_context}

    Context:
    {context}
    """

    answer = None
    api_used = None

    if gemini_model and GEMINI_API_KEY:
        try:
            print("Backend: Attempting to use Gemini API...")
            gemini_messages = [
                {'role': 'user', 'parts': [system_prompt]},
                {'role': 'user', 'parts': [question]}
            ]
            gemini_response = gemini_model.generate_content(
                gemini_messages,
                safety_settings={
                    'HARASSMENT': 'BLOCK_NONE',
                    'HATE_SPEECH': 'BLOCK_NONE',
                    'SEXUALLY_EXPLICIT': 'BLOCK_NONE',
                    'DANGEROUS_CONTENT': 'BLOCK_NONE'
                }
            )
            if gemini_response and gemini_response.candidates:
                answer = gemini_response.candidates[0].content.parts[0].text
                api_used = "Gemini"
                print("Backend: Successfully generated response using Gemini API")
            else:
                print("Backend: Gemini API returned empty response")
        except Exception as e:
            error_msg = str(e).lower()
            print(f"Backend: Gemini API failed: {e}")

    if answer is None and openai_client and OPENAI_API_KEY:
        try:
            print("Backend: Falling back to OpenAI API...")
            openai_response = openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": question},
                ],
                max_tokens=1000,
                temperature=0.1
            )
            if openai_response and openai_response.choices:
                answer = openai_response.choices[0].message.content
                api_used = "OpenAI"
                print("Backend: Successfully generated response using OpenAI API")
            else:
                print("Backend: OpenAI API returned empty response")
        except Exception as e:
            error_msg = str(e).lower()
            print(f"Backend: OpenAI API failed: {e}")

    if answer is None:
        print("Backend: Both Gemini and OpenAI APIs failed - using fallback response")
        answer = get_fallback_answer(question, True)

    answer = answer.replace('"highlight-keyword">', '').replace('"highlight-phrase">', '')
    print(f"Backend: Successfully generated response using {api_used} API ({len(answer)} characters)")

    return jsonify({"answer": answer}), 200

# Prompt to Code routes
@promptcode_bp.route('/health', methods=['GET'])
def code_health():
    """Health check endpoint for Prompt to Code"""
    health_status = {
        "status": "healthy",
        "service": "Prompt to Code",
        "openai": "available" if openai_client else "not_available",
        "gemini": "available" if gemini_model else "not_available",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
    return jsonify(health_status), 200

@promptcode_bp.route('/generate-code', methods=['POST'])
def code_generate():
    """Generate code endpoint for Prompt to Code"""
    print(f"Backend: Prompt to Code generate endpoint called")
    print(f"DEBUG: OPENAI_API_KEY status: {'Present' if OPENAI_API_KEY else 'Missing'}")
    print(f"DEBUG: GEMINI_API_KEY status: {'Present' if GEMINI_API_KEY else 'Missing'}")

    if not gemini_model and not openai_client:
        print("Backend: Neither Gemini nor OpenAI API keys are configured")
        return jsonify({"error": "Neither Gemini nor OpenAI API keys are configured. Please check your .env file."}), 500

    data = request.get_json()
    print(f"DEBUG: Request data: {data}")
    user_query = data.get('prompt')

    if not user_query:
        return jsonify({"error": "Prompt is required"}), 400

    print(f"Backend: Processing code generation request: '{user_query[:50]}...'")

    messages = [
        { "role": "system", "content": SYSTEM_PROMPT },
        { "role": "user", "content": user_query }
    ]

    api_used = None

    while True:
        response_content = None
        parsed_response = None

        if gemini_model and GEMINI_API_KEY:
            try:
                print("Backend: Attempting to use Gemini API for code generation...")
                gemini_messages = []
                system_instruction_content = ""
                for msg in messages:
                    if msg["role"] == "system":
                        system_instruction_content = msg["content"]
                    elif msg["role"] == "user":
                        if system_instruction_content:
                            gemini_messages.append({'role': 'user', 'parts': [system_instruction_content + "\n" + msg["content"]]})
                            system_instruction_content = ""
                        else:
                            gemini_messages.append({'role': 'user', 'parts': [msg["content"]]})
                    elif msg["role"] == "assistant":
                        gemini_messages.append({'role': 'model', 'parts': [msg["content"]]})

                if system_instruction_content and not gemini_messages:
                    gemini_messages.append({'role': 'user', 'parts': [system_instruction_content]})

                gemini_response = gemini_model.generate_content(
                    gemini_messages,
                    safety_settings={
                        'HARASSMENT': 'BLOCK_NONE',
                        'HATE_SPEECH': 'BLOCK_NONE',
                        'SEXUALLY_EXPLICIT': 'BLOCK_NONE',
                        'DANGEROUS_CONTENT': 'BLOCK_NONE'
                    }
                )
                response_content = gemini_response.candidates[0].content.parts[0].text
                parsed_response = json.loads(response_content)
                messages.append({ "role": "assistant", "content": response_content })
                api_used = "Gemini"
                print("Backend: Successfully processed with Gemini API")
            except Exception as e:
                error_msg = str(e).lower()
                print(f"Backend: Gemini API failed for code generation: {e}")

                response_content = json.dumps({"error": f"Gemini API error: {e}"})
                parsed_response = None

        if parsed_response is None and openai_client and OPENAI_API_KEY:
            try:
                print("Backend: Falling back to OpenAI API for code generation...")
                openai_response = openai_client.chat.completions.create(
                    model="gpt-4",
                    response_format={"type": "json_object"},
                    messages=messages
                )
                response_content = openai_response.choices[0].message.content
                parsed_response = json.loads(response_content)
                messages.append({ "role": "assistant", "content": response_content })
                api_used = "OpenAI"
                print("Backend: Successfully processed with OpenAI API")
            except Exception as e:
                error_msg = str(e).lower()
                print(f"Backend: OpenAI API failed for code generation: {e}")

                response_content = json.dumps({"error": f"OpenAI API error: {e}"})
                parsed_response = None

        if parsed_response is None:
            print("Backend: Both APIs failed for code generation")
            if response_content:
                try:
                    error_data = json.loads(response_content)
                    return jsonify({"error": error_data.get("error", "Unknown API error.")}), 500
                except json.JSONDecodeError:
                    return jsonify({"error": f"API error: {response_content}"}), 500
            else:
                return jsonify({"error": "Neither Gemini nor OpenAI API could generate a response. Please check API keys and service status."}), 500

        if parsed_response.get("step") == "plan":
            print(f"Backend: AI planning step - {parsed_response.get('content')[:50]}...")
            messages.append({ "role": "user", "content": json.dumps({ "step": "observe", "output": f"🧠: {parsed_response.get('content')}" }) })
            continue

        if parsed_response.get("step") == "action":
            tool_name = parsed_response.get("function")
            tool_input = parsed_response.get("input")
            print(f"Backend: AI action step - Tool: {tool_name}, Input: {tool_input[:30]}...")

            if available_tools.get(tool_name):
                output = available_tools[tool_name](tool_input)
                messages.append({ "role": "user", "content": json.dumps({ "step": "observe", "output": output }) })
                print(f"Backend: Tool executed successfully: {tool_name}")
                continue
            else:
                error_msg = f"Error: Tool {tool_name} not found."
                messages.append({ "role": "user", "content": json.dumps({ "step": "observe", "output": error_msg }) })
                print(f"Backend: Tool not found: {tool_name}")
                continue

        if parsed_response.get("step") == "output":
            code_result = parsed_response.get('content')
            print(f"Backend: Code generation completed using {api_used} API ({len(code_result) if code_result else 0} characters)")
            return jsonify({"code": code_result})

# Register blueprints with the main app
app.register_blueprint(docsqa_bp)
app.register_blueprint(promptcode_bp)

# Root endpoint
@app.route('/', methods=['GET'])
def index():
    return jsonify({
        "message": "Unified Genium Backend Server is running",
        "services": {
            "docsqa": "/docsqa - Documents & QA endpoints",
            "promptcode": "/promptcode - Prompt to Code endpoints"
        },
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }), 200

# Unified health check
@app.route('/health', methods=['GET'])
def unified_health():
    """Unified health check for all services"""
    health_status = {
        "status": "healthy",
        "services": {
            "flask": "running",
            "docsqa": {
                "qdrant": "available" if qdrant_available else "not_available",
                "openai": "available" if openai_client else "not_available",
                "gemini": "available" if gemini_model else "not_available"
            },
            "promptcode": {
                "openai": "available" if openai_client else "not_available",
                "gemini": "available" if gemini_model else "not_available"
            }
        },
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

    # Determine overall status
    if any(status in ["error", "auth_error", "not_configured"] for service in health_status["services"].values() if isinstance(service, dict) for status in service.values()):
        health_status["status"] = "degraded"

    return jsonify(health_status), 200

if __name__ == '__main__':
    print("Starting unified backend server...")
    print("Documents & QA endpoints available at: /docsqa/*")
    print("Prompt to Code endpoints available at: /promptcode/*")
    app.run(host='0.0.0.0', port=5000, debug=True)