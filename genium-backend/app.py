
import os
import tempfile
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from langchain_qdrant import QdrantVectorStore
from langchain_openai import OpenAIEmbeddings
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from openai import OpenAI

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Initialize embeddings model
embedding_model = OpenAIEmbeddings(model="text-embedding-3-large")

# In-memory storage for vector database
vector_db = None

# --- Functions ---

def process_uploaded_file(file_storage):
    """Process uploaded PDF or text file and return chunks"""
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file_storage.filename)[1]) as tmp:
        file_storage.save(tmp.name)
        tmp_path = tmp.name
    
    try:
        if file_storage.filename.endswith('.pdf'):
            loader = PyPDFLoader(file_path=tmp_path)
        else:
            loader = TextLoader(file_path=tmp_path)
        
        docs = loader.load()
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=400
        )
        return text_splitter.split_documents(documents=docs)
    finally:
        os.unlink(tmp_path)

def initialize_vector_store(docs):
    global vector_db
    vector_db = QdrantVectorStore.from_documents(
        documents=docs,
        url="http://localhost:6333",
        collection_name="learning_vectors",
        embedding=embedding_model
    )

def get_answer(query):
    global vector_db
    if vector_db is None:
        return "Vector database is not initialized. Please upload a document first."

    search_results = vector_db.similarity_search(query=query)
    context = "\n\n".join([
        f"Page Content: {result.page_content}\nPage Number: {result.metadata.get('page_label', 'N/A')}"
        for result in search_results
    ])
    
    system_prompt = f"""
    You are a helpful AI Assistant who answers user queries based on the available context
    retrieved from a document. Provide detailed answers and include page references when available.

    Context:
    {context}
    """
    
    response = client.chat.completions.create(
        model="gpt-4.1",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": query},
        ]
    )
    return response.choices[0].message.content

# --- API Endpoints ---

@app.route('/', methods=['GET'])
def index():
    return jsonify({"message": "Backend server is running"}), 200

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    try:
        chunks = process_uploaded_file(file)
        initialize_vector_store(chunks)
        return jsonify({"message": "File processed successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/ask', methods=['POST'])
def ask_question():
    data = request.get_json()
    if not data or 'question' not in data:
        return jsonify({"error": "Question not provided"}), 400
    
    question = data['question']
    try:
        answer = get_answer(question)
        return jsonify({"answer": answer}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
