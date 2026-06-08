/**
 * Módulo UI: Historia
 * Gestiona contenido específico de la página de historia
 * Incluye imágenes de discapacidad y elementos interactivos
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
  limit 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/**
 * Inicializar el módulo de historia
 */
export async function init() {
  console.log('📜 Inicializando módulo de historia...');
  
  // Cargar imágenes adicionales para la sección de historia si existen
  await loadHistoryImages();
  
  // Configurar interactividad de la línea de tiempo
  setupTimeline();
  
  // Configurar lazy loading para imágenes
  setupImageLazyLoading();
  
  console.log('✅ Módulo de historia inicializado');
}

/**
 * Cargar imágenes relacionadas con historia desde Firebase
 */
async function loadHistoryImages() {
  try {
    const q = query(
      collection(db, 'galeria'),
      orderBy('createdAt', 'desc'),
      limit(6)
    );
    
    const snapshot = await getDocs(q);
    const images = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Insertar imágenes en sección de galería histórica si existe el contenedor
    const galleryContainer = document.querySelector('[data-history-gallery]');
    if (galleryContainer && images.length > 0) {
      renderHistoryGallery(images);
    }
  } catch (error) {
    console.warn('⚠️ No se pudieron cargar imágenes de historia:', error.message);
  }
}

/**
 * Renderizar galería de imágenes históricas
 */
function renderHistoryGallery(images) {
  const container = document.querySelector('[data-history-gallery]');
  if (!container) return;
  
  container.innerHTML = images.map(img => `
    <figure class="history-image-card">
      <img 
        src="${img.image}" 
        alt="${img.alt || img.title}" 
        loading="lazy"
        style="width: 100%; height: 200px; object-fit: cover; border-radius: var(--border-radius-lg);"
      >
      <figcaption style="padding: var(--space-2); font-size: var(--font-size-sm); color: var(--color-text-secondary);">
        ${img.title || 'Imagen histórica'}
      </figcaption>
    </figure>
  `).join('');
}

/**
 * Configurar interactividad de la línea de tiempo
 */
function setupTimeline() {
  const timelineItems = document.querySelectorAll('.history-timeline-item');
  
  timelineItems.forEach((item, index) => {
    // Añadir animación de entrada escalonada
    item.style.opacity = '0';
    item.style.transform = 'translateY(20px)';
    item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    
    // Observador de intersección para animar al hacer scroll
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }, index * 100);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    
    observer.observe(item);
  });
}

/**
 * Configurar lazy loading para imágenes
 */
function setupImageLazyLoading() {
  const images = document.querySelectorAll('.history-hero-media img, [data-history-gallery] img');
  
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          observer.unobserve(img);
        }
      });
    });
    
    images.forEach(img => {
      if (img.dataset.src) {
        imageObserver.observe(img);
      }
    });
  }
}

/**
 * Función para actualizar contenido editable desde admin
 * (Se llama desde admin.js cuando se guardan cambios)
 */
export function updateHistoryContent(data) {
  // Actualizar título del hero si existe
  if (data.heroTitle) {
    const titleEl = document.querySelector('#historia-title');
    if (titleEl) titleEl.textContent = data.heroTitle;
  }
  
  // Actualizar subtítulo si existe
  if (data.heroSubtitle) {
    const subtitleEl = document.querySelector('.history-hero-copy > p');
    if (subtitleEl) subtitleEl.textContent = data.heroSubtitle;
  }
  
  console.log('📝 Contenido de historia actualizado');
}

// Exportar funciones públicas
export const historyModule = {
  init,
  updateHistoryContent,
  loadHistoryImages
};

// Inicializar automáticamente si estamos en la página de historia
if (document.body.classList.contains('page-historia') || document.querySelector('#historia-title')) {
  document.addEventListener('DOMContentLoaded', init);
}
