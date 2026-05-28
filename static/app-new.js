/**
 * app.js - Punto de entrada modular de la aplicación Nutri GC
 */

import { renderAll } from './modules/ui.js';
import { setupAllForms } from './modules/forms.js';

window.addEventListener('storage', renderAll);

document.addEventListener('DOMContentLoaded', () => {
  setupAllForms();
  renderAll();
});
