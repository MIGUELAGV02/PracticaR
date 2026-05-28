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

function renderHistory(items) {
  const container = document.getElementById('historyContainer');
  if (!container) {
    return;
  }

  if (!items.length) {
    container.innerHTML = '<p class="empty-state">Aún no hay consultas registradas.</p>';
    return;
  }

  container.innerHTML = items
    .map(
      (item) => `
        <article class="history-item">
          <div class="history-head">
            <strong>${item.patient_name}</strong>
            <span>${item.consult_date} ${item.consult_time}</span>
          </div>
          <p><span class="label">IMC:</span> ${item.bmi} - ${item.diagnosis}</p>
          <p><span class="label">Evolución:</span> ${item.evolution}</p>
          <p><span class="label">Plan:</span> ${item.meal_plan}</p>
        </article>
      `,
    )
    .join('');
}

async function refreshHistory() {
  const status = document.getElementById('historyStatus');
  try {
    const response = await fetch('/api/history', { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      throw new Error('No se pudo cargar el historial.');
    }
    const payload = await response.json();
    renderHistory(payload.history || []);
    if (status) {
      status.textContent = `Actualizado ${payload.updated_at}`;
    }
  } catch (error) {
    if (status) {
      status.textContent = 'Historial temporalmente no disponible';
    }
  }
}

function setupBmiPreview() {
  const ageInput = document.getElementById('age');
  const heightInput = document.getElementById('height_cm');
  const weightInput = document.getElementById('weight_kg');
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
  if (ageInput) {
    ageInput.addEventListener('input', updatePreview);
  }
  updatePreview();
}

document.addEventListener('DOMContentLoaded', () => {
  setupBmiPreview();
  refreshHistory();
  setInterval(refreshHistory, 3000);
});
