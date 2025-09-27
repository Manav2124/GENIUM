// API utility functions for Genium UI

const API_BASE_URL = 'http://localhost:5002/api';

/**
 * Upload a file to the backend
 * @param {File} file - The file to upload
 * @param {string} userId - The user ID
 * @param {string} token - The authentication token
 * @returns {Promise<Object>} - The upload response
 */
export async function uploadFileToBackend(file, userId, token) {
  try {
    console.log('Starting actual file upload to backend...');

    // Create FormData for multipart upload
    const formData = new FormData();
    formData.append('file', file);

    // Prepare headers
    const headers = {
      // Don't set Content-Type for FormData - let browser set it with boundary
    };

    // Add authorization header if token is provided
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    console.log('Sending file to backend:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      userId: userId || 'anonymous',
      hasToken: !!token
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: headers,
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
      console.error('Backend upload error:', errorData);
      throw new Error(errorData.error || `Upload failed with status ${response.status}`);
    }

    const result = await response.json();
    console.log('File uploaded successfully:', result);

    return result;
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error('Upload failed: ' + error.message);
  }
}

/**
 * Ask a question to the AI
 * @param {string} question - The question to ask
 * @param {string} token - The authentication token
 * @returns {Promise<Object>} - The AI response
 */
export async function askQuestion(question, token) {
  try {
    const response = await fetch(`${API_BASE_URL}/ask`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Ask question error:', error);
    throw error;
  }
}

/**
 * Ask a question about the uploaded document
 * @param {string} question - The question to ask about the document
 * @param {string} token - The authentication token
 * @returns {Promise<Object>} - The AI response based on document content
 */
export async function askDocumentQuestion(question, token) {
  try {
    console.log('Asking document question:', question);

    const response = await fetch(`${API_BASE_URL}/ask-document`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question: question.trim() }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Document question failed' }));
      console.error('Document question error response:', errorData);
      throw new Error(errorData.error || `Document question failed with status ${response.status}`);
    }

    const result = await response.json();
    console.log('Document question response:', result);

    return result;
  } catch (error) {
    console.error('Ask document question error:', error);
    throw error;
  }
}

/**
 * Ask a question with global search (document + web)
 * @param {string} question - The question to ask
 * @param {boolean} globalSearch - Whether to include web search
 * @param {string} token - The authentication token
 * @returns {Promise<Object>} - The AI response
 */
export async function askQuestionWithGlobalSearch(question, globalSearch, token) {
  try {
    const response = await fetch(`${API_BASE_URL}/ask`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: question.trim(),
        globalSearch: globalSearch
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Ask question with global search error:', error);
    throw error;
  }
}

/**
 * Debug token information
 * @param {string} token - The token to debug
 * @returns {Promise<Object>} - Token debug information
 */
export async function debugToken(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/debug-token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Debug failed' }));
      throw new Error(errorData.error || `Debug failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Debug token error:', error);
    throw error;
  }
}

/**
 * Fetch user files
 * @param {string} userId - The user ID
 * @param {string} token - The authentication token
 * @returns {Promise<Object>} - User files data
 */
export async function fetchUserFiles(userId, token) {
  try {
    const response = await fetch(`${API_BASE_URL}/files/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Fetch failed' }));
      throw new Error(errorData.error || `Fetch failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Fetch user files error:', error);
    throw error;
  }
}

/**
 * Test authentication
 * @param {string} token - The authentication token
 * @returns {Promise<Object>} - Authentication test result
 */
export async function testAuthentication(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/test`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Auth test failed' }));
      throw new Error(errorData.error || `Auth test failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Test authentication error:', error);
    throw error;
  }
}

/**
 * Check authentication status
 * @param {string} token - The authentication token
 * @returns {Promise<Object>} - Authentication status
 */
export async function checkAuthStatus(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Auth check failed' }));
      throw new Error(errorData.error || `Auth check failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Check auth status error:', error);
    throw error;
  }
}

/**
 * Check backend health and service status
 * @returns {Promise<Object>} - Health status information
 */
export async function checkBackendHealth() {
  try {
    console.log('Checking backend health...');
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Health check failed' }));
      console.error('Health check failed:', errorData);
      throw new Error(errorData.error || `Health check failed with status ${response.status}`);
    }

    const healthData = await response.json();
    console.log('Backend health status:', healthData);

    return healthData;
  } catch (error) {
    console.error('Backend health check error:', error);
    // Return a basic status if health endpoint fails
    return {
      status: 'error',
      services: {
        flask: 'unknown',
        qdrant: 'unknown',
        openai: 'unknown'
      },
      error: error.message
    };
  }
}