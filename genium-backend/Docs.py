
import os
import tempfile
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from langchain_qdrant import QdrantVectorStore
from langchain_openai import OpenAIEmbeddings
from langchain_community.document_loaders import PyPDFLoader, TextLoader, Docx2txtLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from openai import OpenAI
from googlesearch import search

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
    """Process uploaded PDF, DOCX, or text file and return chunks"""
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file_storage.filename)[1]) as tmp:
        file_storage.save(tmp.name)
        tmp_path = tmp.name

    try:
        filename_lower = file_storage.filename.lower()
        if filename_lower.endswith('.pdf'):
            loader = PyPDFLoader(file_path=tmp_path)
        elif filename_lower.endswith('.docx'):
            loader = Docx2txtLoader(file_path=tmp_path)
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

def get_answer(query, is_global=False):
    global vector_db
    if vector_db is None:
        return "Vector database is not initialized. Please upload a document first."

    search_results = vector_db.similarity_search(query=query)
    context = "\n\n".join([
        f"Page Content: {result.page_content}\nPage Number: {result.metadata.get('page_label', 'N/A')}"
        for result in search_results
    ])
    
    # Keep original context without manual highlighting
    context = "\n\n".join([
        f"Page Content: {result.page_content}\nPage Number: {result.metadata.get('page_label', 'N/A')}"
        for result in search_results
    ])

    google_results_list = []
    if is_global:
        trusted_domains = ["geeksforgeeks.org", "tutorialspoint.com", "tpointtech.com"]
        google_results_list = []
        for result in search(query, num_results=5):
            if any(domain in result for domain in trusted_domains):
                google_results_list.append(result)
        google_results_context = "\n".join(google_results_list)
        context += f"\n\nGoogle Search Results:\n{google_results_context}"
    
    system_prompt = f"""
You are a knowledgeable and helpful AI Assistant. Your task is to answer the user's queries
using only the information provided in the given context (retrieved from a document).

CRITICAL FORMATTING INSTRUCTIONS:
- Use ONLY standard markdown bold formatting: **text** for emphasis
- NEVER use HTML tags like <b>, <strong>, or custom tags
- NEVER use custom highlight tags like <highlight-keyword> or similar
- Apply bold formatting to ALL important terms throughout your entire response
- Highlight every key concept, definition, important word, and significant term with **bold**
- Make your response visually rich by bolding terms like: primary, goal, important, key, essential,
  definition, concept, theory, principle, example, summary, conclusion, result, finding, analysis,
  database, system, collection, program, access, information, enterprise, storage, mechanism,
  safety, crash, unauthorized, access, share, user, anomalous, result
- Provide clear, accurate, and well-structured answers.
- Include page references whenever they are available in the context.
- If Google Search results are provided, use them to enhance or supplement your response.
- If the answer cannot be found in the given context or search results, clearly state that
  the information is not available.

Context:
{context}
"""
    
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": query},
        ]
    )
    answer = response.choices[0].message.content
    return {"answer": answer, "google_results": google_results_list if is_global else []}

# --- API Endpoints ---

@app.route('/', methods=['GET'])
def index():
    return jsonify({"message": "Backend server is running"}), 200

@app.route('/api/upload', methods=['POST'])
def upload_file():
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
        chunks = process_uploaded_file(file)
        if not chunks:
            return jsonify({"error": "Failed to extract content from file"}), 400

        initialize_vector_store(chunks)
        return jsonify({"message": "File uploaded and processed successfully", "chunks_count": len(chunks)}), 200
    except Exception as e:
        print(f"Error processing file: {str(e)}")  # Log for debugging
        return jsonify({"error": "Failed to process file. Please try again."}), 500

@app.route('/api/ask', methods=['POST'])
def ask_question():
    data = request.get_json()
    if not data or 'question' not in data:
        return jsonify({"error": "Question not provided"}), 400
    
    question = data['question']
    is_global = data.get('isGlobal', False)
    try:
        result = get_answer(question, is_global)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
