/**
 * registry.js - Registro de participantes en la comunidad Te-incluye
 * Guarda en Firestore (colección 'registry')
 */

import { firestore } from './db.js';
import { isValidEmail, escapeHtml, showToast } from './utils.js';

export const Registry = {
  initialized: false,

  init() {
    if (this.initialized) return this;
    this.bindForm();
    this.initialized = true;
    return this;
  },

  bindForm() {
    const form = document.getElementById('registry-form');
    if (!form) return;

    // Real-time email validation
    const emailInput = document.getElementById('registry-email');
    if (emailInput) {
      emailInput.addEventListener('blur', e => {
        if (e.target.value && !isValidEmail(e.target.value)) {
          e.target.classList.add('input-error');
        } else {
          e.target.classList.remove('input-error');
        }
      });
      emailInput.addEventListener('input', e => e.target.classList.remove('input-error'));
    }

    form.addEventListener('submit', async e => {
      e.preventDefault();

      const nombre         = document.getElementById('registry-name')?.value.trim();
      const email          = document.getElementById('registry-email')?.value.trim();
      const rol            = document.getElementById('registry-rol')?.value || '';
      const tipoDiscap     = document.getElementById('registry-discapacidad')?.value || '';
      const consent        = form.querySelector('[name="consent"]')?.checked;
      const submitBtn      = form.querySelector('[type="submit"]');

      const setError = (msg) => {
        let feedback = document.getElementById('registry-feedback');
        if (!feedback) {
          feedback = document.createElement('div');
          feedback.id = 'registry-feedback';
          feedback.setAttribute('role', 'alert');
          feedback.setAttribute('aria-live', 'polite');
          submitBtn?.insertAdjacentElement('beforebegin', feedback);
        }
        feedback.textContent = msg;
        feedback.className = 'form-message error';
      };

      if (!nombre || nombre.length < 2) {
        setError('Por favor ingresa tu nombre completo (mínimo 2 caracteres).');
        document.getElementById('registry-name')?.focus();
        return;
      }
      if (!email || !isValidEmail(email)) {
        setError('Por favor ingresa un correo electrónico válido.');
        emailInput?.focus();
        return;
      }
      if (!consent) {
        setError('Debes aceptar la política de privacidad para continuar.');
        form.querySelector('[name="consent"]')?.focus();
        return;
      }

      const feedback = document.getElementById('registry-feedback');
      if (feedback) { feedback.textContent = ''; feedback.className = 'form-message'; }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Guardando...';
      }

      const registro = {
        nombre:           nombre,
        email:            email.toLowerCase(),
        rol:              rol,
        tipo_discapacidad: tipoDiscap,
        consent:          true
      };

      try {
        // Guardar en Firestore (colección 'registry')
        const id = await firestore.add('registry', registro);

        form.innerHTML = `
          <div class="alert alert-success" role="status">
            <span class="alert-icon" aria-hidden="true">✅</span>
            <div class="alert-content">
              <p class="alert-title">¡Registro exitoso!</p>
              <p>Gracias, ${escapeHtml(nombre)}. Te contactaremos al correo ${escapeHtml(email)}.</p>
            </div>
          </div>
        `;

        document.dispatchEvent(new CustomEvent('registry:newUser', { detail: { id, ...registro } }));
      } catch (err) {
        console.error('Error al guardar registro:', err);
        setError('No se pudo guardar el registro. Por favor intenta de nuevo.');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fas fa-paper-plane" aria-hidden="true"></i> Enviar registro';
        }
      }
    });
  },

  // Para el panel admin
  getUsers(filters = {}) {
    return firestore.getAll('registry');
  },

  exportUsersCSV() {
    // Delegado al panel admin via Firestore
    showToast('Usa el panel admin para exportar registros', 'info');
  }
};

// Named export para compatibilidad con app.js
export function initRegistry() {
  return Registry.init();
}

export default Registry;
