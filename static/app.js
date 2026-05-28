const STORAGE_KEYS = {
  session: 'nutri_gc_session',
  patients: 'nutri_gc_patients',
  consultations: 'nutri_gc_consultations',
};

function loadData(key, fallback) {
  const rawValue = localStorage.getItem(key);
  if (!rawValue) {
    return fallback;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    return fallback;
  }
}

function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeText(value) {
  return value.trim().replace(/\s+/g, ' ');
}

function calculateBmi(weightKg, heightCm) {
  const heightM = heightCm / 100;
  if (!heightM || heightM <= 0) {
    return null;
  }
  return +(weightKg / (heightM * heightM)).toFixed(2);
}

function diagnoseBmi(bmi) {
  if (bmi === null) {
    return 'Diagnóstico: pendiente de cálculo';
  }
  if (bmi < 18.5) {
    return 'Diagnóstico: bajo peso';
  }
  if (bmi < 25) {
    return 'Diagnóstico: peso normal';
  }
  if (bmi < 30) {
    return 'Diagnóstico: sobrepeso';
  }
  return 'Diagnóstico: obesidad';
}

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function showFlash(message, kind = 'success') {
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

function getSession() {
  return loadData(STORAGE_KEYS.session, null);
}

function setSession(nutriName) {
  saveData(STORAGE_KEYS.session, { nutriName });
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.session);
}

function getPatients() {
  return loadData(STORAGE_KEYS.patients, []);
}

function setPatients(patients) {
  saveData(STORAGE_KEYS.patients, patients);
}

function getConsultations() {
  return loadData(STORAGE_KEYS.consultations, []);
}

function setConsultations(consultations) {
  saveData(STORAGE_KEYS.consultations, consultations);
}

function renderSession() {
  const session = getSession();
  const sessionChip = document.getElementById('sessionChip');
  const sessionName = document.getElementById('sessionName');
  const loginView = document.getElementById('loginView');
  const dashboardView = document.getElementById('dashboardView');

  if (!sessionChip || !sessionName || !loginView || !dashboardView) {
    return;
  }

  if (!session?.nutriName) {
    sessionChip.hidden = true;
    loginView.hidden = false;
    dashboardView.hidden = true;
    return;
  }

  sessionName.textContent = session.nutriName;
  sessionChip.hidden = false;
  loginView.hidden = true;
  dashboardView.hidden = false;
}

function renderPatientSelect() {
  const patientSelect = document.getElementById('patientId');
  if (!patientSelect) {
    return;
  }

  const patients = getPatients();
  const currentValue = patientSelect.value;

  patientSelect.innerHTML = '<option value="">Selecciona un paciente</option>';

  patients.forEach((patient) => {
    const option = document.createElement('option');
    option.value = patient.id;
    option.textContent = `${patient.fullName} - IMC ${patient.bmi} (${patient.diagnosis})`;
    patientSelect.appendChild(option);
  });

  if (patients.some((patient) => patient.id === currentValue)) {
    patientSelect.value = currentValue;
  }
}

function renderStats() {
  const patientCount = document.getElementById('patientCount');
  const consultationCount = document.getElementById('consultationCount');
  const patients = getPatients();
  const consultations = getConsultations();

  if (patientCount) {
    patientCount.textContent = String(patients.length);
  }
  if (consultationCount) {
    consultationCount.textContent = String(consultations.length);
  }
}

function renderHistory() {
  const historyContainer = document.getElementById('historyContainer');
  const historyStatus = document.getElementById('historyStatus');
  if (!historyContainer || !historyStatus) {
    return;
  }

  const consultations = [...getConsultations()].sort((left, right) => {
    const leftStamp = `${left.consultDate}T${left.consultTime}`;
    const rightStamp = `${right.consultDate}T${right.consultTime}`;
    return rightStamp.localeCompare(leftStamp);
  });

  if (!consultations.length) {
    historyContainer.innerHTML = '<p class="empty-state">Aún no hay consultas registradas.</p>';
    historyStatus.textContent = 'Sin actividad todavía';
    return;
  }

  historyContainer.innerHTML = consultations
    .map(
      (item) => `
        <article class="history-item">
          <div class="history-head">
            <strong>${escapeHtml(item.patientName)}</strong>
            <span>${escapeHtml(item.consultDate)} ${escapeHtml(item.consultTime)}</span>
          </div>
          <p><span class="label">IMC:</span> ${escapeHtml(item.bmi)} - ${escapeHtml(item.diagnosis)}</p>
          <p><span class="label">Evolución:</span> ${escapeHtml(item.evolution)}</p>
          <p><span class="label">Plan:</span> ${escapeHtml(item.mealPlan)}</p>
        </article>
      `,
    )
    .join('');

  historyStatus.textContent = `Actualizado ${new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
}

function renderAll() {
  renderSession();
  renderPatientSelect();
  renderStats();
  renderHistory();
}

function setupLogin() {
  const loginForm = document.getElementById('loginForm');
  if (!loginForm) {
    return;
  }

  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const nutriNameInput = document.getElementById('nutriName');
    const nutriName = normalizeText(nutriNameInput?.value || '');

    if (!nutriName) {
      showFlash('Escribe tu nombre para entrar.', 'error');
      return;
    }

    setSession(nutriName);
    showFlash(`Bienvenido, ${nutriName}.`, 'success');
    renderAll();
  });

  const logoutButton = document.getElementById('logoutButton');
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      clearSession();
      showFlash('Sesión cerrada.', 'success');
      renderAll();
    });
  }
}

function setupBmiPreview() {
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

function setupPatientForm() {
  const patientForm = document.getElementById('patientForm');
  if (!patientForm) {
    return;
  }

  patientForm.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!getSession()?.nutriName) {
      showFlash('Debes iniciar sesión primero.', 'error');
      renderSession();
      return;
    }

    const fullName = normalizeText(document.getElementById('fullName')?.value || '');
    const age = Number.parseInt(document.getElementById('age')?.value || '', 10);
    const heightCm = Number.parseFloat(document.getElementById('heightCm')?.value || '');
    const weightKg = Number.parseFloat(document.getElementById('weightKg')?.value || '');

    if (!fullName || !age || !heightCm || !weightKg) {
      showFlash('Completa todos los campos del preregistro.', 'error');
      return;
    }

    if (age <= 0 || heightCm <= 0 || weightKg <= 0) {
      showFlash('Los valores deben ser mayores a cero.', 'error');
      return;
    }

    const bmi = calculateBmi(weightKg, heightCm);
    const diagnosis = diagnoseBmi(bmi);
    const patients = getPatients();
    const timestamp = new Date().toISOString();
    const existingIndex = patients.findIndex((patient) => patient.fullName.toLowerCase() === fullName.toLowerCase());
    const patientRecord = {
      id: existingIndex >= 0 ? patients[existingIndex].id : createId(),
      fullName,
      age,
      heightCm,
      weightKg,
      bmi,
      diagnosis,
      createdAt: existingIndex >= 0 ? patients[existingIndex].createdAt : timestamp,
      updatedAt: timestamp,
    };

    if (existingIndex >= 0) {
      patients[existingIndex] = patientRecord;
      showFlash(`Paciente actualizado: ${fullName}.`, 'success');
    } else {
      patients.push(patientRecord);
      showFlash(`Paciente guardado: ${fullName}.`, 'success');
    }

    setPatients(patients);
    patientForm.reset();
    document.getElementById('bmiPreview').textContent = 'IMC: --';
    document.getElementById('diagnosisPreview').textContent = 'Diagnóstico: pendiente de cálculo';
    renderAll();
  });
}

function setupConsultationForm() {
  const consultationForm = document.getElementById('consultationForm');
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

    if (!getSession()?.nutriName) {
      showFlash('Debes iniciar sesión primero.', 'error');
      renderSession();
      return;
    }

    const patientId = document.getElementById('patientId')?.value || '';
    const consultDateValue = document.getElementById('consultDate')?.value || '';
    const consultTimeValue = document.getElementById('consultTime')?.value || '';
    const evolution = normalizeText(document.getElementById('evolution')?.value || '');
    const mealPlan = normalizeText(document.getElementById('mealPlan')?.value || '');
    const patients = getPatients();
    const patient = patients.find((item) => item.id === patientId);

    if (!patient) {
      showFlash('Selecciona un paciente registrado.', 'error');
      return;
    }

    if (!consultDateValue || !consultTimeValue || !evolution || !mealPlan) {
      showFlash('Selecciona un paciente y completa la evolución y el plan.', 'error');
      return;
    }

    const consultations = getConsultations();
    consultations.push({
      id: createId(),
      patientId,
      patientName: patient.fullName,
      consultDate: consultDateValue,
      consultTime: consultTimeValue,
      evolution,
      mealPlan,
      bmi: patient.bmi,
      diagnosis: patient.diagnosis,
      createdAt: new Date().toISOString(),
    });

    setConsultations(consultations);
    consultationForm.reset();
    if (consultDate) {
      consultDate.value = new Date().toISOString().slice(0, 10);
    }
    if (consultTime) {
      consultTime.value = new Date().toTimeString().slice(0, 5);
    }
    showFlash('Consulta guardada correctamente.', 'success');
    renderAll();
  });
}

window.addEventListener('storage', renderAll);
document.addEventListener('DOMContentLoaded', () => {
  setupLogin();
  setupBmiPreview();
  setupPatientForm();
  setupConsultationForm();
  renderAll();
});
