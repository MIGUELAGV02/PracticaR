/**
 * utils.js - Funciones utilitarias compartidas
 */

export function normalizeText(value) {
  return String(value).trim().replace(/\s+/g, ' ');
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function showFlash(message, kind = 'success') {
  const flashStack = document.getElementById('flashStack');
  if (!flashStack) {
    return;
  }

  const flash = document.createElement('div');
  flash.className = `flash ${kind}`;
  flash.textContent = message;
  flashStack.replaceChildren(flash);

  window.clearTimeout(showFlash.timerId);
  showFlash.timerId = window.setTimeout(() => {
    flashStack.replaceChildren();
  }, 3000);
}

export function formatDateTime(date) {
  return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}
