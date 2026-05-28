/**
 * bmi.js - Cálculos de IMC y diagnóstico
 */

export function calculateBmi(weightKg, heightCm) {
  const heightM = heightCm / 100;
  if (!heightM || heightM <= 0) {
    return null;
  }
  return +(weightKg / (heightM * heightM)).toFixed(2);
}

export function diagnoseBmi(bmi) {
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
