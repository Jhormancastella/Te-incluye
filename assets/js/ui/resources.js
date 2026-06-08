/**
 * Módulo UI: Recursos
 * Gestiona la carga y visualización de recursos desde Firebase
 * 
 * Nota: Usamos CDN ESM para compatibilidad con módulos nativos del navegador
 */

// Imports desde CDN de Firebase (ESM compatible)
import { db } from '../firebase-config.js';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  where 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Estado del módulo
const state = {
  resources: [],
  filteredResources: [],
  currentCategory: 'all',
  searchQuery: ''
};

/**
 * Inicializar el módulo de recursos
 */
export async function init() {
  console.log('📚 Inicializando módulo de recursos...');
  
  await loadResources();
  setupEventListeners();
  renderResources();
}

/**
 * Cargar recursos desde Firebase
 */
async function loadResources() {
  try {
    const q = query(
      collection(db, 'recursos'),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    state.resources = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    state.filteredResources = [...state.resources];
    console.log(`✅ ${state.resources.length} recursos cargados`);
  } catch (error) {
    console.error('❌ Error cargando recursos:', error);
    showEmptyState();
  }
}

/**
 * Configurar listeners de eventos
 */
function setupEventListeners() {
  // Filtros por categoría
  document.querySelectorAll('[data-resource-category]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const category = btn.dataset.resourceCategory;
      filterByCategory(category);
      
      // Actualizar estado visual de botones
      document.querySelectorAll('[data-resource-category]').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
    });
  });
  
  // Búsqueda
  const searchInput = document.querySelector('[data-resource-search]');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.toLowerCase();
      applyFilters();
      
      // Mostrar/ocultar botón de limpiar
      const clearBtn = searchInput.closest('.search-form')?.querySelector('.search-clear');
      if (clearBtn) {
        clearBtn.hidden = !state.searchQuery;
      }
    });
  }
  
  // Botón de limpiar búsqueda
  const clearBtn = document.querySelector('.search-clear');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      const searchInput = document.querySelector('[data-resource-search]');
      if (searchInput) {
        searchInput.value = '';
        state.searchQuery = '';
        applyFilters();
        clearBtn.hidden = true;
        searchInput.focus();
      }
    });
  }
}

/**
 * Filtrar por categoría
 */
function filterByCategory(category) {
  state.currentCategory = category;
  applyFilters();
}

/**
 * Aplicar filtros combinados (categoría + búsqueda)
 */
function applyFilters() {
  state.filteredResources = state.resources.filter(resource => {
    // Filtro por categoría
    if (state.currentCategory !== 'all' && resource.category !== state.currentCategory) {
      return false;
    }
    
    // Filtro por búsqueda
    if (state.searchQuery) {
      const searchText = `${resource.title} ${resource.description} ${resource.category}`.toLowerCase();
      if (!searchText.includes(state.searchQuery)) {
        return false;
      }
    }
    
    return true;
  });
  
  renderResources();
}

/**
 * Renderizar lista de recursos
 */
function renderResources() {
  const container = document.querySelector('[data-resources]');
  if (!container) return;
  
  if (state.filteredResources.length === 0) {
    container.innerHTML = `
      <div class="card" style="text-align: center; padding: var(--space-6);">
        <i class="fas fa-search" style="font-size: 2rem; color: var(--color-text-muted); margin-block-end: var(--space-3);" aria-hidden="true"></i>
        <p style="color: var(--color-text-secondary);">
          ${state.searchQuery ? 'No se encontraron recursos con esa búsqueda.' : 'Aún no hay recursos en esta categoría.'}
        </p>
        ${state.searchQuery ? `<button class="btn btn-outline btn-sm" style="margin-block-start: var(--space-3);" onclick="document.querySelector('[data-resource-search]').value=''; document.querySelector('[data-resource-search]').dispatchEvent(new Event('input'));">Limpiar búsqueda</button>` : ''}
      </div>
    `;
    return;
  }
  
  container.innerHTML = state.filteredResources.map(resource => `
    <article class="card resource-card" data-resource-id="${resource.id}">
      <div style="display: flex; gap: var(--space-4); align-items: flex-start;">
        <div style="width: 48px; height: 48px; border-radius: var(--border-radius-lg); background: var(--color-primary-light); display: flex; align-items: center; justify-content: center; color: var(--color-primary); font-size: 1.25rem; flex-shrink: 0;">
          <i class="${resource.icon || 'fas fa-file'}" aria-hidden="true"></i>
        </div>
        <div style="flex: 1; min-width: 0;">
          <div style="display: flex; align-items: center; gap: var(--space-2); margin-block-end: var(--space-1);">
            <h3 style="margin: 0; font-size: var(--font-size-lg);">
              <a href="${resource.link || '#'}" target="_blank" rel="noopener" style="color: inherit; text-decoration: none;">
                ${escapeHtml(resource.title)}
              </a>
            </h3>
            ${resource.featured ? `<span class="badge badge-primary" style="font-size: var(--font-size-xs);">Destacado</span>` : ''}
          </div>
          <p style="margin: var(--space-2) 0; color: var(--color-text-secondary); font-size: var(--font-size-sm);">
            ${escapeHtml(resource.description)}
          </p>
          <div style="display: flex; align-items: center; gap: var(--space-3); margin-block-start: var(--space-2);">
            <span class="badge badge-outline" style="font-size: var(--font-size-xs);">
              <i class="fas fa-tag" aria-hidden="true"></i>
              ${getCategoryLabel(resource.category)}
            </span>
            ${resource.link ? `
              <a href="${resource.link}" target="_blank" rel="noopener" class="btn btn-ghost btn-sm" style="padding: var(--space-1) var(--space-2);">
                <i class="fas fa-external-link-alt" aria-hidden="true"></i>
                Ver recurso
              </a>
            ` : ''}
          </div>
        </div>
      </div>
    </article>
  `).join('');
}

/**
 * Mostrar estado vacío
 */
function showEmptyState() {
  const container = document.querySelector('[data-resources]');
  if (container) {
    container.innerHTML = `
      <div class="card" style="text-align: center; padding: var(--space-6);">
        <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--color-primary); margin-block-end: var(--space-3);" aria-hidden="true"></i>
        <p style="color: var(--color-text-secondary);">Cargando recursos...</p>
      </div>
    `;
  }
}

/**
 * Obtener etiqueta legible para categoría
 */
function getCategoryLabel(category) {
  const labels = {
    derechos: 'Derechos',
    salud: 'Salud',
    educacion: 'Educación',
    empleo: 'Empleo',
    tecnologia: 'Tecnología',
    comunidad: 'Comunidad'
  };
  return labels[category] || category;
}

/**
 * Escapar HTML para prevenir XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Exportar funciones públicas
export const resourcesModule = {
  init,
  loadResources,
  filterByCategory,
  applyFilters,
  renderResources,
  get state() { return { ...state }; }
};

// Inicializar automáticamente si estamos en la página de recursos
if (document.querySelector('[data-resources]')) {
  document.addEventListener('DOMContentLoaded', init);
}
