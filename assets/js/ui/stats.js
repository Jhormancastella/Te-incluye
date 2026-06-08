/**
 * UI/Stats.js - Visualización de Estadísticas
 * Contadores animados, gráficos simples y métricas accesibles
 */
import { firestore } from "../db.js";

/**
 * Estado de estadísticas
 */
const StatsState = {
  data: [],
  animated: false,
  observer: null
};

/**
 * Inicializar visualización de estadísticas
 */
export function initStats() {
  const statsContainer = document.querySelector('[data-stats-container]');
  if (!statsContainer) return;
  
  // Cargar datos
  loadStats();
  
  // Configurar animación al hacer scroll (Intersection Observer)
  setupScrollAnimation(statsContainer);
  
  console.log('📊 Estadísticas inicializadas');
}

/**
 * Cargar estadísticas desde Firestore
 */
export async function loadStats() {
  try {
    // Obtener estadísticas ordenadas por 'order' field
    const items = await firestore.getAll(firestore.collections.STATS, 'order', 'asc');
    
    StatsState.data = items;
    
    // Renderizar
    renderStats();
    
  } catch (error) {
    console.error('Error cargando estadísticas:', error);
    renderFallbackStats();
  }
}

/**
 * Renderizar estadísticas en el DOM
 */
function renderStats() {
  const container = document.querySelector('[data-stats-container]');
  if (!container || !StatsState.data.length) return;
  
  container.innerHTML = `
    <div class="stats-grid">
      ${StatsState.data.map((stat, index) => createStatCard(stat, index)).join('')}
    </div>
  `;
}

/**
 * Crear HTML para una tarjeta de estadística
 */
function createStatCard(stat, index) {
  const { icon, label, value, suffix = '', prefix = '', description } = stat;
  
  return `
    <div class="stat-card animate-fade-in" style="animation-delay: ${index * 100}ms" data-stat-value="${value}">
      ${icon ? `
        <div class="stat-icon" aria-hidden="true">${escapeHtml(icon)}</div>
      ` : ''}
      
      <div class="stat-content">
        <div class="stat-value-wrapper">
          <span class="stat-prefix">${escapeHtml(prefix)}</span>
          <span class="stat-value" data-target="${value}">0</span>
          <span class="stat-suffix">${escapeHtml(suffix)}</span>
        </div>
        <p class="stat-label">${escapeHtml(label)}</p>
        ${description ? `<small class="stat-description">${escapeHtml(description)}</small>` : ''}
      </div>
    </div>
  `;
}

/**
 * Configurar animación de conteo al hacer scroll
 */
function setupScrollAnimation(container) {
  if (!('IntersectionObserver' in window)) {
    // Fallback: animar inmediatamente si no hay soporte
    animateStats();
    return;
  }
  
  StatsState.observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !StatsState.animated) {
        animateStats();
        StatsState.animated = true;
        StatsState.observer?.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.5, // Animar cuando 50% del elemento sea visible
    rootMargin: '0px 0px -100px 0px'
  });
  
  StatsState.observer.observe(container);
}

/**
 * Animar contadores de estadísticas
 */
function animateStats() {
  const statValues = document.querySelectorAll('.stat-value[data-target]');
  
  statValues.forEach(el => {
    const target = parseInt(el.dataset.target, 10);
    const duration = 2000; // 2 segundos
    const start = 0;
    const startTime = performance.now();
    
    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function: easeOutQuad
      const easeProgress = 1 - (1 - progress) * (1 - progress);
      
      const currentValue = Math.floor(start + (target - start) * easeProgress);
      el.textContent = formatNumber(currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        // Asegurar valor final exacto
        el.textContent = formatNumber(target);
      }
    }
    
    requestAnimationFrame(update);
  });
}

/**
 * Formatear números para display (ej: 1000 → 1K)
 */
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

/**
 * Renderizar estadísticas de fallback (si falla la carga)
 */
function renderFallbackStats() {
  const container = document.querySelector('[data-stats-container]');
  if (!container) return;
  
  // Datos por defecto para demo
  const fallbackStats = [
    { icon: '👥', label: 'Personas impactadas', value: 5000, suffix: '+' },
    { icon: '🏙️', label: 'Comunidades alcanzadas', value: 25, suffix: '+' },
    { icon: '📚', label: 'Recursos disponibles', value: 150, suffix: '+' },
    { icon: '🤝', label: 'Alianzas activas', value: 30, suffix: '+' }
  ];
  
  container.innerHTML = `
    <div class="stats-grid">
      ${fallbackStats.map((stat, index) => createStatCard(stat, index)).join('')}
    </div>
    <p class="text-muted text-center" style="margin-top: var(--space-4); font-size: var(--text-xs);">
      * Datos de demostración
    </p>
  `;
  
  // Animar igualmente
  setTimeout(animateStats, 500);
}

/**
 * Actualizar estadísticas después de cambios en admin
 */
export function refreshStats() {
  StatsState.animated = false;
  loadStats();
}

/**
 * Escapar HTML para prevenir XSS
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// CSS adicional para estadísticas (inyectar si no existe)
if (!document.getElementById('stats-styles')) {
  const style = document.createElement('style');
  style.id = 'stats-styles';
  style.textContent = `
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--space-6);
    }
    
    .stat-card {
      display: flex;
      align-items: flex-start;
      gap: var(--space-4);
      padding: var(--space-5);
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);
      transition: transform var(--transition-fast), box-shadow var(--transition-fast);
    }
    
    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
    
    .stat-icon {
      font-size: 2rem;
      line-height: 1;
      flex-shrink: 0;
    }
    
    .stat-content {
      flex: 1;
      min-width: 0;
    }
    
    .stat-value-wrapper {
      display: flex;
      align-items: baseline;
      gap: 2px;
      margin-block-end: var(--space-1);
    }
    
    .stat-prefix,
    .stat-suffix {
      color: var(--text-secondary);
      font-size: var(--text-lg);
      font-weight: var(--font-weight-medium);
    }
    
    .stat-value {
      font-size: var(--text-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--accent-primary);
      line-height: 1;
    }
    
    .stat-label {
      font-weight: var(--font-weight-medium);
      color: var(--text-primary);
      margin-block-end: 2px;
    }
    
    .stat-description {
      color: var(--text-muted);
      font-size: var(--text-xs);
      display: block;
    }
    
    @media (max-width: 480px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .stat-card {
        padding: var(--space-4);
        flex-direction: column;
        align-items: center;
        text-align: center;
      }
      
      .stat-value {
        font-size: var(--text-xl);
      }
    }
  `;
  document.head.appendChild(style);
}

// Exportar funciones para uso externo
export const StatsAPI = {
  load: loadStats,
  refresh: refreshStats,
  formatNumber
};
