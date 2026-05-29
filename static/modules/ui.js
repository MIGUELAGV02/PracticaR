/**
 * ui.js - Renderizado de vistas (session, pacientes, consultas, historial)
 */

import { getSession, hasSession } from './auth.js';
import { getAllPatients, getPatientById } from './patients.js';
import { getConsultationsSorted } from './consultations.js';
import { escapeHtml, formatDateTime } from './utils.js';

export function renderSession() {
  const sessionChip = document.getElementById('sessionChip');
  const sessionName = document.getElementById('sessionName');
  const loginView = document.getElementById('loginView');
  const dashboardView = document.getElementById('dashboardView');

  if (!sessionChip || !sessionName || !loginView || !dashboardView) {
    return;
  }

  if (!hasSession()) {
    sessionChip.hidden = true;
    loginView.hidden = false;
    dashboardView.hidden = true;
    return;
  }

  const session = getSession();
  sessionName.textContent = session.nutriName;
  sessionChip.hidden = false;
  loginView.hidden = true;
  dashboardView.hidden = false;
}

export function renderPatientSelect() {
  const patientSelect = document.getElementById('patientId');
  if (!patientSelect) {
    return;
  }

  const patients = getAllPatients();
  const currentValue = patientSelect.value;

  patientSelect.innerHTML = '<option value="">Selecciona un paciente</option>';

  patients.forEach((patient) => {
    const option = document.createElement('option');
    option.value = patient.id;
    option.textContent = `${escapeHtml(patient.fullName)} - IMC ${patient.bmi} (${patient.diagnosis})`;
    patientSelect.appendChild(option);
  });

  if (patients.some((p) => p.id === currentValue)) {
    patientSelect.value = currentValue;
  }
}

export function renderStats() {
  const patientCount = document.getElementById('patientCount');
  const consultationCount = document.getElementById('consultationCount');
  const patients = getAllPatients();
  const consultations = getConsultationsSorted();

  if (patientCount) {
    patientCount.textContent = String(patients.length);
  }
  if (consultationCount) {
    consultationCount.textContent = String(consultations.length);
  }
}

export function renderHistory() {
  const historyContainer = document.getElementById('historyContainer');
  const historyStatus = document.getElementById('historyStatus');
  const historyTotal = document.getElementById('historyTotal');

  if (!historyContainer || !historyStatus) {
    return;
  }

  const consultations = getConsultationsSorted();

  if (historyTotal) {
    historyTotal.textContent = String(consultations.length);
  }

  if (!consultations.length) {
    historyContainer.innerHTML = '<p class="empty-state">Aún no hay consultas registradas.</p>';
    historyStatus.textContent = 'Sin actividad todavía';
    return;
  }

  historyContainer.innerHTML = consultations
    .map((consultation) => {
      const patient = getPatientById(consultation.patientId);
      if (!patient) {
        return '';
      }

      return `
        <article class="history-item" data-consult-id="${escapeHtml(consultation.id)}">
          <div class="history-head">
            <strong>${escapeHtml(patient.fullName)}</strong>
            <span>${escapeHtml(consultation.consultDate)} ${escapeHtml(consultation.consultTime)}</span>
          </div>
          <p><span class="label">IMC:</span> ${patient.bmi} - ${patient.diagnosis}</p>
          <p><span class="label">Evolución:</span> ${escapeHtml(consultation.evolution)}</p>
          <p><span class="label">Plan:</span> ${escapeHtml(consultation.mealPlan)}</p>
          <div class="history-actions">
            <button class="edit-consultation-btn" type="button" data-consult-id="${escapeHtml(consultation.id)}">✏️ Editar</button>
            <button class="delete-consultation-btn" type="button" data-consult-id="${escapeHtml(consultation.id)}">🗑️ Eliminar</button>
          </div>
        </article>
      `;
    })
    .join('');

  historyStatus.textContent = `Actualizado ${formatDateTime(new Date())}`;
}

export function renderAll() {
  renderSession();
  renderPatientSelect();
  renderStats();
  renderHistory();
}
