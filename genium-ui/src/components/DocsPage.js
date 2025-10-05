
import React from 'react';

const DocsPage = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-background text-foreground py-16 px-6 pt-32">
      <div className="w-full max-w-6xl mx-auto mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-800 hover:text-gray-900 transition-colors"
        >
          ← Back to Overview
        </button>
      </div>

      {/* Page Title */}
      <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mt-8 mb-8">
      </h1>

      <article className="prose dark:prose-invert max-w-6xl mx-auto">
        <h1>Project Documentation</h1>

        <section className="mb-8">
          <h2>1. Project Overview</h2>
          <p className="leading-relaxed">
            <strong>GENIUM - Document QA Assistant</strong> is a sophisticated application designed to streamline <strong>document analysis</strong> and <strong>information retrieval</strong>. It features a modern <strong>React frontend</strong> for an intuitive user experience and a robust <strong>Python/Streamlit backend</strong> for powerful <strong>data processing</strong>. The system leverages cutting-edge <strong>AI technologies</strong>, including <strong>OpenAI GPT-4</strong> for advanced <strong>natural language understanding</strong> and <strong>Qdrant vector database</strong> for efficient <strong>semantic search</strong>. Users can upload various document types, including <strong>PDF and TXT files</strong>, ask questions in natural language, and receive <strong>AI-powered answers</strong> with precise <strong>page references</strong>.
          </p>
        </section>

        <section className="mb-8">
          <h2>2. Features</h2>
          <ul className="list-disc list-inside space-y-2 leading-relaxed">
            <li><strong>Document Upload:</strong> Supports uploading <strong>PDF</strong> and <strong>TXT</strong> documents up to <strong>50MB</strong>.</li>
            <li><strong>AI-Powered Question Answering:</strong> Get accurate answers to your document-related questions using <strong>OpenAI GPT-4</strong>.</li>
            <li><strong>Page References:</strong> Answers include direct references to the relevant pages in the uploaded documents.</li>
            <li><strong>Semantic Search:</strong> Utilizes <strong>Qdrant vector database</strong> for intelligent and context-aware information retrieval.</li>
            <li><strong>User-Friendly Interface:</strong> Intuitive <strong>React frontend</strong> for seamless interaction.</li>
            <li><strong>Scalable Backend:</strong> <strong>Python/Streamlit backend</strong> designed for efficient processing and scalability.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2>3. Architecture</h2>
          <p className="leading-relaxed">
            The GENIUM project follows a client-server architecture with a clear separation of concerns:
          </p>
          <h3 className="text-xl font-semibold mt-6 mb-2">Frontend (genium-ui/)</h3>
          <p className="leading-relaxed">
            Built with <strong>React</strong>, the frontend provides the <strong>user interface</strong> for <strong>document uploads</strong>, <strong>question input</strong>, and displaying <strong>AI-generated answers</strong>. It communicates with the backend via <strong>RESTful API calls</strong>.
          </p>
          <h3 className="text-xl font-semibold mt-6 mb-2">Backend (genium-backend/)</h3>
          <p className="leading-relaxed">
            Developed using <strong>Python</strong> and <strong>Streamlit</strong>, the backend handles <strong>document processing</strong>, interaction with the <strong>AI model (OpenAI GPT-4)</strong>, and <strong>vector database (Qdrant)</strong>.
          </p>
          <h3 className="text-xl font-semibold mt-6 mb-2">Data Flow:</h3>
          <ol className="list-decimal list-inside space-y-2 leading-relaxed">
            <li>User uploads a <strong>document</strong> via the <strong>React frontend</strong>.</li>
            <li>The frontend sends the document to the <strong>Python backend</strong>.</li>
            <li>The backend processes the document, extracts text, and generates <strong>embeddings</strong> using <strong>OpenAI's models</strong>.</li>
            <li>These embeddings are stored in the <strong>Qdrant vector database</strong>.</li>
            <li>When a user asks a question, the frontend sends it to the backend.</li>
            <li>The backend converts the question into a vector, queries <strong>Qdrant</strong> for relevant document chunks, and then uses <strong>OpenAI GPT-4</strong> to generate an answer based on the retrieved context.</li>
            <li>The answer, along with <strong>page references</strong>, is sent back to the frontend for display.</li>
          </ol>
          <h3 className="text-xl font-semibold mt-6 mb-2">Folder Structure:</h3>
          <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto text-sm leading-relaxed"><code>
.
├── genium-backend/
│   ├── app.py              # Main backend application file
│   ├── Dockerfile          # Dockerfile for backend
│   ├── docker-compose.yml  # Docker Compose for services
│   ├── requirements.txt    # Python dependencies
│   ├── .env.example        # Example environment variables
│   └── ...                 # Other backend files
└── genium-ui/
    ├── src/
    │   ├── App.js          # Main React application component
    │   ├── components/     # React components (e.g., FileUpload, DocsPage)
    │   ├── pages/          # Next.js pages
    │   └── ...             # Other frontend files
    ├── public/             # Static assets
    ├── package.json        # Frontend dependencies
    ├── next.config.js      # Next.js configuration
    └── ...                 # Other frontend files
          </code></pre>
        </section>

        <section className="mb-8">
          <h2>4. Setup Instructions</h2>
          <h3 className="text-xl font-semibold mt-6 mb-2">Local Development Setup</h3>
          <h4 className="text-lg font-medium mt-4 mb-2">Backend Setup (genium-backend/)</h4>
          <ol className="list-decimal list-inside space-y-2 leading-relaxed">
            <li><strong>Clone the repository:</strong>
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto text-sm leading-relaxed"><code>git clone [repository-url]
cd genium/genium-backend</code></pre>
            </li>
            <li><strong>Create a virtual environment:</strong>
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto text-sm leading-relaxed"><code>python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate</code></pre>
            </li>
            <li><strong>Install dependencies:</strong>
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto text-sm leading-relaxed"><code>pip install -r requirements.txt</code></pre>
            </li>
            <li><strong>Configure environment variables:</strong>
              <p className="leading-relaxed">Create a <code>.env</code> file in the <code>genium-backend/</code> directory based on <code>.env.example</code>.</p>
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto text-sm leading-relaxed"><code>OPENAI_API_KEY="your_openai_api_key"
QDRANT_HOST="localhost"
QDRANT_PORT="6333"
QDRANT_GRPC_PORT="6334"
QDRANT_API_KEY="your_qdrant_api_key" # Optional, if Qdrant is secured
BACKEND_PORT="8000"
FRONTEND_URL="http://localhost:3000"</code></pre>
            </li>
            <li><strong>Run the backend:</strong>
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto text-sm leading-relaxed"><code>streamlit run app.py</code></pre>
            </li>
          </ol>

          <h4 className="text-lg font-medium mt-4 mb-2">Frontend Setup (genium-ui/)</h4>
          <ol className="list-decimal list-inside space-y-2 leading-relaxed">
            <li><strong>Navigate to the frontend directory:</strong>
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto text-sm leading-relaxed"><code>cd genium/genium-ui</code></pre>
            </li>
            <li><strong>Install dependencies:</strong>
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto text-sm leading-relaxed"><code>npm install</code></pre>
            </li>
            <li><strong>Configure environment variables:</strong>
              <p className="leading-relaxed">Create a <code>.env</code> file in the <code>genium-ui/</code> directory based on <code>.env.example</code>.</p>
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto text-sm leading-relaxed"><code>NEXT_PUBLIC_BACKEND_URL="http://localhost:8000"
NEXT_PUBLIC_QDRANT_URL="http://localhost:6333" # Or your Qdrant instance URL
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_nextauth_secret"</code></pre>
            </li>
            <li><strong>Run the frontend:</strong>
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto text-sm leading-relaxed"><code>npm run dev</code></pre>
              <p className="leading-relaxed">The frontend will be accessible at <code>http://localhost:3000</code>.</p>
            </li>
          </ol>

          <h3 className="text-xl font-semibold mt-6 mb-2">Dockerized Setup</h3>
          <p className="leading-relaxed">
            For a containerized deployment, use Docker Compose. Ensure Docker and Docker Compose are installed on your system.
          </p>
          <ol className="list-decimal list-inside space-y-2 leading-relaxed">
            <li><strong>Navigate to the backend directory:</strong>
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto text-sm leading-relaxed"><code>cd genium/genium-backend</code></pre>
            </li>
            <li><strong>Configure environment variables:</strong>
              <p className="leading-relaxed">Create a <code>.env</code> file in the <code>genium-backend/</code> directory with your OpenAI and Qdrant details.</p>
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto text-sm leading-relaxed"><code>OPENAI_API_KEY="your_openai_api_key"
QDRANT_HOST="qdrant" # Service name in docker-compose.yml
QDRANT_PORT="6333"
QDRANT_GRPC_PORT="6334"
QDRANT_API_KEY="your_qdrant_api_key" # Optional
BACKEND_PORT="8000"
FRONTEND_URL="http://localhost:3000"</code></pre>
            </li>
            <li><strong>Build and run services:</strong>
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto text-sm leading-relaxed"><code>docker-compose up --build</code></pre>
              <p className="leading-relaxed">This will build and start the backend and Qdrant services. The frontend can be run locally as described above, or you can add it to the <code>docker-compose.yml</code> for a fully containerized solution.</p>
            </li>
          </ol>
        </section>

        <section className="mb-8">
          <h2>5. Configuration</h2>
          <h3 className="text-xl font-semibold mt-6 mb-2">Environment Variables</h3>
          <p className="leading-relaxed">
            The application relies on several <strong>environment variables</strong> for proper functioning. These should be set in <code>.env</code> files in their respective directories.
          </p>
          <h4 className="text-lg font-medium mt-4 mb-2">Backend (genium-backend/.env)</h4>
          <ul className="list-disc list-inside space-y-2 leading-relaxed">
            <li><code>OPENAI_API_KEY</code>: Your <strong>API key</strong> for <strong>OpenAI services</strong>. <strong>(Required)</strong></li>
            <li><code>QDRANT_HOST</code>: <strong>Hostname</strong> or <strong>IP</strong> of the <strong>Qdrant instance</strong>. Defaults to <code>localhost</code> for local setup, <code>qdrant</code> for Dockerized.</li>
            <li><code>QDRANT_PORT</code>: <strong>HTTP port</strong> for <strong>Qdrant</strong>. Defaults to <code>6333</code>.</li>
            <li><code>QDRANT_GRPC_PORT</code>: <strong>gRPC port</strong> for <strong>Qdrant</strong>. Defaults to <code>6334</code>.</li>
            <li><code>QDRANT_API_KEY</code>: <strong>API key</strong> for <strong>Qdrant</strong> (if authentication is enabled). <strong>(Optional)</strong></li>
            <li><code>BACKEND_PORT</code>: <strong>Port</strong> on which the backend <strong>Streamlit application</strong> runs. Defaults to <code>8000</code>.</li>
            <li><code>FRONTEND_URL</code>: <strong>URL</strong> of the frontend application, used for <strong>CORS</strong>.</li>
          </ul>
          <h4 className="text-lg font-medium mt-4 mb-2">Frontend (genium-ui/.env)</h4>
          <ul className="list-disc list-inside space-y-2 leading-relaxed">
            <li><code>NEXT_PUBLIC_BACKEND_URL</code>: <strong>URL</strong> of the <strong>backend API</strong>. E.g., <code>http://localhost:8000</code>. <strong>(Required)</strong></li>
            <li><code>NEXT_PUBLIC_QDRANT_URL</code>: <strong>URL</strong> of the <strong>Qdrant instance</strong>. E.g., <code>http://localhost:6333</code>.</li>
            <li><code>NEXTAUTH_URL</code>: <strong>Base URL</strong> for <strong>NextAuth</strong>. E.g., <code>http://localhost:3000</code>. <strong>(Required for authentication)</strong></li>
            <li><code>NEXTAUTH_SECRET</code>: A <strong>random string</strong> used to sign and encrypt <strong>NextAuth.js cookies</strong>. <strong>(Required for authentication)</strong></li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-2">Docker Services (docker-compose.yml)</h3>
          <p className="leading-relaxed">
            The <code>docker-compose.yml</code> file defines the services for the backend and Qdrant.
          </p>
          <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto text-sm leading-relaxed"><code>
version: '3.8'
services:
  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333" # HTTP API
      - "6334:6334" # gRPC
    volumes:
      - ./qdrant_data:/qdrant/data
    environment:
      QDRANT__SERVICE__GRPC_PORT: 6334
      QDRANT__SERVICE__HTTP_PORT: 6333
      # QDRANT__SERVICE__API_KEY: "your_qdrant_api_key" # Uncomment and set if using API key
  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      # Ensure these match your .env file in genium-backend/
      OPENAI_API_KEY: &lcub;OPENAI_API_KEY&rcub;
      QDRANT_HOST: qdrant
      QDRANT_PORT: &lcub;QDRANT_PORT&rcub;
      QDRANT_GRPC_PORT: &lcub;QDRANT_GRPC_PORT&rcub;
      QDRANT_API_KEY: &lcub;QDRANT_API_KEY&rcub; # If set in .env
      BACKEND_PORT: 8000
      FRONTEND_URL: &lcub;FRONTEND_URL&rcub;
    depends_on:
      - qdrant
          </code></pre>
        </section>

        <section className="mb-8">
          <h2>6. Usage Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 leading-relaxed">
            <li><strong>Start the application:</strong> Ensure both <strong>frontend</strong> and <strong>backend services</strong> are running (either locally or via Docker).</li>
            <li><strong>Access the Frontend:</strong> Open your web browser and navigate to the frontend <strong>URL</strong> (e.g., <code>http://localhost:3000</code>).</li>
            <li><strong>Upload a Document:</strong>
              <ul className="list-disc list-inside ml-4 space-y-1 leading-relaxed">
                <li>On the "Document QA" page, use the upload section to select a <strong>PDF</strong> or <strong>TXT</strong> file.</li>
                <li>Click "Upload" to send the document to the <strong>backend</strong> for processing.</li>
                <li>Wait for the "File uploaded successfully!" confirmation.</li>
              </ul>
            </li>
            <li><strong>Ask a Question:</strong>
              <ul className="list-disc list-inside ml-4 space-y-1 leading-relaxed">
                <li>Once the document is processed, type your question into the <strong>input field</strong>.</li>
                <li>Toggle the "Global Search" option if you wish to include <strong>web search results</strong> in addition to <strong>document-based answers</strong>.</li>
                <li>Press Enter or click the "Ask" button to get an <strong>AI-powered answer</strong>.</li>
              </ul>
            </li>
            <li><strong>Review the Answer:</strong> The <strong>AI-generated answer</strong> will appear in the response section, often with <strong>page references</strong> and <strong>highlighted keywords</strong>.</li>
            <li><strong>Download Notes:</strong> Click the "Download Notes" button to save the question and answer as a <strong>PDF</strong>.</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2>7. Security Features</h2>
          <ul className="list-disc list-inside space-y-2 leading-relaxed">
            <li><strong>API Key Management:</strong> <strong>OpenAI</strong> and <strong>Qdrant API keys</strong> are managed via <strong>environment variables</strong>, preventing hardcoding in the codebase.</li>
            <li><strong>CORS Protection:</strong> The backend is configured with <strong>CORS policies</strong> to restrict access to specified frontend origins.</li>
            <li><strong>Data Privacy:</strong> <strong>User-uploaded documents</strong> are processed and stored securely. Specific details on <strong>data retention</strong> and <strong>encryption</strong> would be elaborated based on deployment environment and compliance requirements.</li>
            <li><strong>Authentication (Optional):</strong> Integration with <strong>NextAuth.js</strong> provides flexible <strong>authentication strategies</strong>, securing user-specific functionalities.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2>8. Performance Optimizations</h2>
          <ul className="list-disc list-inside space-y-2 leading-relaxed">
            <li><strong>Vector Database Indexing:</strong> <strong>Qdrant</strong> efficiently indexes <strong>document embeddings</strong> for fast <strong>similarity search</strong>.</li>
            <li><strong>Asynchronous Processing:</strong> <strong>Backend operations</strong>, especially <strong>document processing</strong> and <strong>AI model inferences</strong>, are designed for <strong>asynchronous execution</strong> to prevent blocking.</li>
            <li><strong>Frontend Dynamic Imports:</strong> <strong>React components</strong> are dynamically imported to reduce <strong>initial bundle size</strong> and improve <strong>loading times</strong>.</li>
            <li><strong>Caching:</strong> Implement <strong>caching mechanisms</strong> for frequently accessed data or <strong>AI responses</strong> to reduce redundant computations (future enhancement).</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2>9. Troubleshooting</h2>
          <ul className="list-disc list-inside space-y-2 leading-relaxed">
            <li><strong>Backend Not Starting:</strong>
              <ul className="list-disc list-inside ml-4 space-y-1 leading-relaxed">
                <li>Check <code>.env</code> file for correct <strong>API keys</strong> and <strong>hostnames</strong>.</li>
                <li>Ensure all <strong>Python dependencies</strong> are installed (<code>pip install -r requirements.txt</code>).</li>
                <li>Verify <strong>Qdrant service</strong> is running and accessible if not using <strong>Docker Compose</strong>.</li>
              </ul>
            </li>
            <li><strong>Frontend Not Loading:</strong>
              <ul className="list-disc list-inside ml-4 space-y-1 leading-relaxed">
                <li>Ensure <strong>backend</strong> is running and <code>NEXT_PUBLIC_BACKEND_URL</code> in <code>genium-ui/.env</code> is correct.</li>
                <li>Check <strong>browser console</strong> for <strong>JavaScript errors</strong>.</li>
                <li>Verify all <strong>npm dependencies</strong> are installed (<code>npm install</code>).</li>
              </ul>
            </li>
            <li><strong>AI Responses are Slow or Incorrect:</strong>
              <ul className="list-disc list-inside ml-4 space-y-1 leading-relaxed">
                <li>Check <strong>OpenAI API key validity</strong> and <strong>rate limits</strong>.</li>
                <li>Ensure <strong>Qdrant</strong> is properly populated with <strong>document embeddings</strong>.</li>
                <li>Review <strong>backend logs</strong> for any errors during <strong>AI inference</strong>.</li>
              </ul>
            </li>
            <li><strong>Docker Compose Issues:</strong>
              <ul className="list-disc list-inside ml-4 space-y-1 leading-relaxed">
                <li>Ensure <strong>Docker daemon</strong> is running.</li>
                <li>Check <code>docker-compose.yml</code> for correct <strong>service configurations</strong> and <strong>port mappings</strong>.</li>
                <li>Use <code>docker-compose logs [service_name]</code> to inspect individual <strong>service logs</strong>.</li>
              </ul>
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2>10. Logs Access</h2>
          <ul className="list-disc list-inside space-y-2 leading-relaxed">
            <li><strong>Backend Logs:</strong> <strong>Streamlit applications</strong> typically output logs to the console where they are run. For <strong>Dockerized deployments</strong>, use <code>docker-compose logs backend</code>.</li>
            <li><strong>Frontend Logs:</strong> <strong>Browser console (Developer Tools)</strong> provides <strong>client-side logs</strong> and <strong>errors</strong>.</li>
            <li><strong>Qdrant Logs:</strong> For <strong>Dockerized Qdrant</strong>, use <code>docker-compose logs qdrant</code>. For local installations, refer to <strong>Qdrant's official documentation</strong> for log locations.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2>11. Contributing Guidelines</h2>
          <p className="leading-relaxed">
            We welcome <strong>contributions</strong> to the <strong>GENIUM project</strong>! To contribute:
          </p>
          <ol className="list-decimal list-inside space-y-2 leading-relaxed">
            <li><strong>Fork the repository</strong>.</li>
            <li>Create a <strong>new branch</strong> for your feature or bug fix.</li>
            <li>Implement your changes, adhering to the <strong>existing coding style</strong>.</li>
            <li>Write <strong>comprehensive tests</strong> for your new code.</li>
            <li>Ensure all <strong>existing tests pass</strong>.</li>
            <li>Submit a <strong>pull request</strong> with a clear description of your changes.</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2>12. License</h2>
          <p className="leading-relaxed">
            This project is licensed under the <strong>MIT License</strong>. See the <code>LICENSE</code> file in the root of the repository for more details.
          </p>
        </section>

        <section className="mb-8">
          <h2>13. Acknowledgments</h2>
          <ul className="list-disc list-inside space-y-2 leading-relaxed">
            <li><strong>OpenAI:</strong> For providing powerful <strong>language models</strong>.</li>
            <li><strong>Qdrant:</strong> For the efficient <strong>vector database solution</strong>.</li>
            <li><strong>React & Next.js:</strong> For the robust <strong>frontend framework</strong>.</li>
            <li><strong>Python & Streamlit:</strong> For the versatile <strong>backend development</strong>.</li>
            <li><strong>Lucide React:</strong> For the <strong>open-source icon library</strong>.</li>
          </ul>
        </section>
      </article>
    </div>
  );
};

export default DocsPage;
