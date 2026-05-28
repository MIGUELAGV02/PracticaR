/**
 * auth.js - Autenticación y control de sesiones
 */

import { loadSessionData, saveSessionData, clearSessionData } from './storage.js';
import { normalizeText, showFlash } from './utils.js';

export function getSession() {
  return loadSessionData(null);
}

export function hasSession() {
  return !!getSession()?.nutriName;
}

export function requireSession() {
  if (!hasSession()) {
    showFlash('Debes iniciar sesión primero.', 'error');
    return false;
  }
  return true;
}

export function login(nutriName) {
  const normalizedName = normalizeText(nutriName);
  if (!normalizedName) {
    showFlash('Escribe tu nombre para entrar.', 'error');
    return false;
  }

  saveSessionData({ nutriName: normalizedName });
  showFlash(`Bienvenido, ${normalizedName}.`, 'success');
  return true;
}

export function logout() {
  clearSessionData();
  showFlash('Sesión cerrada.', 'success');
}
