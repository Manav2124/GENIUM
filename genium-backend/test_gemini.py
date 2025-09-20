#!/usr/bin/env python3
"""
Test script to verify Gemini API key functionality
"""
import os
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables from parent directory
load_dotenv(dotenv_path='../.env')

print("=== Gemini API Key Test ===")

# Get the Gemini API key
gemini_key = os.getenv("GEMINI_API_KEY")
print(f"GEMINI_API_KEY: {'Present' if gemini_key else 'Missing'}")
print(f"Key starts with: {gemini_key[:20] + '...' if gemini_key else 'N/A'}")

if not gemini_key:
    print("❌ GEMINI_API_KEY not found in environment variables")
    exit(1)

# Check if key looks like a placeholder
if gemini_key == "AIzaSyBbtvhLgTbky2N_PqKa8AY4IhXbnE9zZ6s":
    print("❌ This appears to be a placeholder API key")
    print("   Please get a real API key from: https://makersuite.google.com/app/apikey")
    exit(1)

try:
    print("\n🔄 Testing Gemini API key...")
    genai.configure(api_key=gemini_key)

    # Try to list available models
    print("📋 Listing available Gemini models...")
    models = genai.list_models()
    gemini_models = [m for m in models if 'generateContent' in m.supported_generation_methods]

    if gemini_models:
        print(f"✅ Found {len(gemini_models)} Gemini models with generateContent support")
        for model in gemini_models[:3]:  # Show first 3
            print(f"   - {model.name}")
    else:
        print("❌ No Gemini models found with generateContent support")
        exit(1)

    # Try to get a specific model
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        print("✅ Successfully initialized Gemini model")
    except Exception as e:
        print(f"⚠️  Could not initialize gemini-2.5-flash: {e}")
        # Try alternative model
        try:
            model = genai.GenerativeModel('gemini-pro')
            print("✅ Successfully initialized Gemini-pro model")
        except Exception as e2:
            print(f"❌ Could not initialize any Gemini model: {e2}")
            exit(1)

    # Test a simple generation
    print("\n🧪 Testing simple text generation...")
    response = model.generate_content("Hello, can you respond with just 'Hello back!'?", safety_settings={'HARASSMENT': 'BLOCK_NONE', 'HATE_SPEECH': 'BLOCK_NONE', 'SEXUALLY_EXPLICIT': 'BLOCK_NONE', 'DANGEROUS_CONTENT': 'BLOCK_NONE'})

    if response and response.candidates:
        result = response.candidates[0].content.parts[0].text
        print(f"✅ Gemini API test successful!")
        print(f"   Response: {result}")
    else:
        print("❌ Gemini API returned empty response")
        exit(1)

except Exception as e:
    print(f"❌ Gemini API test failed: {e}")
    print("\n🔍 Troubleshooting tips:")
    print("   1. Verify your API key is correct")
    print("   2. Check if your API key has proper permissions")
    print("   3. Ensure billing is enabled for your Google Cloud project")
    print("   4. Try generating a new API key")
    exit(1)

print("\n🎉 Gemini API key is working correctly!")