
import os
import tempfile
import requests
# Removed json import
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from langchain_qdrant import QdrantVectorStore
import jwt # Import PyJWT
from functools import wraps # Import wraps for decorator
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
# Removed datetime and uuid imports

# Load environment variables
load_dotenv()

# Removed user data directory setup

# Initialize Flask app
app = Flask(__name__)
CORS(app, supports_credentials=True, origins=["http://localhost:3000", "http://127.0.0.1:3000"])  # Enable CORS with credentials for localhost

# Get NextAuth secret from environment variables
NEXTAUTH_SECRET = os.getenv("NEXTAUTH_SECRET")
if not NEXTAUTH_SECRET:
    raise ValueError("NEXTAUTH_SECRET environment variable not set.")

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Initialize embeddings model
embedding_model = OpenAIEmbeddings(model="text-embedding-3-large")

def jwt_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            print("Backend: Authorization header is missing")
            return jsonify({"error": "Authorization header is missing"}), 401

        try:
            # Check if header starts with "Bearer "
            if not auth_header.startswith("Bearer "):
                print(f"Backend: Invalid authorization header format: {auth_header[:20]}...")
                return jsonify({"error": "Invalid authorization header format. Expected 'Bearer <token>'"}), 401

            token = auth_header.split(" ")[1]  # Expect "Bearer <token>"
            if not token:
                print("Backend: Token part is empty after splitting")
                return jsonify({"error": "Invalid authorization header format"}), 401

            print(f"Backend: Received Authorization header: Bearer {token[:20]}...")
            print(f"Backend: Token length: {len(token)}")
            print(f"Backend: Using secret: {NEXTAUTH_SECRET[:10]}...")
            print(f"Backend: Full token (first 50 chars): {token[:50]}")
            print(f"Backend: Full token (last 50 chars): {token[-50:] if len(token) > 50 else token}")
            print(f"Backend: Token has {token.count('.')} dots (should be 2 for JWT)")

            # Additional token validation
            token_parts = token.split('.')
            print(f"Backend: Token parts count: {len(token_parts)}")
            if len(token_parts) == 3:
                print(f"Backend: Token parts lengths: {[len(part) for part in token_parts]}")
                try:
                    import base64
                    # Try to decode header
                    header = base64.urlsafe_b64decode(token_parts[0] + '==')
                    print(f"Backend: Decoded header: {header.decode()}")
                except Exception as e:
                    print(f"Backend: Failed to decode header: {str(e)}")
            else:
                print(f"Backend: Token does not have 3 parts! Parts: {token_parts}")

            # Decode and validate JWT
            try:
                print(f"Backend: Attempting to decode JWT token...")
                payload = jwt.decode(token, NEXTAUTH_SECRET, algorithms=["HS256"])
                print(f"Backend: Successfully decoded JWT")
                print(f"Backend: Decoded payload keys: {list(payload.keys())}")
                print(f"Backend: Full decoded payload: {payload}")
                user_id = payload.get("sub") or payload.get("userId")  # Extract user ID from 'sub' or 'userId' claim
                print(f"Backend: Extracted user_id: {user_id}")
                if not user_id:
                    print("Backend: Token missing 'sub' or 'userId' claim")
                    return jsonify({"error": "Invalid token: missing user ID"}), 401

                # Optional: Check token expiration manually (though jwt.decode already does this)
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

            # Pass the user_id to the decorated function
            return f(user_id, *args, **kwargs)

        except IndexError as e:
            print(f"Backend: Error splitting authorization header: {str(e)}")
            return jsonify({"error": "Invalid authorization header format"}), 401
        except Exception as e:
            print(f"Backend: Unexpected authentication error: {str(e)}")
            return jsonify({"error": "Authentication failed"}), 401

    return decorated_function

# Initialize Qdrant client (persistent storage)
try:
    qdrant_client = QdrantClient(host="localhost", port=6333)
    print("Backend: Qdrant client initialized successfully")
    # Test the connection
    collections = qdrant_client.get_collections()
    print(f"Backend: Qdrant connection test successful, found {len(collections.collections)} existing collections")
    qdrant_available = True
except Exception as e:
    print(f"Backend: Failed to initialize Qdrant client: {str(e)}")
    print("Backend: Qdrant not available, will use in-memory fallback storage")
    qdrant_client = None
    qdrant_available = False

# In-memory storage for vector database (will be replaced by user-specific Qdrant collections)
vector_db = {} # Dictionary to hold user-specific vector dbs

# Track uploaded files per user for debugging
user_uploads = {} # Dictionary to track user uploads

# --- Functions ---

def get_fallback_answer(query, context_available=True):
    """Provide a basic fallback answer when AI service is unavailable"""
    query_lower = query.lower()

    # Basic keyword-based responses
    if any(word in query_lower for word in ['hello', 'hi', 'greetings']):
        return "Hello! I'm here to help you with questions about your documents. Please upload a document first if you haven't already."

    if any(word in query_lower for word in ['help', 'what can you do', 'how to use']):
        return "I can help you analyze documents and answer questions about their content. Upload a PDF, DOCX, or TXT file, then ask me questions about it. I can also search the web for additional information if you enable global search."

    if any(word in query_lower for word in ['upload', 'file', 'document']):
        return "To get started, please upload a document using the file upload section. I support PDF, DOCX, and TXT files up to 10MB in size."

    if context_available:
        return f"I understand you're asking about: '{query}'. I've analyzed your document, but I'm currently unable to provide a detailed AI-generated response. Please try again later when the service is back online."
    else:
        return f"I understand you're asking: '{query}'. Please upload a document first so I can help answer your questions about it."

# --- Functions ---

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
            # This case should ideally be caught by earlier validation, but as a safeguard
            raise ValueError("Unsupported file type for processing.")

        print("Backend: Loading document content...")
        docs = loader.load()
        print(f"Backend: Loaded {len(docs)} document pages/sections")

        if not docs:
            raise ValueError("No content extracted from the file. It might be empty or corrupted.")

        # Log some content for debugging
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

        # Log chunk information
        total_chars = sum(len(chunk.page_content) for chunk in chunks)
        print(f"Backend: Total characters in chunks: {total_chars}")
        print(f"Backend: Average chunk size: {total_chars / len(chunks):.0f} characters")

        return chunks
    except Exception as e:
        print(f"Backend: Error in process_uploaded_file: {str(e)}")
        print(f"Backend: Error type: {type(e).__name__}")
        import traceback
        print(f"Backend: Full traceback: {traceback.format_exc()}")
        raise # Re-raise the exception to be caught by the calling function
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
            print("Backend: Cleaned up temporary file")

def initialize_vector_store(user_id, docs):
    global vector_db
    try:
        print(f"Backend: Initializing vector store for user {user_id}")
        print(f"Backend: Processing {len(docs)} document chunks")

        # Create embeddings and store in vector database
        print("Backend: Creating embeddings and storing in vector database...")

        if qdrant_available and qdrant_client is not None:
            # Use Qdrant for persistent storage
            collection_name = f"user_{user_id}_documents"
            print(f"Backend: Using Qdrant collection: {collection_name}")
            vector_db[user_id] = QdrantVectorStore.from_documents(
                documents=docs,
                client=qdrant_client,
                collection_name=collection_name,
                embedding=embedding_model
            )
        elif FAISS is not None:
            # Use FAISS as fallback in-memory storage
            print("Backend: Using FAISS in-memory storage as fallback")
            vector_db[user_id] = FAISS.from_documents(docs, embedding_model)
        else:
            # Basic in-memory storage as last resort
            print("Backend: Using basic in-memory storage (limited functionality)")
            # Store documents directly for basic search
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
        # Clean up any partial state
        if user_id in vector_db:
            del vector_db[user_id]
        return False

def get_answer(user_id, query, global_search=False):
    global vector_db
    context = ""
    document_uploaded = user_id in vector_db and vector_db[user_id] is not None

    if document_uploaded:
        search_results = vector_db[user_id].similarity_search(query=query)
        context = "\n\n".join([
            f"Page Content: {result.page_content}\nPage Number: {result.metadata.get('page_label', 'N/A')}"
            for result in search_results
        ])
    elif not global_search:
        return "No document has been uploaded yet. Please upload a PDF, DOCX, or TXT file first, or enable global search to ask general questions."

    # If global search is enabled, fetch additional information from Google
    google_context = ""
    if global_search:
        google_results = search_google(query)
        if google_results:
            google_context = f"\n\nAdditional Information from Web Search:\n{google_results}"

    if not context and not google_context:
        return "I couldn't find any information from your document or the web to answer your question."

    system_prompt = f"""
    You are a helpful AI Assistant who answers user queries based on the available context.
    If context from a document is available, prioritize it. If not, use the web search results.
    Provide detailed answers and include page references when available.

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

    Context from Document:
    {context if context else "No document context available."}
    """

    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": query},
        ]
    )
    answer = response.choices[0].message.content
    # Post-process to remove unwanted highlight tags
    answer = answer.replace('"highlight-keyword">', '').replace('"highlight-phrase">', '')
    return answer

def get_document_answer(user_id, query):
    """Get answer from document only"""
    global vector_db

    print(f"Backend: Processing document question for user {user_id}")
    print(f"Backend: Question: {query}")

    print(f"Backend: Checking vector database for user {user_id}")
    print(f"Backend: Current vector_db keys: {list(vector_db.keys())}")
    print(f"Backend: User uploads tracking: {user_uploads.get(user_id, 'No uploads tracked')}")

    if user_id not in vector_db or vector_db[user_id] is None:
        print(f"Backend: Vector database not initialized for user {user_id}")
        if not qdrant_available:
            return "The document storage service is currently unavailable. Please try again later or contact support if the issue persists."
        else:
            # Check if user has uploaded files before
            user_has_uploads = user_id in user_uploads and len(user_uploads[user_id]) > 0
            if user_has_uploads:
                return "Your document was uploaded but the vector database needs to be reinitialized. Please upload your document again."
            else:
                return "No document has been uploaded yet. Please upload a PDF, DOCX, or TXT file first, then ask your questions."

    try:
        # Check if using basic in-memory storage
        if isinstance(vector_db[user_id], dict) and vector_db[user_id].get("type") == "basic_memory":
            print("Backend: Using basic in-memory search...")
            # Simple text-based search for basic storage
            query_lower = query.lower()
            documents = vector_db[user_id]["documents"]
            embeddings = vector_db[user_id]["embeddings"]

            # Calculate similarities (simple cosine similarity)
            query_embedding = embedding_model.embed_query(query)
            similarities = []
            for i, doc_embedding in enumerate(embeddings):
                # Simple dot product similarity
                similarity = sum(a * b for a, b in zip(query_embedding, doc_embedding))
                similarities.append((similarity, documents[i]))

            # Sort by similarity and take top 5
            similarities.sort(reverse=True, key=lambda x: x[0])
            search_results = [doc for _, doc in similarities[:5]]

            print(f"Backend: Found {len(search_results)} similar chunks using basic search")
        else:
            # Use standard vector store similarity search
            print("Backend: Performing similarity search...")
            search_results = vector_db[user_id].similarity_search(query=query, k=5)

        print(f"Backend: Found {len(search_results)} similar chunks")

        if not search_results:
            print("Backend: No search results found")
            return "No relevant information found in the document for your question. Please try rephrasing your question or upload a different document."

        # Log search results for debugging
        for i, result in enumerate(search_results[:3]):  # Log first 3 results
            content_preview = result.page_content[:150] + "..." if len(result.page_content) > 150 else result.page_content
            print(f"Backend: Search result {i+1}: Page {result.metadata.get('page_label', 'N/A')} - {content_preview}")

        context = "\n\n".join([
            f"Page Content: {result.page_content}\nPage Number: {result.metadata.get('page_label', 'N/A')}"
            for result in search_results
        ])

        print(f"Backend: Context length: {len(context)} characters")

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

        Context:
        {context}
        """

        print("Backend: Making OpenAI API call...")

        # Make OpenAI API call with error handling
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query},
            ],
            max_tokens=1000,
            temperature=0.1
        )

        if not response.choices or not response.choices[0].message.content:
            print("Backend: OpenAI returned empty response")
            return "I couldn't generate a response. The AI service may be temporarily unavailable. Please try again later."

        answer = response.choices[0].message.content
        # Post-process to remove unwanted highlight tags
        answer = answer.replace('"highlight-keyword">', '').replace('"highlight-phrase">', '')
        print(f"Backend: Generated answer (length: {len(answer)} characters)")
        print(f"Backend: Answer preview: {answer[:200]}...")

        return answer

    except Exception as e:
        error_message = str(e).lower()
        print(f"Backend: Document answer error: {str(e)}")
        print(f"Backend: Error type: {type(e).__name__}")

        # Handle specific OpenAI API errors
        if "invalid api key" in error_message or "authentication" in error_message:
            print("Backend: OpenAI authentication error")
            return "Authentication failed. Please check your OpenAI API key configuration."
        elif "rate limit" in error_message:
            print("Backend: OpenAI rate limit exceeded")
            return "Rate limit exceeded. Please wait a moment before trying again."
        elif "model not found" in error_message or "does not exist" in error_message:
            print("Backend: OpenAI model not found")
            return "The AI model is currently unavailable. Please try again later."
        elif "timeout" in error_message or "connection" in error_message:
            print("Backend: Connection timeout")
            return "Connection timeout. Please check your internet connection and try again."
        else:
            # Log the actual error for debugging but return a user-friendly message
            import traceback
            print(f"Backend: Full traceback: {traceback.format_exc()}")
            # Provide fallback response when AI service fails
            return get_fallback_answer(query, True)

def get_google_answer(query):
    """Get answer from Google search only"""
    try:
        google_results = search_google(query)
        if not google_results:
            return "No relevant web results found for your question. Please try rephrasing or check your internet connection."

        system_prompt = f"""
        You are a helpful AI Assistant. Based on the following web search results from trusted educational sites,
        provide a comprehensive answer to the user's question. Include relevant links
        and format the response clearly.

        CRITICAL FORMATTING INSTRUCTIONS:
        - Use ONLY standard markdown bold formatting: **text** for emphasis
        - NEVER use HTML tags like <b>, <strong>, or custom tags
        - Apply bold formatting to ALL important terms throughout your entire response
        - Highlight every key concept, definition, important word, and significant term with **bold**
        - Make your response visually rich by bolding terms like: **Database-Management System (DBMS)**, **primary**, **goal**, **important**, **key**, **essential**,
          **definition**, **concept**, **theory**, **principle**, **example**, **summary**, **conclusion**, **result**, **finding**, **analysis**,
          **database**, **system**, **collection**, **program**, **access**, **information**, **enterprise**, **storage**, **mechanism**,
          **safety**, **crash**, **unauthorized**, **access**, **share**, **user**, **anomalous**, **result**

        Web Search Results:
        {google_results}
        """

        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query},
            ],
            max_tokens=1000,
            temperature=0.1
        )

        if not response.choices or not response.choices[0].message.content:
            return "I couldn't generate a response from the web search results. Please try again later."

        answer = response.choices[0].message.content
        # Post-process to remove unwanted highlight tags
        answer = answer.replace('"highlight-keyword">', '').replace('"highlight-phrase">', '')
        return answer

    except Exception as e:
        error_message = str(e).lower()

        # Handle specific Google search errors
        if "api key" in error_message or "authentication" in error_message:
            return "Google search is not properly configured. Please check the API key settings."
        elif "quota" in error_message or "limit" in error_message:
            return "Google search quota exceeded. Web search is temporarily unavailable."
        elif "timeout" in error_message or "connection" in error_message:
            return "Connection timeout while searching the web. Please check your internet connection."
        else:
            # Log the actual error for debugging but return a user-friendly message
            print(f"Google answer error: {str(e)}")
            return f"I couldn't access web search results for your question: '{query}'. The web search service may be temporarily unavailable. You can still get answers from your uploaded document."

def search_google(query):
    """Search Google using Custom Search API and return formatted results with clickable links, restricted to trusted sites"""
    google_api_key = os.getenv("GOOGLE_API_KEY")
    search_engine_id = os.getenv("GOOGLE_SEARCH_ENGINE_ID")

    if not google_api_key or not search_engine_id:
        return "Google search is not configured. Please set GOOGLE_API_KEY and GOOGLE_SEARCH_ENGINE_ID in your .env file."

    # Define trusted sites for restricted search
    trusted_sites = [
        "site:geeksforgeeks.org",
        "site:tutorialspoint.com",
        "site:tpointtech.com"
    ]

    try:
        # Create search query with site restrictions
        restricted_query = f"{query} {' OR '.join(trusted_sites)}"

        url = f"https://www.googleapis.com/customsearch/v1?key={google_api_key}&cx={search_engine_id}&q={restricted_query}&num=5"
        response = requests.get(url)
        response.raise_for_status()

        data = response.json()
        results = []

        if 'items' in data:
            for i, item in enumerate(data['items'][:5], 1):  # Limit to top 5 results
                title = item.get('title', 'No title')
                link = item.get('link', 'No link')
                snippet = item.get('snippet', 'No description')

                # Verify the result is from a trusted site
                is_trusted = any(trusted_domain in link.lower() for trusted_domain in ['geeksforgeeks.org', 'tutorialspoint.com', 'tpointtech.com'])

                if is_trusted:
                    # Format as HTML with clickable links
                    results.append(f"[{i}] **[{title}]({link})**\n{snippet}")

        return "\n\n".join(results) if results else "No relevant results found from trusted educational sites. Please try rephrasing your question."
    except Exception as e:
        return f"Error performing Google search: {str(e)}"

# Removed user data persistence functions

# --- API Endpoints ---

@app.route('/', methods=['GET'])
def index():
    return jsonify({"message": "Backend server is running"}), 200

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify system status"""
    health_status = {
        "status": "healthy",
        "services": {
            "flask": "running",
            "qdrant": "unknown",
            "openai": "unknown"
        },
        "vector_stores": len(vector_db),
        "vector_db_keys": list(vector_db.keys()),
        "user_uploads": user_uploads,
        "timestamp": "2025-09-08T15:58:41.362Z"
    }

    # Check Qdrant connection
    try:
        if qdrant_available and qdrant_client is not None:
            # Try a simple operation to test connection
            collections = qdrant_client.get_collections()
            health_status["services"]["qdrant"] = "connected"
            health_status["qdrant_collections"] = len(collections.collections)
            health_status["storage_type"] = "qdrant"
        else:
            health_status["services"]["qdrant"] = "not_available"
            health_status["storage_type"] = "in_memory_faiss"
    except Exception as e:
        health_status["services"]["qdrant"] = f"error: {str(e)}"
        health_status["storage_type"] = "in_memory_faiss"
        print(f"Health check - Qdrant error: {str(e)}")

    # Check OpenAI connection
    try:
        if client:
            # Try a simple API call (this might cost a small amount)
            test_response = client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": "test"}],
                max_tokens=5
            )
            if test_response:
                health_status["services"]["openai"] = "connected"
            else:
                health_status["services"]["openai"] = "no_response"
        else:
            health_status["services"]["openai"] = "not_configured"
    except Exception as e:
        error_str = str(e).lower()
        if "api key" in error_str or "authentication" in error_str:
            health_status["services"]["openai"] = "auth_error"
        elif "rate limit" in error_str:
            health_status["services"]["openai"] = "rate_limited"
        else:
            health_status["services"]["openai"] = f"error: {str(e)}"
        print(f"Health check - OpenAI error: {str(e)}")

    # Determine overall status
    if any(status in ["error", "auth_error", "not_configured"] for status in health_status["services"].values()):
        health_status["status"] = "degraded"

    return jsonify(health_status), 200

@app.route('/api/upload', methods=['POST'])
def upload_file():
    # Check if user is authenticated, otherwise use anonymous user
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

    # If no valid authentication, use anonymous user
    if not user_id:
        user_id = "anonymous"
        print(f"Backend: Using anonymous user_id: {user_id}")

    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    # Validate file type
    allowed_extensions = ['.pdf', '.docx', '.txt']
    filename_lower = file.filename.lower()
    if not any(filename_lower.endswith(ext) for ext in allowed_extensions):
        return jsonify({"error": "Invalid file type. Only PDF, DOCX, and TXT files are allowed"}), 400

    # Validate file size (10MB limit)
    file.seek(0, 2)  # Seek to end
    file_size = file.tell()
    file.seek(0)  # Seek back to beginning
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

        # Track upload for debugging
        if user_id not in user_uploads:
            user_uploads[user_id] = []
        user_uploads[user_id].append({
            "file_name": file.filename,
            "file_size": file_size,
            "chunks_count": len(chunks),
            "timestamp": "2025-09-08T16:11:00.000Z",
            "vector_store_success": vector_store_success
        })

        # Verify vector store was created
        if vector_store_success and user_id in vector_db and vector_db[user_id] is not None:
            print(f"Backend: Vector store successfully created for user {user_id}")
            print(f"Backend: Current vector_db keys: {list(vector_db.keys())}")
            print(f"Backend: User uploads tracking: {user_uploads}")
        else:
            print(f"Backend: Warning - Vector store may not have been created properly for user {user_id}")
            if qdrant_client is None:
                print("Backend: Qdrant service is not available")

        # Removed file metadata saving for anonymous uploads

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

@app.route('/api/ask', methods=['POST'])
def ask_question():
    data = request.get_json()
    if not data or 'question' not in data:
        return jsonify({"error": "Question not provided"}), 400

    # Handle anonymous users
    auth_header = request.headers.get('Authorization')
    user_id = "anonymous"

    if auth_header and auth_header.startswith("Bearer "):
        try:
            token = auth_header.split(" ")[1]
            payload = jwt.decode(token, NEXTAUTH_SECRET, algorithms=["HS256"])
            user_id = payload.get("sub") or payload.get("userId") or "anonymous"
        except Exception as e:
            print(f"Token validation failed, using anonymous: {str(e)}")

    print(f"Backend: /api/ask - Using user_id: {user_id}")
    question = data['question']
    global_search = data.get('globalSearch', False)
    try:
        answer = get_answer(user_id, question, global_search)

        # Removed query history saving

        return jsonify({"answer": answer}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/ask-document', methods=['POST'])
def ask_document():
    try:
        data = request.get_json()
        if not data or 'question' not in data:
            return jsonify({"error": "Question not provided. Please include 'question' field in your request."}), 400

        # Handle anonymous users
        auth_header = request.headers.get('Authorization')
        user_id = "anonymous"

        if auth_header and auth_header.startswith("Bearer "):
            try:
                token = auth_header.split(" ")[1]
                payload = jwt.decode(token, NEXTAUTH_SECRET, algorithms=["HS256"])
                user_id = payload.get("sub") or payload.get("userId") or "anonymous"
            except Exception as e:
                print(f"Token validation failed, using anonymous: {str(e)}")

        print(f"Backend: /api/ask-document - Using user_id: {user_id}")
        question = data['question'].strip()
        if not question:
            return jsonify({"error": "Question cannot be empty. Please provide a valid question."}), 400

        answer = get_document_answer(user_id, question)

        # Removed query history saving

        return jsonify({"answer": answer}), 200

    except Exception as e:
        # Log the error for debugging
        print(f"API ask-document error: {str(e)}")
        return jsonify({"error": "An unexpected error occurred while processing your question. Please try again."}), 500

@app.route('/api/ask-google', methods=['POST'])
def ask_google():
    try:
        data = request.get_json()
        if not data or 'question' not in data:
            return jsonify({"error": "Question not provided. Please include a 'question' field in your request."}), 400

        question = data['question'].strip()
        if not question:
            return jsonify({"error": "Question cannot be empty. Please provide a valid question."}), 400

        answer = get_google_answer(question)
        return jsonify({"answer": answer}), 200

    except Exception as e:
        # Log the error for debugging
        print(f"API ask-google error: {str(e)}")
        return jsonify({"error": "An unexpected error occurred while searching the web. Please try again."}), 500



@app.route('/api/debug-token', methods=['POST'])
def debug_token():
    """Debug endpoint to test token decoding without authentication"""
    data = request.get_json()
    if not data or 'token' not in data:
        return jsonify({"error": "Token not provided"}), 400

    token = data['token']
    try:
        payload = jwt.decode(token, NEXTAUTH_SECRET, algorithms=["HS256"])
        return jsonify({
            "decoded": payload,
            "valid": True
        }), 200
    except Exception as e:
        return jsonify({
            "error": str(e),
            "valid": False
        }), 400

@app.route('/api/debug-vector-db/<user_id>', methods=['GET'])
def debug_vector_db(user_id):
    """Debug endpoint to check vector database status for a user"""
    debug_info = {
        "user_id": user_id,
        "vector_db_has_user": user_id in vector_db,
        "vector_db_keys": list(vector_db.keys()),
        "user_uploads": user_uploads.get(user_id, []),
        "qdrant_available": qdrant_client is not None
    }

    if user_id in vector_db:
        store = vector_db[user_id]
        if isinstance(store, dict) and store.get("type") == "basic_memory":
            debug_info["vector_store_type"] = "basic_memory"
            debug_info["vector_store_details"] = f"Basic memory storage with {len(store.get('documents', []))} documents"
        else:
            debug_info["vector_store_type"] = str(type(store))
            debug_info["vector_store_details"] = "Vector store exists"
    else:
        debug_info["vector_store_details"] = "No vector store found for user"

    return jsonify(debug_info), 200



@app.route('/api/generate-code', methods=['POST'])
def generate_code():
    data = request.get_json()
    if not data or 'prompt' not in data:
        return jsonify({"error": "Prompt not provided"}), 400

    prompt = data['prompt']
    language = data.get('language', 'javascript')

    try:
        # Generate project structure based on the prompt
        project_structure = generate_project_structure(prompt, language)
        return jsonify(project_structure), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def generate_project_structure(prompt, language):
    """Generate a complete project structure based on user prompt"""

    # Define project templates based on common requests
    templates = {
        'todo': {
            'react': {
                'structure': {
                    'src': {
                        'components': {
                            'TodoItem.js': '',
                            'TodoList.js': '',
                            'AddTodo.js': ''
                        },
                        'App.js': '',
                        'index.js': '',
                        'App.css': ''
                    },
                    'public': {
                        'index.html': ''
                    },
                    'package.json': ''
                }
            },
            'html': {
                'structure': {
                    'index.html': '',
                    'styles.css': '',
                    'script.js': ''
                }
            }
        },
        'calculator': {
            'react': {
                'structure': {
                    'src': {
                        'components': {
                            'Calculator.js': '',
                            'Button.js': '',
                            'Display.js': ''
                        },
                        'App.js': '',
                        'index.js': '',
                        'App.css': ''
                    },
                    'public': {
                        'index.html': ''
                    },
                    'package.json': ''
                }
            },
            'html': {
                'structure': {
                    'index.html': '',
                    'styles.css': '',
                    'script.js': ''
                }
            }
        }
    }

    # Determine project type and framework from prompt
    prompt_lower = prompt.lower()
    project_type = 'todo' if 'todo' in prompt_lower else 'calculator'
    framework = 'react' if 'react' in prompt_lower else 'html'

    if project_type in templates and framework in templates[project_type]:
        template = templates[project_type][framework]
        files = generate_files_from_template(template['structure'], project_type, framework, language)
        return {
            'project_name': f"{project_type}-{framework}",
            'description': f"A {project_type} application built with {framework.upper()}",
            'files': files,
            'main_file': 'src/App.js' if framework == 'react' else 'index.html'
        }

    # Fallback to single file generation
    return {
        'project_name': 'code-snippet',
        'description': 'Generated code snippet',
        'files': [{
            'path': f'main.{get_file_extension(language)}',
            'content': generate_single_file_code(prompt, language),
            'type': 'file'
        }],
        'main_file': f'main.{get_file_extension(language)}'
    }

def generate_files_from_template(structure, project_type, framework, language):
    """Generate actual file contents from template structure"""
    files = []

    def traverse_structure(structure, current_path=''):
        for name, content in structure.items():
            path = f"{current_path}/{name}" if current_path else name

            if isinstance(content, dict):
                # This is a directory
                files.append({
                    'path': path,
                    'content': '',
                    'type': 'directory'
                })
                traverse_structure(content, path)
            else:
                # This is a file
                file_content = generate_file_content(name, project_type, framework, language)
                files.append({
                    'path': path,
                    'content': file_content,
                    'type': 'file'
                })

    traverse_structure(structure)
    return files

def generate_file_content(filename, project_type, framework, language):
    """Generate content for specific files"""

    if framework == 'react':
        if filename == 'package.json':
            return '''{
  "name": "todo-app",
  "version": "1.0.0",
  "description": "A simple todo application",
  "main": "src/index.js",
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1"
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}'''

        elif filename == 'src/App.js':
            return '''import React, { useState } from 'react';
import TodoList from './components/TodoList';
import AddTodo from './components/AddTodo';
import './App.css';

function App() {
  const [todos, setTodos] = useState([]);

  const addTodo = (text) => {
    const newTodo = {
      id: Date.now(),
      text: text,
      completed: false
    };
    setTodos([...todos, newTodo]);
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  return (
    <div className="App">
      <h1>Todo App</h1>
      <AddTodo onAdd={addTodo} />
      <TodoList todos={todos} onToggle={toggleTodo} onDelete={deleteTodo} />
    </div>
  );
}

export default App;'''

        elif filename == 'src/components/TodoList.js':
            return '''import React from 'react';
import TodoItem from './TodoItem';

const TodoList = ({ todos, onToggle, onDelete }) => {
  return (
    <div className="todo-list">
      {todos.map(todo => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default TodoList;'''

        elif filename == 'src/components/TodoItem.js':
            return '''import React from 'react';

const TodoItem = ({ todo, onToggle, onDelete }) => {
  return (
    <div className="todo-item">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
      />
      <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
        {todo.text}
      </span>
      <button onClick={() => onDelete(todo.id)}>Delete</button>
    </div>
  );
};

export default TodoItem;'''

        elif filename == 'src/components/AddTodo.js':
            return '''import React, { useState } from 'react';

const AddTodo = ({ onAdd }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      onAdd(text);
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a new todo..."
      />
      <button type="submit">Add</button>
    </form>
  );
};

export default AddTodo;'''

        elif filename == 'src/App.css':
            return '''.App {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.todo-list {
  margin-top: 20px;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border: 1px solid #ddd;
  margin-bottom: 5px;
  border-radius: 5px;
}

.todo-item input[type="checkbox"] {
  margin-right: 10px;
}

.todo-item button {
  margin-left: auto;
  background-color: #ff4444;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 3px;
  cursor: pointer;
}

form {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

form input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

form button {
  padding: 10px 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}'''

    elif framework == 'html':
        if filename == 'index.html':
            return '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Todo App</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <h1>Todo App</h1>
        <form id="todo-form">
            <input type="text" id="todo-input" placeholder="Add a new todo..." required>
            <button type="submit">Add</button>
        </form>
        <ul id="todo-list"></ul>
    </div>
    <script src="script.js"></script>
</body>
</html>'''

        elif filename == 'styles.css':
            return '''* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: Arial, sans-serif;
    background-color: #f5f5f5;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
}

.container {
    background: white;
    padding: 30px;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    width: 100%;
    max-width: 500px;
}

h1 {
    text-align: center;
    margin-bottom: 30px;
    color: #333;
}

form {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
}

input {
    flex: 1;
    padding: 12px;
    border: 2px solid #ddd;
    border-radius: 5px;
    font-size: 16px;
}

button {
    padding: 12px 20px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px;
}

button:hover {
    background-color: #45a049;
}

ul {
    list-style: none;
}

.todo-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 15px;
    border: 1px solid #ddd;
    margin-bottom: 10px;
    border-radius: 5px;
    background-color: #fafafa;
}

.todo-item.completed span {
    text-decoration: line-through;
    color: #888;
}

.delete-btn {
    margin-left: auto;
    background-color: #ff4444;
    padding: 5px 10px;
}

.delete-btn:hover {
    background-color: #cc0000;
}'''

        elif filename == 'script.js':
            return '''const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');

let todos = JSON.parse(localStorage.getItem('todos')) || [];

function renderTodos() {
    todoList.innerHTML = '';
    todos.forEach((todo, index) => {
        const li = document.createElement('li');
        li.className = 'todo-item';
        if (todo.completed) {
            li.classList.add('completed');
        }

        li.innerHTML = `
            <input type="checkbox" ${todo.completed ? 'checked' : ''} onchange="toggleTodo(${index})">
            <span>${todo.text}</span>
            <button class="delete-btn" onclick="deleteTodo(${index})">Delete</button>
        `;

        todoList.appendChild(li);
    });
}

function addTodo(text) {
    todos.push({
        text: text,
        completed: false
    });
    saveTodos();
    renderTodos();
}

function toggleTodo(index) {
    todos[index].completed = !todos[index].completed;
    saveTodos();
    renderTodos();
}

function deleteTodo(index) {
    todos.splice(index, 1);
    saveTodos();
    renderTodos();
}

function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

todoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = todoInput.value.trim();
    if (text) {
        addTodo(text);
        todoInput.value = '';
    }
});

// Initial render
renderTodos();'''

    return '// File content not implemented yet'

def generate_single_file_code(prompt, language):
    """Fallback function to generate single file code"""
    if language == 'javascript':
        return f'''// {prompt}
// Generated code for {language}

function exampleFunction() {{
    console.log("Hello from generated code!");
    return "Generated successfully";
}}

// Example usage
const result = exampleFunction();
console.log(result);'''
    elif language == 'python':
        return f'''# {prompt}
# Generated code for {language}

def example_function():
    """Example function generated from prompt"""
    print("Hello from generated code!")
    return "Generated successfully"

# Example usage
result = example_function()
print(result)'''
    else:
        return f'# Generated code for {language}\n# {prompt}\n\nprint("Hello World!")'

def get_file_extension(language):
    """Get file extension for a programming language"""
    extensions = {
        'javascript': 'js',
        'python': 'py',
        'java': 'java',
        'cpp': 'cpp',
        'csharp': 'cs',
        'typescript': 'ts',
        'go': 'go',
        'rust': 'rs',
        'php': 'php',
        'ruby': 'rb'
    }
    return extensions.get(language, 'txt')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
