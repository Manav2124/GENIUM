# GENIUM - Document QA Assistant

A modern document question-answering system built with React frontend and Python/Streamlit backend, powered by OpenAI GPT-4 and Qdrant vector database.

## 🚀 Features

- **Document Processing**: Upload PDF and text files for analysis
- **AI-Powered Q&A**: Ask questions about your documents using GPT-4
- **Vector Search**: Fast semantic search using Qdrant vector database
- **Modern UI**: Beautiful React frontend with dark/light theme support
- **Real-time Processing**: Streamlit backend for immediate document analysis
- **Security**: File validation, size limits, and secure processing

## 🏗️ Architecture

```
GENIUM/
├── genium-backend/          # Python/Streamlit backend
│   ├── app.py              # Main Streamlit application
│   ├── requirements.txt    # Python dependencies
│   ├── Dockerfile         # Container configuration
│   └── docker-compose.yml # Multi-service setup
├── genium-ui/              # React frontend
│   ├── src/               # React components
│   ├── package.json       # Node.js dependencies
│   └── public/            # Static assets
└── README.md              # This file
```

## 🛠️ Setup Instructions

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker and Docker Compose
- OpenAI API key

### Backend Setup

1. **Clone and navigate to backend:**
   ```bash
   cd genium-backend
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env
   # Edit .env and add your OpenAI API key
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run with Docker (recommended):**
   ```bash
   docker-compose up --build
   ```

5. **Or run locally:**
   ```bash
   streamlit run app.py
   ```

### Frontend Setup

1. **Navigate to frontend:**
   ```bash
   cd genium-ui
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm start
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in `genium-backend/`:

```env
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Qdrant Vector Database Configuration
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION_NAME=learning_vectors

# Streamlit Configuration
STREAMLIT_SERVER_PORT=8501
STREAMLIT_SERVER_ADDRESS=0.0.0.0

# Security Configuration
MAX_FILE_SIZE=52428800  # 50MB in bytes
```

### Docker Services

The application runs with two services:

- **Streamlit App** (Port 8501): Main application
- **Qdrant Vector DB** (Port 6333): Vector database for embeddings

## 📖 Usage

1. **Start the services:**
   ```bash
   cd genium-backend
   docker-compose up --build
   ```

2. **Access the application:**
   - Backend: http://localhost:8501
   - Frontend: http://localhost:3000

3. **Upload a document:**
   - Supported formats: PDF, TXT
   - Maximum size: 50MB

4. **Ask questions:**
   - Type your question about the document
   - Get AI-powered answers with page references

## 🔒 Security Features

- **File Validation**: Type and size checking
- **Input Sanitization**: Safe filename handling
- **Error Handling**: Comprehensive error messages
- **Resource Limits**: Memory and processing limits
- **Secure Processing**: Temporary file cleanup

## 🚀 Performance Optimizations

- **Chunking**: Documents split into manageable chunks
- **Vector Caching**: Embeddings stored in Qdrant
- **Async Processing**: Non-blocking document processing
- **Memory Management**: Efficient resource usage

## 🐛 Troubleshooting

### Common Issues

1. **OpenAI API Key Error:**
   - Ensure `OPENAI_API_KEY` is set in `.env`
   - Check API key validity

2. **Qdrant Connection Error:**
   - Ensure Qdrant service is running: `docker-compose up vector-db`
   - Check port 6333 is available

3. **File Upload Issues:**
   - Check file size (max 50MB)
   - Verify file format (PDF/TXT only)

4. **Memory Issues:**
   - Reduce `chunk_size` in `app.py`
   - Use smaller documents

### Logs

```bash
# View backend logs
docker-compose logs streamlit-app

# View database logs
docker-compose logs vector-db
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- OpenAI for GPT-4 and embeddings
- Qdrant for vector database
- Streamlit for the web framework
- React and Tailwind CSS for the frontend

---

**Note**: This is a demo implementation. For production use, consider adding authentication, rate limiting, and additional security measures.

