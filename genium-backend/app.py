
import os
import tempfile
import requests
from datetime import datetime
# Removed json import
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from langchain_qdrant import QdrantVectorStore
import jwt # Import PyJWT
from functools import wraps # Import wraps for decorator
from qdrant_client import QdrantClient
from langchain_openai import OpenAIEmbeddings
from langchain_google_genai import GoogleGenerativeAIEmbeddings # Added for Gemini embeddings
from langchain_community.document_loaders import PyPDFLoader, TextLoader, Docx2txtLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.messages import HumanMessage, SystemMessage # Added for Gemini chat messages
from google.generativeai.types import HarmCategory, HarmBlockThreshold # Correct import for Gemini safety settings
from pymongo import MongoClient # Import MongoClient
from models import User, UserRepository # Import User and UserRepository
try:
    from langchain_community.vectorstores import FAISS
except ImportError:
    try:
        from langchain.vectorstores import FAISS
    except ImportError:
        print("Backend: FAISS not available, will use basic in-memory storage")
        FAISS = None
from openai import OpenAI
from langchain_google_genai import ChatGoogleGenerativeAI # Import for Gemini chat model

# Removed datetime and uuid imports

# Load environment variables
load_dotenv(dotenv_path='../.env') # Load .env from root directory

# Removed user data directory setup

# Initialize Flask app
app = Flask(__name__)
CORS(app, supports_credentials=True, origins=["http://localhost:3000", "http://127.0.0.1:3000"])  # Enable CORS with credentials for localhost

# Get NextAuth secret from environment variables
NEXTAUTH_SECRET = os.getenv("NEXTAUTH_SECRET")
if not NEXTAUTH_SECRET:
    raise ValueError("NEXTAUTH_SECRET environment variable not set.")

# Initialize OpenAI client
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if OPENAI_API_KEY:
    openai_client = OpenAI(api_key=OPENAI_API_KEY)
else:
    openai_client = None
    print("WARNING: OPENAI_API_KEY not found. OpenAI API will not be available.")


# Initialize Gemini client
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") # Moved GEMINI_API_KEY definition here
if GEMINI_API_KEY:
    gemini_model = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash", # Changed model name
        google_api_key=GEMINI_API_KEY,
        temperature=0.1,
        safety_settings={
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
        }
    )
    print("Backend: Gemini Chat Model initialized.")
else:
    gemini_model = None
    print("WARNING: GEMINI_API_KEY not found. Gemini Chat Model will not be available.")

# Initialize embeddings model
embedding_model = None
if OPENAI_API_KEY:
    embedding_model = OpenAIEmbeddings(model="text-embedding-3-large")
    print("Backend: OpenAI Embeddings initialized.")
elif GEMINI_API_KEY:
    embedding_model = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
    print("Backend: Gemini Embeddings initialized.")
else:
    print("WARNING: No API key found for OpenAI or Gemini. Embedding model will not be available.")
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
                # Allow both HS256 (for custom generated tokens) and RS256 (for NextAuth's default)
                payload = jwt.decode(token, NEXTAUTH_SECRET, algorithms=["HS256"]) # Revert to HS256 only
                print(f"Backend: Successfully decoded JWT")
                print(f"Backend: Decoded payload keys: {list(payload.keys())}")
                print(f"Backend: Full decoded payload: {payload}")
                user_id = payload.get("sub") or payload.get("userId")  # Extract user ID from 'sub' or 'userId' claim
                print(f"Backend: Extracted user_id: {user_id}")
                if not user_id:
                    print("Backend: Token missing 'sub' or 'userId' claim")
                    return jsonify({"error": "Invalid token: missing user ID"}), 401

                # Store or retrieve user data from MongoDB
                if user_repository:
                    profile_data = {
                        "email": payload.get("email"),
                        "name": payload.get("name"),
                        "image": payload.get("picture"), # Assuming 'picture' for profile image
                        "provider_id": user_id # Using 'sub' or 'userId' as provider_id
                    }
                    print(f"Backend: Profile data extracted from JWT: {profile_data}")
                    try:
                        user_obj = user_repository.find_or_create_oauth_user(profile_data)
                        print(f"Backend: OAuth user handled: {user_obj.email}")
                    except Exception as e:
                        print(f"Backend: Error handling OAuth user in MongoDB: {str(e)}")
                        import traceback
                        print(f"Backend: Full traceback for OAuth user error: {traceback.format_exc()}")
                        # Continue without user data if there's a DB error, but log it

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

@app.errorhandler(401)
def unauthorized(error):
    """Custom 401 error handler to return JSON response."""
    print(f"Backend: Custom 401 error handler triggered: {error}")
    return jsonify({"error": "Unauthorized: " + str(error.description)}), 401

# Initialize Qdrant client (persistent storage)
qdrant_url = os.getenv("QDRANT_URL")
qdrant_client = None
qdrant_available = False

if qdrant_url:
    try:
        # Extract host and port from QDRANT_URL
        # Assuming QDRANT_URL is in the format http://host:port
        qdrant_host = qdrant_url.split("://")[1].split(":")[0]
        qdrant_port = int(qdrant_url.split(":")[-1])
        
        qdrant_client = QdrantClient(host=qdrant_host, port=qdrant_port)
        print("Backend: Qdrant client initialized successfully using QDRANT_URL")
        # Test the connection
        collections = qdrant_client.get_collections()
        print(f"Backend: Qdrant connection test successful, found {len(collections.collections)} existing collections")
        qdrant_available = True
    except Exception as e:
        print(f"Backend: Failed to initialize Qdrant client using QDRANT_URL: {str(e)}")
        print("Backend: Qdrant not available, will use in-memory fallback storage")
else:
    print("Backend: QDRANT_URL environment variable not set. Qdrant will not be available.")

# Initialize MongoDB client
mongo_client = None
mongo_db = None
try:
    # Prioritize MONGO_URI for Docker Compose, then DB_CONNECTION_STRING
    mongo_connection_string = os.getenv("MONGO_URI") or os.getenv("DB_CONNECTION_STRING")
    if mongo_connection_string:
        mongo_client = MongoClient(mongo_connection_string)
        mongo_db = mongo_client.Genium # Corrected to 'Genium' to match appName in connection string
        # The ismaster command is cheap and does not require auth.
        mongo_client.admin.command('ismaster')
        print("Backend: MongoDB client initialized and connected successfully")
    else:
        print("WARNING: MONGO_URI or DB_CONNECTION_STRING not found. MongoDB will not be available.")
except Exception as e:
    print(f"Backend: Failed to initialize MongoDB client: {str(e)}")
    mongo_client = None
    mongo_db = None

# In-memory storage for vector database (will be replaced by user-specific Qdrant collections)
vector_db = {} # Dictionary to hold user-specific vector dbs

# Initialize UserRepository
user_repository = None
if mongo_db is not None:
    user_repository = UserRepository(mongo_db)
    print("Backend: UserRepository initialized.")
else:
    print("WARNING: MongoDB not available, UserRepository will not be initialized.")

# Track uploaded files per user for debugging
user_uploads = {} # Dictionary to track user uploads

# --- Functions ---

def get_fallback_answer(query, context_available=True, global_search_enabled=False):
    """Provide a basic fallback answer when AI service is unavailable"""
    query_lower = query.lower()

    # Basic keyword-based responses
    if any(word in query_lower for word in ['hello', 'hi', 'greetings']):
        return "Hello! I'm here to help you with questions about your documents. Please upload a document first if you haven't already."

    if any(word in query_lower for word in ['help', 'what can you do', 'how to use']):
        return "I can help you analyze documents and answer questions about their content. Upload a PDF, DOCX, or TXT file, then ask me questions about it. I can also search the web for additional information if you enable global search."

    if any(word in query_lower for word in ['upload', 'file', 'document']):
        return "To get started, please upload a document using the file upload section. I support PDF, DOCX, and TXT files up to 10MB in size."

    if global_search_enabled and not context_available:
        return f"I understand you're asking: '{query}'. I'm currently unable to provide a detailed AI-generated response from web search. Please try again later when the service is back online."
    elif context_available:
        return f"I understand you're asking about: '{query}'. I've analyzed your document, but I'm currently unable to provide a detailed AI-generated response. Please try again later when the service is back online."
    else:
        return f"I understand you're asking: '{query}'. Please upload a document first so I can help answer your questions about it, or enable web search to get answers from the internet."

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
        if embedding_model is None:
            print(f"Backend: Embedding model not available, cannot initialize vector store for user {user_id}")
            return False

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
            if embedding_model:
                vector_db[user_id] = {
                    "type": "basic_memory",
                    "documents": docs,
                    "embeddings": [embedding_model.embed_query(doc.page_content) for doc in docs]
                }
            else:
                print("Backend: Warning - Embedding model not available for basic in-memory storage.")
                vector_db[user_id] = {
                    "type": "basic_memory",
                    "documents": docs,
                    "embeddings": [] # Store empty embeddings if model is not available
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
    google_context = ""
    
    # If global search is enabled, fetch information from Google
    if global_search:
        google_results = search_google(query) # Call search_google without trusted_sites parameter
        
        if google_results:
            google_context = f"\n\nAdditional Information from Web Search:\n{google_results}"

    # Check if document is available
    has_document = user_id in vector_db and vector_db[user_id] is not None

    if has_document:
        search_results = vector_db[user_id].similarity_search(query=query)
        context = "\n\n".join([
            f"Page Content: {result.page_content}\nPage Number: {result.metadata.get('page_label', 'N/A')}"
            for result in search_results
        ])

    # If neither document nor web search is available, return error
    if not has_document and not global_search:
        if qdrant_client is None:
            return "The document storage service is currently unavailable. Please try again later or contact support if the issue persists."
        else:
            return "No document has been uploaded yet. Please upload a PDF, DOCX, or TXT file first, or enable web search to ask questions without documents."

    system_prompt = f"""
    You are an AI assistant answering user queries on any topic. Provide detailed, accurate, and well-explained answers with relevant examples wherever applicable. Gather information from all valid and trustworthy websites and sources on the internet, not limited to any single domain. Always include clickable source URLs in your response so the user can verify the information. Ensure that answers are clear, comprehensive, and educational regardless of the topic the user asks about.

    CRITICAL FORMATTING INSTRUCTIONS:
    - Use ONLY standard markdown bold formatting: **text** for emphasis
    - NEVER use HTML tags like <b>, <strong>, or custom tags
    - Apply bold formatting to ALL important terms throughout your entire response
    - Highlight every key concept, definition, important word, and significant term with **bold**
    - Make your response visually rich by bolding terms like: **definition**, **concept**, **theory**, **principle**, **example**, **summary**, **conclusion**, **result**, **finding**, **analysis**, **key**, **important**, **essential**, **advantages**, **disadvantages**, **applications**, **implementation**, **features**, **types**, **categories**, **components**, **structure**, **functionality**, **process**, **methodology**, **approach**, **solution**, **problem**, **challenge**, **impact**, **significance**, **role**, **purpose**, **goal**, **objective**, **strategy**, **tactic**, **technique**, **tool**, **technology**, **system**, **framework**, **library**, **module**, **package**, **API**, **interface**, **protocol**, **standard**, **best practice**, **guideline**, **recommendation**, **consideration**, **factor**, **element**, **aspect**, **perspective**, **viewpoint**, **opinion**, **argument**, **evidence**, **data**, **information**, **knowledge**, **understanding**, **insight**, **clarification**, **explanation**, **description**, **illustration**, **demonstration**, **proof**, **justification**, **rationale**, **reason**, **cause**, **effect**, **consequence**, **implication**, **relation**, **relationship**, **connection**, **correlation**, **comparison**, **contrast**, **similarity**, **difference**, **distinction**, **classification**, **categorization**, **grouping**, **organization**, **arrangement**, **sequence**, **order**, **hierarchy**, **level**, **layer**, **tier**, **scope**, **range**, **extent**, **magnitude**, **scale**, **size**, **amount**, **quantity**, **number**, **value**, **rate**, **ratio**, **percentage**, **proportion**, **frequency**, **duration**, **period**, **time**, **date**, **location**, **place**, **environment**, **context**, **scenario**, **situation**, **event**, **occurrence**, **phenomenon**, **trend**, **pattern**, **cycle**, **phase**, **stage**, **step**, **action**, **activity**, **operation**, **task**, **job**, **work**, **project**, **program**, **initiative**, **effort**, **undertaking**, **endeavor**, **venture**, **enterprise**, **business**, **organization**, **company**, **firm**, **corporation**, **institution**, **agency**, **department**, **division**, **team**, **group**, **individual**, **person**, **user**, **customer**, **client**, **stakeholder**, **audience**, **public**, **community**, **society**, **world**, **global**, **national**, **regional**, **local**, **internal**, **external**, **primary**, **secondary**, **tertiary**, **main**, **major**, **minor**, **critical**, **crucial**, **vital**, **essential**, **fundamental**, **basic**, **advanced**, **complex**, **simple**, **easy**, **difficult**, **challenging**, **effective**, **efficient**, **optimal**, **suboptimal**, **successful**, **unsuccessful**, **positive**, **negative**, **neutral**, **good**, **bad**, **better**, **worse**, **high**, **low**, **increased**, **decreased**, **stable**, **volatile**, **dynamic**, **static**, **flexible**, **rigid**, **scalable**, **robust**, **secure**, **reliable**, **available**, **performant**, **responsive**, **interactive**, **user-friendly**, **intuitive**, **accessible**, **customizable**, **configurable**, **extensible**, **maintainable**, **testable**, **deployable**, **portable**, **interoperable**, **compatible**, **integrated**, **distributed**, **centralized**, **decentralized**, **cloud-based**, **on-premise**, **hybrid**, **virtual**, **physical**, **hardware**, **software**, **network**, **data**, **storage**, **compute**, **memory**, **bandwidth**, **latency**, **throughput**, **security**, **privacy**, **compliance**, **governance**, **risk**, **threat**, **vulnerability**, **attack**, **defense**, **mitigation**, **prevention**, **detection**, **response**, **recovery**, **backup**, **restore**, **disaster recovery**, **business continuity**, **scalability**, **performance**, **reliability**, **availability**, **maintainability**, **usability**, **security**, **cost**, **time**, **resources**, **quality**, **scope**, **budget**, **schedule**, **stakeholders**, **requirements**, **design**, **development**, **testing**, **deployment**, **monitoring**, **maintenance**, **support**, **upgrade**, **migration**, **refactoring**, **optimization**, **troubleshooting**, **debugging**, **analysis**, **planning**, **strategy**, **execution**, **management**, **leadership**, **teamwork**, **collaboration**, **communication**, **feedback**, **iteration**, **agile**, **scrum**, **kanban**, **waterfall**, **devops**, **ci/cd**, **automation**, **scripting**, **programming**, **coding**, **development**, **engineering**, **architecture**, **design**, **modeling**, **simulation**, **prototyping**, **testing**, **quality assurance**, **deployment**, **operations**, **support**, **maintenance**, **security**, **data science**, **machine learning**, **artificial intelligence**, **deep learning**, **natural language processing**, **computer vision**, **robotics**, **blockchain**, **internet of things**, **cloud computing**, **big data**, **data warehousing**, **business intelligence**, **analytics**, **visualization**, **reporting**, **dashboard**, **alerting**, **logging**, **monitoring**, **observability**, **telemetry**, **metrics**, **tracing**, **logging**, **event**, **message**, **queue**, **stream**, **pipeline**, **workflow**, **orchestration**, **automation**, **integration**, **api**, **microservices**, **serverless**, **containerization**, **virtualization**, **operating system**, **file system**, **database**, **sql**, **nosql**, **relational**, **document**, **graph**, **key-value**, **columnar**, **time-series**, **search engine**, **cache**, **load balancer**, **proxy**, **gateway**, **firewall**, **vpn**, **dns**, **http**, **tcp/ip**, **rest**, **graphql**, **grpc**, **json**, **xml**, **yaml**, **markdown**, **html**, **css**, **javascript**, **python**, **java**, **c++**, **c#**, **go**, **rust**, **php**, **ruby**, **swift**, **kotlin**, **typescript**, **scala**, **haskell**, **lisp**, **prolog**, **r**, **matlab**, **shell scripting**, **bash**, **powershell**, **git**, **svn**, **mercurial**, **jira**, **confluence**, **slack**, **teams**, **zoom**, **google meet**, **microsoft office**, **google workspace**, **aws**, **azure**, **google cloud**, **docker**, **kubernetes**, **terraform**, **ansible**, **puppet**, **chef**, **jenkins**, **gitlab ci**, **github actions**, **travis ci**, **circleci**, **sonarqube**, **snyk**, **checkmarx**, **veracode**, **owasp**, **gdpr**, **hipaa**, **soc2**, **iso27001**, **nist**, **pci dss**, **ccpa**, **lgpd**, **data privacy**, **data security**, **information security**, **cybersecurity**, **network security**, **application security**, **endpoint security**, **cloud security**, **identity and access management**, **encryption**, **decryption**, **hashing**, **digital signature**, **certificate**, **ssl/tls**, **vpn**, **firewall**, **intrusion detection system**, **intrusion prevention system**, **security information and event management**, **security orchestration automation and response**, **threat intelligence**, **vulnerability management**, **penetration testing**, **red teaming**, **blue teaming**, **security audit**, **compliance audit**, **risk assessment**, **risk management**, **incident response**, **forensics**, **malware analysis**, **reverse engineering**, **social engineering**, **phishing**, **ransomware**, **virus**, **worm**, **trojan**, **spyware**, **adware**, **rootkit**, **botnet**, **ddos**, **man-in-the-middle**, **sql injection**, **cross-site scripting**, **cross-site request forgery**, **broken authentication**, **sensitive data exposure**, **xml external entities**, **broken access control**, **security misconfiguration**, **insecure deserialization**, **insufficient logging and monitoring**, **server-side request forgery**, **unvalidated redirects and forwards**, **insecure direct object references**, **missing function level access control**, **security through obscurity**, **least privilege**, **separation of duties**, **defense in depth**, **zero trust**, **security by design**, **privacy by design**, **data minimization**, **purpose limitation**, **storage limitation**, **accuracy**, **integrity**, **confidentiality**, **availability**, **processing**, **controller**, **processor**, **data subject**, **consent**, **legitimate interest**, **contractual necessity**, **legal obligation**, **public task**, **vital interest**, **special categories of personal data**, **data protection impact assessment**, **data protection officer**, **supervisory authority**, **data breach**, **notification**, **right to access**, **right to rectification**, **right to erasure**, **right to restrict processing**, **right to data portability**, **right to object**, **rights in relation to automated decision making and profiling**.

    {google_context}

    Context:
    {context}
    """

    answer = None

    if gemini_model:
        gemini_messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=query)
        ]
        try:
            gemini_response = gemini_model.invoke(gemini_messages)
            answer = gemini_response.content
        except Exception as e:
            print(f"Gemini API error in get_answer: {e}")
            answer = None # Reset to try OpenAI

    if answer is None and openai_client.api_key:
        try:
            openai_response = openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": query},
                ],
                max_tokens=1000,
                temperature=0.1
            )
            answer = openai_response.choices[0].message.content
        except Exception as e:
            print(f"OpenAI API error in get_answer: {e}")
            answer = None

    if answer is None:
        # Pass the actual status of document availability and global search enabled status to the fallback function
        return get_fallback_answer(query, has_document, global_search)
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
            if embedding_model:
                query_embedding = embedding_model.embed_query(query)
                similarities = []
                for i, doc_embedding in enumerate(embeddings):
                    # Simple dot product similarity
                    similarity = sum(a * b for a, b in zip(query_embedding, doc_embedding))
                    similarities.append((similarity, documents[i]))
            else:
                print("Backend: Warning - Embedding model not available for basic in-memory search.")
                return "Embedding service is not available, cannot process document questions at this time."

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

        answer = None

        if gemini_model:
            gemini_messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=query)
            ]
            try:
                gemini_response = gemini_model.invoke(gemini_messages)
                answer = gemini_response.content
            except Exception as e:
                print(f"Gemini API error in get_document_answer: {e}")
                answer = None

        if answer is None and openai_client.api_key:
            try:
                openai_response = openai_client.chat.completions.create(
                    model="gpt-4",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": query},
                    ],
                    max_tokens=1000,
                    temperature=0.1
                )
                answer = openai_response.choices[0].message.content
            except Exception as e:
                print(f"OpenAI API error in get_document_answer: {e}")
                answer = None
        
        if answer is None:
            print("Backend: Neither Gemini nor OpenAI could generate a document answer.")
            return get_fallback_answer(query, True)

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

        answer = None

        if gemini_model:
            gemini_messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=query)
            ]
            try:
                gemini_response = gemini_model.invoke(gemini_messages)
                answer = gemini_response.content
            except Exception as e:
                print(f"Gemini API error in get_google_answer: {e}")
                answer = None

        if answer is None and openai_client.api_key:
            try:
                openai_response = openai_client.chat.completions.create(
                    model="gpt-4",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": query},
                    ],
                    max_tokens=1000,
                    temperature=0.1
                )
                answer = openai_response.choices[0].message.content
            except Exception as e:
                print(f"OpenAI API error in get_google_answer: {e}")
                answer = None
        
        if answer is None:
            print("Backend: Neither Gemini nor OpenAI could generate a Google answer.")
            return "I couldn't generate a response from the web search results. Please try again later."

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
    """Search Google using Custom Search API and return formatted results with clickable links from various trusted sites"""
    google_api_key = os.getenv("GOOGLE_API_KEY")
    search_engine_id = os.getenv("GOOGLE_SEARCH_ENGINE_ID")

    if not google_api_key or not search_engine_id:
        return "Google search is not configured. Please set GOOGLE_API_KEY and GOOGLE_SEARCH_ENGINE_ID in your .env file."

    try:
        # Perform a broad search without specific site restrictions
        url = f"https://www.googleapis.com/customsearch/v1?key={google_api_key}&cx={search_engine_id}&q={query}&num=5"
        response = requests.get(url)
        response.raise_for_status()

        data = response.json()
        results = []

        if 'items' in data:
            for i, item in enumerate(data['items'][:5], 1):  # Limit to top 5 results
                title = item.get('title', 'No title')
                link = item.get('link', 'No link')
                snippet = item.get('snippet', 'No description')

                # All results are considered valid as per new requirement, no specific trusted site check needed here
                results.append(f"[{i}] **[{title}]({link})**\n{snippet}")

        return "\n\n".join(results) if results else "No relevant web results found for your question. Please try rephrasing your question."
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
            "openai": "unknown",
            "mongodb": "unknown" # Added MongoDB status
        },
        "vector_stores": len(vector_db),
        "vector_db_keys": list(vector_db.keys()),
        "user_uploads": user_uploads,
        "timestamp": datetime.utcnow().isoformat() + "Z"
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
        if openai_client.api_key:
            # Try a simple API call (this might cost a small amount)
            test_response = openai_client.chat.completions.create(
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

    # Check Gemini connection
    try:
        if gemini_model:
            test_response = gemini_model.generate_content("test", safety_settings={'HARASSMENT': 'BLOCK_NONE', 'HATE_SPEECH': 'BLOCK_NONE', 'SEXUALLY_EXPLICIT': 'BLOCK_NONE', 'DANGEROUS_CONTENT': 'BLOCK_NONE'})
            if test_response and test_response.candidates:
                health_status["services"]["gemini"] = "connected"
            else:
                health_status["services"]["gemini"] = "no_response"
        else:
            health_status["services"]["gemini"] = "not_configured"
    except Exception as e:
        error_str = str(e).lower()
        if "api key" in error_str or "authentication" in error_str:
            health_status["services"]["gemini"] = "auth_error"
        elif "rate limit" in error_str:
            health_status["services"]["gemini"] = "rate_limited"
        else:
            health_status["services"]["gemini"] = f"error: {str(e)}"
        print(f"Health check - Gemini error: {str(e)}")

    # Check MongoDB connection
    try:
        if mongo_client is not None and mongo_db is not None:
            # Try a simple operation to test connection, e.g., list collection names
            mongo_db.list_collection_names()
            health_status["services"]["mongodb"] = "connected"
        else:
            health_status["services"]["mongodb"] = "not_configured"
    except Exception as e:
        health_status["services"]["mongodb"] = f"error: {str(e)}"
        print(f"Health check - MongoDB error: {str(e)}")

    # Determine overall status
    if any(status in ["error", "auth_error", "not_configured"] for status in health_status["services"].values()):
        health_status["status"] = "degraded"

    return jsonify(health_status), 200

@app.route('/api/upload', methods=['POST'])
def upload_file():
    print("Backend: Upload request received")
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
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "vector_store_success": vector_store_success
        })

        # Verify vector store was created
        if not vector_store_success or user_id not in vector_db or vector_db[user_id] is None:
            error_message = "Failed to create vector store for the uploaded document."
            if not qdrant_available:
                error_message += " Qdrant service is not available."
            elif embedding_model is None:
                error_message += " Embedding model is not initialized. Please check API keys."
            
            print(f"Backend: Error - {error_message} for user {user_id}")
            return jsonify({"error": error_message, "vector_store_created": False}), 500

        print(f"Backend: Vector store successfully created for user {user_id}")
        print(f"Backend: Current vector_db keys: {list(vector_db.keys())}")
        print(f"Backend: User uploads tracking: {user_uploads}")

        response_data = {
            "message": "File uploaded and processed successfully",
            "chunks_count": len(chunks),
            "user_id": user_id,
            "file_name": file.filename,
            "file_size": file_size,
            "vector_store_created": True
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
    print(f"Backend: /api/ask - Received globalSearch: {global_search} (type: {type(global_search)})")
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



@app.route('/api/user/sync', methods=['POST'])
@jwt_required
def sync_user_data(user_id):
    """
    Receives user profile data from the frontend after NextAuth authentication
    and ensures it's stored/updated in MongoDB.
    """
    if user_repository is None:
        print("Backend: UserRepository not initialized, cannot sync user data.")
        return jsonify({"error": "User service unavailable"}), 500

    data = request.get_json()
    if not data:
        print("Backend: /api/user/sync - No data provided in request.")
        return jsonify({"error": "No user data provided"}), 400

    profile_data = {
        "email": data.get("email"),
        "name": data.get("name"),
        "image": data.get("image"),
        "provider_id": user_id
    }
    print(f"Backend: /api/user/sync - Received profile data: {profile_data}")

    try:
        user_obj = user_repository.find_or_create_oauth_user(profile_data)
        print(f"Backend: /api/user/sync - User data synced for: {user_obj.email}")
        return jsonify({"message": "User data synced successfully", "user_id": str(user_obj._id)}), 200
    except Exception as e:
        print(f"Backend: /api/user/sync - Error syncing user data: {str(e)}")
        import traceback
        print(f"Backend: Full traceback for /api/user/sync error: {traceback.format_exc()}")
        return jsonify({"error": "Failed to sync user data"}), 500

import json # Added for json.loads and json.dumps
from code_gene import generate_code_content # Import the new function

@app.route('/generate-code', methods=['POST'])
def generate_code():
    data = request.get_json()
    if not data or 'prompt' not in data:
        return jsonify({"error": "Prompt not provided"}), 400

    prompt = data['prompt']
    
    try:
        generated_code_json_str = generate_code_content(prompt)
        
        # Attempt to parse the response as JSON to check for errors
        try:
            response_data = json.loads(generated_code_json_str)
            if "error" in response_data:
                return jsonify(response_data), 500
            # If it's not an error, it should be the code content
            return jsonify({"code": response_data}), 200
        except json.JSONDecodeError:
            # If it's not a JSON, it's likely the raw code content
            return jsonify({"code": generated_code_json_str}), 200

    except Exception as e:
        print(f"Backend: Error calling generate_code_content: {str(e)}")
        import traceback
        print(f"Backend: Full traceback for generate_code_content error: {traceback.format_exc()}")
        return jsonify({"error": "An unexpected error occurred during code generation."}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=False)