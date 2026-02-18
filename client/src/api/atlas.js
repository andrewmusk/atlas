const BASE = '/api';

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    const error = new Error(err.error || res.statusText);
    error.status = res.status;
    error.code = err.code;
    throw error;
  }

  return res.json();
}

// Projects
export const getProjects = () => request('GET', '/projects');
export const getProjectSummary = (id) => request('GET', `/projects/${id}/summary`);

// Nodes
export const getNode = (id) => request('GET', `/nodes/${id}`);
export const createNode = (data) => request('POST', '/nodes', data);
export const updateNode = (id, data) => request('PATCH', `/nodes/${id}`, data);
export const deleteNode = (id) => request('DELETE', `/nodes/${id}`);

// Status
export const updateStatus = (id, data) => request('PATCH', `/nodes/${id}/status`, data);

// Children
export const getChildren = (id, type) =>
  request('GET', `/nodes/${id}/children${type ? `?type=${type}` : ''}`);

// Dependencies
export const addDependency = (id, targetId) =>
  request('POST', `/nodes/${id}/dependencies`, { targetId });
export const removeDependency = (id, targetId) =>
  request('DELETE', `/nodes/${id}/dependencies/${targetId}`);

// Chat
export const getChat = (id) => request('GET', `/nodes/${id}/chat`);
export const postMessage = (id, data) => request('POST', `/nodes/${id}/chat`, data);

// AI streaming — returns ReadableStream
export async function streamAiResponse(nodeId, content, author, authorType, sessionId) {
  const res = await fetch(`${BASE}/nodes/${nodeId}/chat/ai`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, author, authorType, sessionId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }

  return res.body;
}
