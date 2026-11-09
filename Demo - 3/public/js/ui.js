function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/** @param {HTMLElement | null} el */
function setBanner(el, message, type = 'info') {
  if (!el) return;
  if (!message) {
    el.className = 'hidden';
    el.textContent = '';
    return;
  }
  const map = {
    info: 'border-ink-200 bg-white text-ink-700',
    error: 'border-red-200 bg-red-50 text-red-900',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  };
  el.className = `rounded-lg border px-3 py-2 text-sm ${map[type] || map.info}`;
  el.textContent = message;
}

window.escapeHtml = escapeHtml;
window.setBanner = setBanner;
