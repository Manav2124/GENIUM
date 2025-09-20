#!/usr/bin/env python3
"""
Test script to verify .env file loading and environment variables
"""
import os
from dotenv import load_dotenv

# Load environment variables from parent directory
load_dotenv(dotenv_path='../.env')

print("=== Environment Variables Test ===")
print(f"Current working directory: {os.getcwd()}")
print(f"Parent directory: {os.path.dirname(os.getcwd())}")

# Check API keys
openai_key = os.getenv("OPENAI_API_KEY")
gemini_key = os.getenv("GEMINI_API_KEY")
google_key = os.getenv("GOOGLE_API_KEY")
nextauth_secret = os.getenv("NEXTAUTH_SECRET")

print("\n=== API Keys Status ===")
print(f"OPENAI_API_KEY: {'Present' if openai_key else 'Missing'} ({len(openai_key) if openai_key else 0} chars)")
print(f"OPENAI_API_KEY starts with: {openai_key[:20] + '...' if openai_key else 'N/A'}")

print(f"GEMINI_API_KEY: {'Present' if gemini_key else 'Missing'} ({len(gemini_key) if gemini_key else 0} chars)")
print(f"GEMINI_API_KEY starts with: {gemini_key[:20] + '...' if gemini_key else 'N/A'}")

print(f"GOOGLE_API_KEY: {'Present' if google_key else 'Missing'} ({len(google_key) if google_key else 0} chars)")
print(f"NEXTAUTH_SECRET: {'Present' if nextauth_secret else 'Missing'} ({len(nextauth_secret) if nextauth_secret else 0} chars)")

# Check if keys look valid
print("\n=== Validation ===")
if openai_key and openai_key.startswith('sk-'):
    print("✅ OPENAI_API_KEY format looks correct")
else:
    print("❌ OPENAI_API_KEY format is invalid or missing")

if gemini_key and gemini_key.startswith('AIza'):
    print("✅ GEMINI_API_KEY format looks correct")
else:
    print("❌ GEMINI_API_KEY format is invalid or missing")

if google_key and google_key.startswith('AIza'):
    print("✅ GOOGLE_API_KEY format looks correct")
else:
    print("❌ GOOGLE_API_KEY format is invalid or missing")

print("\n=== File Paths ===")
env_path = os.path.join(os.path.dirname(os.getcwd()), '.env')
print(f"Expected .env path: {env_path}")
print(f".env file exists: {os.path.exists(env_path)}")

backend_env_path = os.path.join(os.getcwd(), '.env')
print(f"Backend .env path: {backend_env_path}")
print(f"Backend .env file exists: {os.path.exists(backend_env_path)}")