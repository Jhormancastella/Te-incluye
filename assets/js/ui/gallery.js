/**
 * UI/Gallery.js - Gestión de Galería de Imágenes
 * Lightbox accesible, filtros y carga dinámica desde Firestore
 */
import { firestore } from "../db.js";
import { escapeHtml } from "../app.js";

/**
 * Estado de la galería
 */
const GalleryState = {
  items: [],
  filteredItems: [],
  currentFilter: 'all',
  currentPage: 1,
  itemsPerPage: 12,
  lightboxOpen: false
};

/**
 * Inicializar galería
 */
export function initGallery() {
  const galleryContainer = document.querySelector('[data-gallery]');
  if (!galleryContainer) return;
  
  // Configurar filtros
  setupFilters();
  
  // Configurar lightbox
  setupLightbox();
  
  // Cargar items iniciales
  loadGalleryItems();
  
  console.log('🖼️ Galería inicializada');
}

/**
 * Cargar items desde Firestore
 */
export async function loadGalleryItems(filter = 'all') {
  try {
    GalleryState.currentFilter = filter;
    
    // Obtener items de Firestore
    const items = await firestore.getAll(firestore.collections.GALLERY);
    
    // Filtrar por categoría si es necesario
    GalleryState.items = filter === 'all' 
      ? items 
      : items.filter(item => item.category === filter);
    
    GalleryState.filteredItems = [...GalleryState.items];
    GalleryState.currentPage = 1;
    
    // Renderizar
    renderGallery();
    
  } catch (error) {
    console.error('Error cargando galería:', error);
    showGalleryError('No se pudieron cargar las imágenes');
  }
}

/**
 * Configurar filtros de categoría
 */
function setupFilters() {
  const filterButtons = document.querySelectorAll('[data-gallery-filter]');
  
  filterButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      
      // Actualizar estado visual
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Cargar items filtrados
      const filter = button.dataset.galleryFilter;
      await loadGalleryItems(filter);
    });
  });
}

/**
 * Renderizar galería en el DOM
 */
function renderGallery() {
  const container = document.querySelector('[data-gallery]');
  if (!container) return;
  
  const items = GalleryState.filteredItems;
  
  if (!items.length) {
    container.innerHTML = `
      <div class="empty-state" role="status">
        <p>No hay imágenes en esta categoría</p>
      </div>
    `;
    return;
  }
  
  // Paginación simple
  const startIndex = (GalleryState.currentPage - 1) * GalleryState.itemsPerPage;
  const paginatedItems = items.slice(startIndex, startIndex + GalleryState.itemsPerPage);
  
  container.innerHTML = 
    paginatedItems.map((item, index) => createGalleryItem(item, startIndex + index)).join('') +
    (items.length > GalleryState.itemsPerPage ? renderPagination(items.length) : '');
  
  // Configurar eventos de los items
  container.querySelectorAll('[data-lightbox-trigger]').forEach(trigger => {
    trigger.addEventListener('click', (e) => openLightbox(e.currentTarget.dataset.id));
  });
}

/**
 * Crear HTML para un item de galería
 */
function createGalleryItem(item, index) {
  return `
    <figure class="gallery-item animate-fade-in" style="animation-delay: ${index * 50}ms">
      <button 
        type="button"
        class="gallery-item-trigger"
        data-lightbox-trigger
        data-id="${item.id}"
        aria-label="Ver imagen: ${escapeHtml(item.title || 'Sin título')}"
      >
        <img 
          src="${item.image || '/assets/images/placeholder.jpg'}" 
          alt="${escapeHtml(item.alt || item.title || 'Imagen de galería')}"
          loading="lazy"
          width="400"
          height="300"
        >
        <div class="gallery-item-overlay">
          <span class="gallery-item-title">${escapeHtml(item.title || 'Ver imagen')}</span>
        </div>
      </button>
      ${item.description ? `
        <figcaption class="sr-only">${escapeHtml(item.description)}</figcaption>
      ` : ''}
    </figure>
  `;
}

/**
 * Renderizar controles de paginación
 */
function renderPagination(totalItems) {
  const totalPages = Math.ceil(totalItems / GalleryState.itemsPerPage);
  
  return `
    <nav class="pagination" role="navigation" aria-label="Paginación de galería">
      <button 
        class="btn btn-outline btn-sm" 
        id="gallery-prev"
        ${GalleryState.currentPage === 1 ? 'disabled' : ''}
        aria-label="Página anterior"
      >
        ← Anterior
      </button>
      <span class="pagination-info" aria-live="polite">
        Página ${GalleryState.currentPage} de ${totalPages}
      </span>
      <button 
        class="btn btn-outline btn-sm" 
        id="gallery-next"
        ${GalleryState.currentPage === totalPages ? 'disabled' : ''}
        aria-label="Página siguiente"
      >
        Siguiente →
      </button>
    </nav>
  `;
}

/**
 * Configurar lightbox accesible
 */
function setupLightbox() {
  if (!document.getElementById('lightbox')) {
    const lightbox = document.createElement('div');
    lightbox.id = 'lightbox';
    lightbox.className = 'lightbox hidden';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-hidden', 'true');
    lightbox.innerHTML = `
      <div class="lightbox-content">
        <button class="lightbox-close" aria-label="Cerrar">&times;</button>
        <div class="lightbox-media">
          <img class="lightbox-image" src="" alt="">
        </div>
        <div class="lightbox-info">
          <div class="lightbox-info-header">
            <h3 class="lightbox-title"></h3>
            <span class="lightbox-badge"></span>
          </div>
          <p class="lightbox-description"></p>
          <div class="lightbox-nav-row">
            <button class="lb-nav-btn lb-prev" aria-label="Imagen anterior">
              <i class="fas fa-chevron-left"></i> Anterior
            </button>
            <span class="lightbox-counter"></span>
            <button class="lb-nav-btn lb-next" aria-label="Imagen siguiente">
              Siguiente <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(lightbox);

    // Inyectar estilos
    if (!document.getElementById('lightbox-styles')) {
      const s = document.createElement('style');
      s.id = 'lightbox-styles';
      s.textContent = `
        .lightbox {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9000;
          padding: 16px;
          animation: lbFadeIn .2s ease;
        }
        @keyframes lbFadeIn { from { opacity:0 } to { opacity:1 } }
        .lightbox.hidden { display: none !important; }

        .lightbox-content {
          background: var(--color-bg-primary);
          border-radius: 14px;
          overflow: hidden;
          width: 100%;
          max-width: 780px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 24px 60px rgba(0,0,0,.5);
          animation: lbSlideUp .25s ease;
        }
        @keyframes lbSlideUp { from { transform:translateY(16px);opacity:0 } to { transform:translateY(0);opacity:1 } }

        .lightbox-close {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 36px;
          height: 36px;
          background: rgba(255,255,255,.15);
          border: none;
          border-radius: 50%;
          color: #fff;
          font-size: 1.3rem;
          line-height: 1;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background .15s;
          z-index: 10;
        }
        .lightbox-close:hover { background: rgba(255,255,255,.3); }

        .lightbox-media {
          width: 100%;
          background: #0a0a0a;
          display: flex;
          align-items: center;
          justify-content: center;
          max-height: 55vh;
          overflow: hidden;
          flex-shrink: 0;
        }
        .lightbox-image {
          display: block;
          max-width: 100%;
          max-height: 55vh;
          object-fit: contain;
        }

        .lightbox-info {
          padding: 18px 20px 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          background: var(--color-bg-primary);
        }
        .lightbox-info-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
        }
        .lightbox-title {
          font-size: 1rem;
          font-weight: 700;
          color: var(--color-text-primary);
          margin: 0;
          line-height: 1.3;
        }
        .lightbox-badge {
          flex-shrink: 0;
          background: var(--color-primary-light, #dbeafe);
          color: var(--color-primary, #3b82f6);
          font-size: .7rem;
          font-weight: 700;
          padding: 3px 9px;
          border-radius: 20px;
          text-transform: capitalize;
          white-space: nowrap;
        }
        .lightbox-description {
          font-size: .83rem;
          color: var(--color-text-secondary, #6b7280);
          margin: 0;
          line-height: 1.55;
        }
        .lightbox-nav-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 8px;
          border-top: 1px solid var(--color-border);
          margin-top: 4px;
        }
        .lb-nav-btn {
          background: none;
          border: 1px solid var(--color-border);
          border-radius: 8px;
          padding: 6px 12px;
          font-size: .78rem;
          font-weight: 600;
          color: var(--color-text-primary);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: background .15s, border-color .15s;
          position: static !important;
          transform: none !important;
        }
        .lb-nav-btn:hover:not(:disabled) {
          background: var(--color-bg-secondary);
          border-color: var(--color-primary, #3b82f6);
          color: var(--color-primary, #3b82f6);
        }
        .lb-nav-btn:disabled { opacity: .35; cursor: default; }
        .lightbox-counter {
          font-size: .78rem;
          color: var(--color-text-muted, #9ca3af);
          font-weight: 500;
        }
      `;
      document.head.appendChild(s);
    }
  }

  const lightbox  = document.getElementById('lightbox');
  const closeBtn  = lightbox.querySelector('.lightbox-close');
  const prevBtn   = lightbox.querySelector('.lb-prev');
  const nextBtn   = lightbox.querySelector('.lb-next');

  const closeLightbox = () => {
    lightbox.setAttribute('aria-hidden', 'true');
    lightbox.classList.add('hidden');
    GalleryState.lightboxOpen = false;
    document.body.style.overflow = '';
  };

  closeBtn?.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });

  document.addEventListener('keydown', (e) => {
    if (!GalleryState.lightboxOpen) return;
    if (e.key === 'Escape')     { e.preventDefault(); closeLightbox(); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); navigateLightbox(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); navigateLightbox(1); }
  });

  prevBtn?.addEventListener('click', () => navigateLightbox(-1));
  nextBtn?.addEventListener('click', () => navigateLightbox(1));
}

/**
 * Abrir lightbox con un item específico
 */
export function openLightbox(itemId) {
  const item = GalleryState.items.find(i => i.id === itemId);
  if (!item) return;

  const lightbox   = document.getElementById('lightbox');
  const img        = lightbox.querySelector('.lightbox-image');
  const title      = lightbox.querySelector('.lightbox-title');
  const badge      = lightbox.querySelector('.lightbox-badge');
  const desc       = lightbox.querySelector('.lightbox-description');
  const counter    = lightbox.querySelector('.lightbox-counter');
  const prevBtn    = lightbox.querySelector('.lb-prev');
  const nextBtn    = lightbox.querySelector('.lb-next');

  const idx   = GalleryState.items.findIndex(i => i.id === itemId);
  const total = GalleryState.items.length;

  GalleryState.currentLightboxIndex = idx;

  // Poblar contenido
  img.src = item.image || '../assets/images/placeholder.jpg';
  img.alt = item.alt || item.title || 'Imagen';
  title.textContent = item.title || 'Sin título';
  badge.textContent = item.category || '';
  badge.style.display = item.category ? '' : 'none';
  desc.textContent = item.description || '';
  desc.style.display = item.description ? '' : 'none';
  counter.textContent = `${idx + 1} / ${total}`;

  // Habilitar / deshabilitar navegación
  prevBtn.disabled = idx === 0;
  nextBtn.disabled = idx === total - 1;

  // Mostrar
  lightbox.classList.remove('hidden');
  lightbox.setAttribute('aria-hidden', 'false');
  GalleryState.lightboxOpen = true;
  document.body.style.overflow = 'hidden';
  lightbox.querySelector('.lightbox-close')?.focus();
}

/**
 * Navegar en el lightbox
 */
function navigateLightbox(direction) {
  const newIndex = GalleryState.currentLightboxIndex + direction;
  
  if (newIndex >= 0 && newIndex < GalleryState.items.length) {
    GalleryState.currentLightboxIndex = newIndex;
    openLightbox(GalleryState.items[newIndex].id);
  }
}

/**
 * Mostrar mensaje de error en la galería
 */
function showGalleryError(message) {
  const container = document.querySelector('[data-gallery]');
  if (container) {
    container.innerHTML = `
      <div class="alert alert-error" role="alert">
        <p>${escapeHtml(message)}</p>
        <button class="btn btn-outline btn-sm" onclick="location.reload()">Reintentar</button>
      </div>
    `;
  }
}

/**
 * Actualizar galería después de cambios en admin
 */
export function refreshGallery() {
  loadGalleryItems(GalleryState.currentFilter);
}

// Exportar funciones para uso externo
export const GalleryAPI = {
  load: loadGalleryItems,
  refresh: refreshGallery,
  openLightbox
};
