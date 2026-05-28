/**
 * consultations.js - Gestión de consultas sin duplicación de datos
 * Guarda solo patientId, no duplica peso/estatura/IMC
 */

import { loadConsultations, saveConsultations } from './storage.js';
import { normalizeText, createId, showFlash } from './utils.js';

export function getAllConsultations() {
  return loadConsultations([]);
}

export function getConsultationById(consultId) {
  const consultations = getAllConsultations();
  return consultations.find((c) => c.id === consultId) || null;
}

export function createConsultation(patientId, consultDate, consultTime, evolution, mealPlan) {
  patientId = String(patientId || '').trim();
  consultDate = String(consultDate || '').trim();
  consultTime = String(consultTime || '').trim();
  evolution = normalizeText(evolution);
  mealPlan = normalizeText(mealPlan);

  if (!patientId || !consultDate || !consultTime || !evolution || !mealPlan) {
    showFlash('Completa todos los campos de la consulta.', 'error');
    return null;
  }

  const consultations = getAllConsultations();
  const newConsultation = {
    id: createId(),
    patientId,
    consultDate,
    consultTime,
    evolution,
    mealPlan,
    createdAt: new Date().toISOString(),
  };

  consultations.push(newConsultation);
  saveConsultations(consultations);
  showFlash('Consulta guardada correctamente.', 'success');
  return newConsultation;
}

export function updateConsultation(consultId, updates) {
  const consultations = getAllConsultations();
  const index = consultations.findIndex((c) => c.id === consultId);

  if (index < 0) {
    showFlash('Consulta no encontrada.', 'error');
    return null;
  }

  const consultation = consultations[index];
  if (updates.consultDate) {
    consultation.consultDate = String(updates.consultDate).trim();
  }
  if (updates.consultTime) {
    consultation.consultTime = String(updates.consultTime).trim();
  }
  if (updates.evolution !== undefined) {
    consultation.evolution = normalizeText(updates.evolution);
  }
  if (updates.mealPlan !== undefined) {
    consultation.mealPlan = normalizeText(updates.mealPlan);
  }

  consultations[index] = consultation;
  saveConsultations(consultations);
  showFlash('Consulta actualizada correctamente.', 'success');
  return consultation;
}

export function deleteConsultation(consultId) {
  const consultations = getAllConsultations();
  const filtered = consultations.filter((c) => c.id !== consultId);

  if (filtered.length === consultations.length) {
    showFlash('Consulta no encontrada.', 'error');
    return false;
  }

  saveConsultations(filtered);
  showFlash('Consulta eliminada.', 'success');
  return true;
}

export function getConsultationsSorted() {
  return [...getAllConsultations()].sort((left, right) => {
    const leftStamp = `${left.consultDate}T${left.consultTime}`;
    const rightStamp = `${right.consultDate}T${right.consultTime}`;
    return rightStamp.localeCompare(leftStamp);
  });
}
