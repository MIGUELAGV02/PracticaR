/**
 * forms.js - Manejo de formularios (login, paciente, consulta)
 */

import { login, logout, requireSession } from './auth.js';
import { createOrUpdatePatient } from './patients.js';
import { createConsultation, updateConsultation, getConsultationById, deleteConsultation } from './consultations.js';
import { calculateBmi, diagnoseBmi } from './bmi.js';
import { renderAll } from './ui.js';

let currentEditingConsultationId = null;

export function setupLoginForm() {
  const loginForm = document.getElementById('loginForm');
  if (!loginForm) {
    return;
  }

  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const nutriNameInput = document.getElementById('nutriName');
    const nutriName = nutriNameInput?.value || '';

    if (login(nutriName)) {
      loginForm.reset();
      renderAll();
    }
  });

  const logoutButton = document.getElementById('logoutButton');
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      logout();
      renderAll();
    });
  }
}

export function setupBmiPreview() {
  const heightInput = document.getElementById('heightCm');
  const weightInput = document.getElementById('weightKg');
  const bmiPreview = document.getElementById('bmiPreview');
  const diagnosisPreview = document.getElementById('diagnosisPreview');

  if (!heightInput || !weightInput || !bmiPreview || !diagnosisPreview) {
    return;
  }

  const updatePreview = () => {
    const height = Number.parseFloat(heightInput.value);
    const weight = Number.parseFloat(weightInput.value);
    const bmi = calculateBmi(weight, height);

    if (bmi === null || Number.isNaN(bmi)) {
      bmiPreview.textContent = 'IMC: --';
      diagnosisPreview.textContent = 'Diagnóstico: pendiente de cálculo';
      return;
    }

    bmiPreview.textContent = `IMC: ${bmi}`;
    diagnosisPreview.textContent = diagnoseBmi(bmi);
  };

  [heightInput, weightInput].forEach((input) => input.addEventListener('input', updatePreview));
  updatePreview();
}

export function setupPatientForm() {
  const patientForm = document.getElementById('patientForm');
  if (!patientForm) {
    return;
  }

  patientForm.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!requireSession()) {
      renderAll();
      return;
    }

    const fullName = document.getElementById('fullName')?.value || '';
    const age = document.getElementById('age')?.value || '';
    const heightCm = document.getElementById('heightCm')?.value || '';
    const weightKg = document.getElementById('weightKg')?.value || '';

    if (createOrUpdatePatient(fullName, age, heightCm, weightKg)) {
      patientForm.reset();
      document.getElementById('bmiPreview').textContent = 'IMC: --';
      document.getElementById('diagnosisPreview').textContent = 'Diagnóstico: pendiente de cálculo';
      renderAll();
    }
  });

  const clearPatientBtn = document.getElementById('clearPatientBtn');
  if (clearPatientBtn) {
    clearPatientBtn.addEventListener('click', () => {
      patientForm.reset();
      document.getElementById('bmiPreview').textContent = 'IMC: --';
      document.getElementById('diagnosisPreview').textContent = 'Diagnóstico: pendiente de cálculo';
    });
  }
}

export function setupConsultationForm() {
  const consultationForm = document.getElementById('consultationForm');
  const submitBtn = document.getElementById('submitConsultationBtn');

  if (!consultationForm) {
    return;
  }

  const consultDate = document.getElementById('consultDate');
  const consultTime = document.getElementById('consultTime');
  if (consultDate) {
    consultDate.value = new Date().toISOString().slice(0, 10);
  }
  if (consultTime) {
    consultTime.value = new Date().toTimeString().slice(0, 5);
  }

  consultationForm.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!requireSession()) {
      renderAll();
      return;
    }

    const patientId = document.getElementById('patientId')?.value || '';
    const consultDateValue = document.getElementById('consultDate')?.value || '';
    const consultTimeValue = document.getElementById('consultTime')?.value || '';
    const evolution = document.getElementById('evolution')?.value || '';
    const mealPlan = document.getElementById('mealPlan')?.value || '';

    if (currentEditingConsultationId) {
      if (
        updateConsultation(currentEditingConsultationId, {
          consultDate: consultDateValue,
          consultTime: consultTimeValue,
          evolution,
          mealPlan,
        })
      ) {
        currentEditingConsultationId = null;
        consultationForm.reset();
        if (submitBtn) {
          submitBtn.textContent = 'Guardar consulta';
        }
        if (consultDate) {
          consultDate.value = new Date().toISOString().slice(0, 10);
        }
        if (consultTime) {
          consultTime.value = new Date().toTimeString().slice(0, 5);
        }
        renderAll();
      }
    } else {
      if (createConsultation(patientId, consultDateValue, consultTimeValue, evolution, mealPlan)) {
        consultationForm.reset();
        if (consultDate) {
          consultDate.value = new Date().toISOString().slice(0, 10);
        }
        if (consultTime) {
          consultTime.value = new Date().toTimeString().slice(0, 5);
        }
        renderAll();
      }
    }
  });

  const clearConsultationBtn = document.getElementById('clearConsultationBtn');
  if (clearConsultationBtn) {
    clearConsultationBtn.addEventListener('click', () => {
      currentEditingConsultationId = null;
      consultationForm.reset();
      if (submitBtn) {
        submitBtn.textContent = 'Guardar consulta';
      }
      if (consultDate) {
        consultDate.value = new Date().toISOString().slice(0, 10);
      }
      if (consultTime) {
        consultTime.value = new Date().toTimeString().slice(0, 5);
      }
    });
  }
}

export function setupHistoryActions() {
  document.addEventListener('click', (event) => {
    const editBtn = event.target.closest('.edit-consultation-btn');
    if (editBtn) {
      const consultId = editBtn.dataset.consultId;
      const consultation = getConsultationById(consultId);
      if (consultation) {
        currentEditingConsultationId = consultId;
        document.getElementById('patientId').value = consultation.patientId;
        document.getElementById('consultDate').value = consultation.consultDate;
        document.getElementById('consultTime').value = consultation.consultTime;
        document.getElementById('evolution').value = consultation.evolution;
        document.getElementById('mealPlan').value = consultation.mealPlan;

        const submitBtn = document.getElementById('submitConsultationBtn');
        if (submitBtn) {
          submitBtn.textContent = 'Guardar cambios';
        }

        document.querySelector('.panel.form-panel:last-of-type')?.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    const deleteBtn = event.target.closest('.delete-consultation-btn');
    if (deleteBtn) {
      const consultId = deleteBtn.dataset.consultId;
      if (confirm('¿Eliminar esta consulta?')) {
        deleteConsultation(consultId);
        renderAll();
      }
    }
  });
}

export function setupAllForms() {
  setupLoginForm();
  setupBmiPreview();
  setupPatientForm();
  setupConsultationForm();
  setupHistoryActions();
}
