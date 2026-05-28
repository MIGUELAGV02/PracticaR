/**
 * patients.js - Gestión de pacientes sin duplicación
 */

import { loadPatients, savePatients } from './storage.js';
import { calculateBmi, diagnoseBmi } from './bmi.js';
import { normalizeText, createId, showFlash } from './utils.js';

export function getAllPatients() {
  return loadPatients([]);
}

export function getPatientById(patientId) {
  const patients = getAllPatients();
  return patients.find((p) => p.id === patientId) || null;
}

export function createOrUpdatePatient(fullName, age, heightCm, weightKg) {
  fullName = normalizeText(fullName);
  age = Number.parseInt(age, 10);
  heightCm = Number.parseFloat(heightCm);
  weightKg = Number.parseFloat(weightKg);

  if (!fullName || !age || !heightCm || !weightKg) {
    showFlash('Completa todos los campos del preregistro.', 'error');
    return null;
  }

  if (age <= 0 || heightCm <= 0 || weightKg <= 0) {
    showFlash('Los valores deben ser mayores a cero.', 'error');
    return null;
  }

  const bmi = calculateBmi(weightKg, heightCm);
  const diagnosis = diagnoseBmi(bmi);
  const patients = getAllPatients();
  const timestamp = new Date().toISOString();

  const existingIndex = patients.findIndex(
    (p) => p.fullName.toLowerCase() === fullName.toLowerCase(),
  );

  let patient;
  if (existingIndex >= 0) {
    patient = patients[existingIndex];
    patient.age = age;
    patient.heightCm = heightCm;
    patient.weightKg = weightKg;
    patient.bmi = bmi;
    patient.diagnosis = diagnosis;
    patient.updatedAt = timestamp;
    patients[existingIndex] = patient;
    showFlash(`Paciente actualizado: ${fullName}.`, 'success');
  } else {
    patient = {
      id: createId(),
      fullName,
      age,
      heightCm,
      weightKg,
      bmi,
      diagnosis,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    patients.push(patient);
    showFlash(`Paciente guardado: ${fullName}.`, 'success');
  }

  savePatients(patients);
  return patient;
}
