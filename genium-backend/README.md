# Genium Backend

A Flask-based backend service for document upload and AI-powered question answering using vector databases.

## Features

- **Document Upload**: Support for PDF, DOCX, and TXT files
- **Vector Database**: Qdrant-based vector storage for document embeddings
- **Question Answering**: AI-powered responses based on uploaded documents
- **User Management**: User-specific document collections
- **Authentication**: JWT-based authentication support

## Recent Fixes

### Vector Database Initialization Issues
- ✅ Fixed Qdrant client connection testing and error handling
- ✅ Improved vector store initialization with proper error cleanup
- ✅ Added user-specific collection management
- ✅ Enhanced error messages for better user experience

### System Architecture
- ✅ Updated Docker configuration to use Flask instead of Streamlit
- ✅ Fixed container setup and user permissions
- ✅ Added comprehensive logging and debugging endpoints

### Error Handling
- ✅ Replaced generic "Vector database not initialized" errors with user-friendly messages
- ✅ Added tracking for user uploads to handle edge cases
- ✅ Improved authentication flow consistency

## API Endpoints

### Core Endpoints
- `GET /api/health` - System health check
- `POST /api/upload` - Upload document files
- `POST /api/ask` - Ask questions (with optional global search)
- `POST /api/ask-document` - Ask questions about uploaded documents
- `POST /api/ask-google` - Ask questions with Google search

### Debug Endpoints
- `POST /api/debug-token` - Test JWT token decoding
- `GET /api/debug-vector-db/<user_id>` - Check vector database status for a user

## Setup Instructions

### Prerequisites
- Python 3.11+
- Docker and Docker Compose
- OpenAI API key
- NextAuth secret (for authentication)

### Environment Variables
Create a `.env` file with:
```bash
OPENAI_API_KEY=your_openai_api_key
NEXTAUTH_SECRET=your_nextauth_secret
GOOGLE_API_KEY=your_google_api_key  # Optional
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id  # Optional
```

### Running with Docker
```bash
# Start Qdrant vector database
docker-compose up -d vector-db

# Build and start the Flask backend
docker-compose up --build flask-app
```

### Running Locally
```bash
# Install dependencies
pip install -r requirements.txt

# Start the Flask server
python app.py
```

## Testing

Run the test script to verify the system works correctly:
```bash
python test_system.py
```

This will:
- Create a test document
- Upload it to the system
- Test question answering functionality
- Verify vector database operations

## Architecture

### Components
1. **Flask App** (`app.py`): Main application server
2. **Qdrant**: Vector database for document embeddings
3. **OpenAI**: AI model for question answering
4. **LangChain**: Document processing and vector operations

### Data Flow
1. User uploads document → File processed into chunks
2. Chunks converted to embeddings → Stored in user-specific Qdrant collection
3. User asks question → Similarity search in vector database
4. Relevant context retrieved → AI generates answer

### User Management
- **Anonymous Users**: Default user ID "anonymous"
- **Authenticated Users**: JWT token provides user ID
- **User Isolation**: Each user has separate document collection

## Troubleshooting

### Common Issues

**"Vector database is not initialized"**
- Check if Qdrant is running: `docker ps | grep qdrant`
- Verify Qdrant connection in health check: `GET /api/health`
- Check user ID consistency between upload and question endpoints

**Upload fails**
- Verify file type (PDF, DOCX, TXT only)
- Check file size (max 10MB)
- Ensure proper authentication headers

**Questions return no results**
- Confirm document was uploaded successfully
- Check vector database debug endpoint: `GET /api/debug-vector-db/<user_id>`
- Verify user ID matches between upload and question operations

### Debug Steps
1. Check health endpoint: `GET /api/health`
2. Verify user uploads: Check `user_uploads` in health response
3. Test vector database: `GET /api/debug-vector-db/<user_id>`
4. Check server logs for detailed error messages

## Development

### Adding New Features
- Follow the existing pattern for API endpoints
- Add proper error handling and logging
- Update the health check endpoint if adding new services
- Test with the provided test script

### Code Structure
- `app.py`: Main Flask application
- `Docs.py`: Legacy file (deprecated)
- `test_system.py`: Test script
- `requirements.txt`: Python dependencies
- `docker-compose.yml`: Container orchestration
- `Dockerfile`: Container build configuration