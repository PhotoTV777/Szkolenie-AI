async function parseJsonResponse(res) {
  const text = await res.text();
  if (!text) {
    return {};
  }
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

async function fetchWithNetworkError(path, options) {
  try {
    return await fetch(path, options);
  } catch {
    throw new Error(
      'Nie udało się połączyć z serwerem. Uruchom aplikację (np. .\\dev.ps1).'
    );
  }
}

async function apiGet(path) {
  const res = await fetchWithNetworkError(path);
  const data = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(data.error || `Żądanie nie powiodło się (${res.status})`);
  }
  return data;
}

async function apiPost(path, body, extraHeaders = {}) {
  const res = await fetchWithNetworkError(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
    body: JSON.stringify(body),
  });
  const data = await parseJsonResponse(res);
  return {
    ok: res.ok,
    status: res.status,
    data,
    error: data.error || (res.ok ? undefined : `Żądanie nie powiodło się (${res.status})`),
  };
}

window.apiGet = apiGet;
window.apiPost = apiPost;
