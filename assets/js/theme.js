/**
 * Theme.js - Gestión de Tema Claro/Oscuro
 * Persistencia, detección de preferencia del sistema y toggle accesible
 */

/**
 * Estado del tema
 */
const ThemeState = {
  current: 'light',
  system: 'light',
  userPreference: null,
  _initialized: false
};

/**
 * Inicializar sistema de temas
 */
export function initTheme() {
  if (ThemeState._initialized) return;
  ThemeState._initialized = true;
  // Detectar preferencia del sistema
  detectSystemPreference();
  
  // Cargar preferencia del usuario (si existe)
  loadUserPreference();
  
  // Aplicar tema
  applyTheme(ThemeState.current);
  
  // Configurar listener para cambios del sistema
  setupSystemListener();
  
  // Configurar toggle button
  setupThemeToggle();
  
  console.log('🎨 Tema inicializado:', ThemeState.current);
}

/**
 * Detectar preferencia del sistema operativo
 */
function detectSystemPreference() {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    ThemeState.system = 'dark';
  } else {
    ThemeState.system = 'light';
  }
}

/**
 * Cargar preferencia guardada del usuario
 */
function loadUserPreference() {
  try {
    const saved = localStorage.getItem('incluyeme-theme');
    if (saved === 'dark' || saved === 'light') {
      ThemeState.userPreference = saved;
      ThemeState.current = saved;
    }
  } catch (error) {
    console.warn('No se pudo cargar preferencia de tema:', error);
  }
}

/**
 * Aplicar tema al documento
 */
function applyTheme(theme) {
  const body = document.body;

  if (theme === 'dark') {
    body.classList.add('dark');
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.setAttribute('color-scheme', 'dark');
  } else {
    body.classList.remove('dark');
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.setAttribute('color-scheme', 'light');
  }

  // Actualizar estado visual del toggle
  updateToggleState(theme);

  // Dispatch evento personalizado
  document.dispatchEvent(new CustomEvent('theme:changed', {
    detail: { theme, isDark: theme === 'dark' }
  }));
}

/**
 * Cambiar tema (toggle o específico)
 */
export function toggleTheme(newTheme = null) {
  const target = newTheme || (ThemeState.current === 'dark' ? 'light' : 'dark');
  
  // Guardar preferencia del usuario
  try {
    localStorage.setItem('incluyeme-theme', target);
    ThemeState.userPreference = target;
  } catch (error) {
    console.warn('No se pudo guardar preferencia de tema:', error);
  }
  
  // Aplicar cambio
  ThemeState.current = target;
  applyTheme(target);
  
  // Feedback accesible
  announceThemeChange(target);
}

/**
 * Resetear a preferencia del sistema
 */
export function resetThemeToSystem() {
  try {
    localStorage.removeItem('incluyeme-theme');
  } catch (error) {
    console.warn('No se pudo remover preferencia:', error);
  }
  
  ThemeState.userPreference = null;
  ThemeState.current = ThemeState.system;
  applyTheme(ThemeState.current);
  
  announceThemeChange(`Sistema (${ThemeState.system})`);
}

/**
 * Configurar listener para cambios en preferencia del sistema
 */
function setupSystemListener() {
  if (!window.matchMedia) return;
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  // Handler para cambios
  const handleChange = (e) => {
    ThemeState.system = e.matches ? 'dark' : 'light';
    
    // Solo aplicar si el usuario NO tiene preferencia guardada
    if (!ThemeState.userPreference) {
      ThemeState.current = ThemeState.system;
      applyTheme(ThemeState.current);
    }
  };
  
  // Suscribirse (API moderna o fallback)
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleChange);
  } else if (mediaQuery.addListener) {
    // Fallback para navegadores antiguos
    mediaQuery.addListener(handleChange);
  }
}

/**
 * Configurar botón de toggle de tema
 */
function setupThemeToggle() {
  const toggle = document.querySelector('[data-theme-toggle]');
  if (!toggle) return;
  
  toggle.addEventListener('click', (e) => {
    e.preventDefault();
    toggleTheme();
  });
  
  // Soporte para teclado
  toggle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleTheme();
    }
  });
  
  // Actualizar label para accesibilidad
  updateToggleAria(toggle, ThemeState.current);
}

/**
 * Actualizar estado visual del toggle
 */
function updateToggleState(theme) {
  const toggles = document.querySelectorAll('[data-theme-toggle]');
  
  toggles.forEach(toggle => {
    const icon = toggle.querySelector('.toggle-icon');
    toggle.setAttribute('aria-pressed', theme === 'dark');
    toggle.setAttribute('title', theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    if (icon) icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    updateToggleAria(toggle, theme);
  });

  // Sincronizar icono del menú móvil si existe
  const mobileIcon = document.querySelector('.toggle-icon-mobile');
  if (mobileIcon) mobileIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

/**
 * Actualizar atributos ARIA para accesibilidad
 */
function updateToggleAria(toggle, theme) {
  const label = theme === 'dark' 
    ? 'Modo oscuro activado. Clic para cambiar a modo claro' 
    : 'Modo claro activado. Clic para cambiar a modo oscuro';
  
  toggle.setAttribute('aria-label', label);
}

/**
 * Anunciar cambio de tema para lectores de pantalla
 */
function announceThemeChange(theme) {
  // Crear región live si no existe
  let announcer = document.getElementById('theme-announcer');
  
  if (!announcer) {
    announcer = document.createElement('div');
    announcer.id = 'theme-announcer';
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    document.body.appendChild(announcer);
  }
  
  const message = theme === 'dark' 
    ? 'Modo oscuro activado' 
    : theme === 'light'
      ? 'Modo claro activado'
      : `Tema cambiado a ${theme}`;
  
  announcer.textContent = message;
  
  // Limpiar después de anunciar
  setTimeout(() => {
    announcer.textContent = '';
  }, 1000);
}

/**
 * Obtener tema actual
 */
export function getCurrentTheme() {
  return ThemeState.current;
}

/**
 * Verificar si es modo oscuro
 */
export function isDarkMode() {
  return ThemeState.current === 'dark';
}

// Exportar para uso externo
export const ThemeAPI = {
  toggle: toggleTheme,
  reset: resetThemeToSystem,
  getCurrent: getCurrentTheme,
  isDark: isDarkMode
};

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTheme);
} else {
  initTheme();
}
