#!/usr/bin/env python3
"""
Test script to verify the document upload and question answering system
"""

import requests
import json
import time
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
BASE_URL = "http://localhost:5001/api"
TEST_FILE_PATH = "test_document.txt"  # Create a simple test file

def create_test_file():
    """Create a simple test document"""
    test_content = """
    This is a test document for the Genium system.

    The system allows users to upload documents and ask questions about their content.
    It uses vector databases to store document embeddings and retrieve relevant information.

    Key features:
    - Document upload (PDF, DOCX, TXT)
    - Question answering based on document content
    - User-specific document collections
    - Vector similarity search

    The backend is built with Flask and uses Qdrant for vector storage.
    """
    with open(TEST_FILE_PATH, "w") as f:
        f.write(test_content)
    print(f"Created test file: {TEST_FILE_PATH}")

def test_health_check():
    """Test the health check endpoint"""
    print("\n=== Testing Health Check ===")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            health_data = response.json()
            print("✅ Health check passed")
            print(f"Vector stores: {health_data.get('vector_stores', 0)}")
            print(f"Vector DB keys: {health_data.get('vector_db_keys', [])}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {str(e)}")
        return False

def test_file_upload():
    """Test file upload functionality"""
    print("\n=== Testing File Upload ===")
    try:
        with open(TEST_FILE_PATH, "rb") as f:
            files = {"file": ("test_document.txt", f, "text/plain")}
            response = requests.post(f"{BASE_URL}/upload", files=files)

        if response.status_code == 200:
            upload_data = response.json()
            print("✅ File upload successful")
            print(f"User ID: {upload_data.get('user_id')}")
            print(f"Chunks count: {upload_data.get('chunks_count')}")
            print(f"Vector store created: {upload_data.get('vector_store_created')}")
            return upload_data.get('user_id'), True
        else:
            print(f"❌ File upload failed: {response.status_code}")
            print(f"Response: {response.text}")
            return None, False
    except Exception as e:
        print(f"❌ File upload error: {str(e)}")
        return None, False

def test_question_answering(user_id):
    """Test question answering functionality"""
    print("\n=== Testing Question Answering ===")
    try:
        # Test questions about the document
        questions = [
            "What is the Genium system?",
            "What file types does the system support?",
            "What backend technology is used?"
        ]

        for question in questions:
            print(f"\nAsking: {question}")
            payload = {"question": question}
            response = requests.post(f"{BASE_URL}/ask-document", json=payload)

            if response.status_code == 200:
                answer_data = response.json()
                answer = answer_data.get('answer', '')
                print(f"✅ Answer: {answer[:100]}...")
            else:
                print(f"❌ Question failed: {response.status_code}")
                print(f"Response: {response.text}")

        return True
    except Exception as e:
        print(f"❌ Question answering error: {str(e)}")
        return False

def test_vector_db_debug(user_id):
    """Test the vector database debug endpoint"""
    print("\n=== Testing Vector DB Debug ===")
    try:
        response = requests.get(f"{BASE_URL}/debug-vector-db/{user_id}")
        if response.status_code == 200:
            debug_data = response.json()
            print("✅ Vector DB debug successful")
            print(f"User has vector store: {debug_data.get('vector_db_has_user')}")
            print(f"Vector store type: {debug_data.get('vector_store_type', 'N/A')}")
            return True
        else:
            print(f"❌ Vector DB debug failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Vector DB debug error: {str(e)}")
        return False

def cleanup():
    """Clean up test files"""
    if os.path.exists(TEST_FILE_PATH):
        os.remove(TEST_FILE_PATH)
        print(f"Cleaned up test file: {TEST_FILE_PATH}")

def main():
    """Main test function"""
    print("🚀 Starting Genium System Tests")
    print("=" * 50)

    # Create test file
    create_test_file()

    # Run tests
    health_ok = test_health_check()

    if health_ok:
        user_id, upload_ok = test_file_upload()

        if upload_ok and user_id:
            # Wait a moment for vector store to be fully initialized
            time.sleep(2)

            # Test vector database debug
            test_vector_db_debug(user_id)

            # Test question answering
            test_question_answering(user_id)
        else:
            print("❌ Skipping question tests due to upload failure")
    else:
        print("❌ Skipping tests due to health check failure")

    # Cleanup
    cleanup()

    print("\n" + "=" * 50)
    print("🏁 Test completed")

if __name__ == "__main__":
    main()