/**
 * storage.js - Gestión centralizada de localStorage y sessionStorage
 * Login → sessionStorage (se borra al cerrar la pestaña)
 * Pacientes y consultas → localStorage (permanente)
 */

const STORAGE_KEYS = {
  session: 'nutri_gc_session',
  patients: 'nutri_gc_patients',
  consultations: 'nutri_gc_consultations',
};

export function loadSessionData(fallback = null) {
  const rawValue = sessionStorage.getItem(STORAGE_KEYS.session);
  if (!rawValue) return fallback;
  try {
    return JSON.parse(rawValue);
  } catch {
    return fallback;
  }
}

export function saveSessionData(value) {
  sessionStorage.setItem(STORAGE_KEYS.session, JSON.stringify(value));
}

export function clearSessionData() {
  sessionStorage.removeItem(STORAGE_KEYS.session);
}

export function loadPatients(fallback = []) {
  const rawValue = localStorage.getItem(STORAGE_KEYS.patients);
  if (!rawValue) return fallback;
  try {
    return JSON.parse(rawValue);
  } catch {
    return fallback;
  }
}

export function savePatients(patients) {
  localStorage.setItem(STORAGE_KEYS.patients, JSON.stringify(patients));
}

export function loadConsultations(fallback = []) {
  const rawValue = localStorage.getItem(STORAGE_KEYS.consultations);
  if (!rawValue) return fallback;
  try {
    return JSON.parse(rawValue);
  } catch {
    return fallback;
  }
}

export function saveConsultations(consultations) {
  localStorage.setItem(STORAGE_KEYS.consultations, JSON.stringify(consultations));
}
