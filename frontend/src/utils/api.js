/**
 * API client helper to interact with the FastAPI backend.
 */

const API_BASE = ''; // Proxy handles routing /api calls to port 8000

function getHeaders() {
  const headers = {};
  const userApiKey = localStorage.getItem('gemini_api_key');
  if (userApiKey) {
    headers['X-Gemini-Key'] = userApiKey;
  }
  return headers;
}

export async function analyzeFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/api/analyze/file`, {
    method: 'POST',
    headers: getHeaders(),
    body: formData,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || `Server error: ${response.status}`);
  }

  return await response.json();
}

export async function analyzeUrl(url) {
  const response = await fetch(`${API_BASE}/api/analyze/url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders(),
    },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || `Server error: ${response.status}`);
  }

  return await response.json();
}

export async function chatWithPaper(paperText, messages, userQuery) {
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders(),
    },
    body: JSON.stringify({
      paper_text: paperText,
      messages: messages.map(msg => ({ role: msg.role, content: msg.content })),
      user_query: userQuery,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || `Server error: ${response.status}`);
  }

  return await response.json();
}
