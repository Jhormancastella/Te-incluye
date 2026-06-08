/**
 * App.js - Orquestador Principal de Incluyeme
 * Inicializa la aplicación, maneja eventos globales y coordina módulos
 */
import { auth, onAuthStateChanged } from "./firebase-config.js";
import { firestore } from "./db.js";
import { initTheme } from "./theme.js";
import { initNavigation } from "./navigation.js";
import { initGallery } from "./ui/gallery.js";
import { initVideos } from "./ui/videos.js";
import { initRegistry } from "./registry.js";
import { initStats } from "./ui/stats.js";

/**
 * Estado global de la aplicación
 */
export const AppState = {
  user: null,
  isLoading: true,
  collections: firestore.collections,
  config: {
    appName: "Incluyeme",
    version: "2.0.0",
    firebaseEnabled: true
  }
};

/**
 * Inicialización principal de la aplicación
 */
export async function init() {
  try {
    console.log(`🚀 Iniciando ${AppState.config.appName} v${AppState.config.version}`);
    
    // 1. Inicializar módulos base
    initTheme();
    initNavigation();
    
    // 2. Configurar listener de autenticación
    setupAuthListener();
    
    // 3. Cargar datos iniciales (solo si no requiere auth)
    await loadPublicData();
    
    // 4. Inicializar componentes UI
    initGallery();
    initVideos();
    initRegistry();
    initStats();
    
    // 5. Marcar como listo
    AppState.isLoading = false;
    document.documentElement.setAttribute('data-app-ready', 'true');
    
    // Dispatch evento personalizado para otros módulos
    document.dispatchEvent(new CustomEvent('app:ready', { detail: AppState }));
    
    console.log('✅ Aplicación lista');
    
  } catch (error) {
    console.error('❌ Error al inicializar la aplicación:', error);
    AppState.isLoading = false;
    showErrorMessage('No se pudo cargar la aplicación. Por favor recarga la página.');
  }
}

/**
 * Configurar listener de cambios en autenticación
 */
function setupAuthListener() {
  onAuthStateChanged(auth, (user) => {
    AppState.user = user;
    
    if (user) {
      console.log('🔐 Usuario autenticado:', user.email);
      document.documentElement.setAttribute('data-authenticated', 'true');
      // Cargar datos privados si es necesario
      loadPrivateData();
    } else {
      console.log('👤 Usuario no autenticado');
      document.documentElement.removeAttribute('data-authenticated');
    }
    
    document.dispatchEvent(new CustomEvent('auth:changed', { detail: { user } }));
  });
}

/**
 * Cargar datos públicos de Firestore
 */
async function loadPublicData() {
  // Actualizar título del hero desde config (si existe), si no usar texto fijo
  const heroTitle = document.querySelector('[data-hero-title]');
  if (heroTitle) {
    try {
      const { db, doc, getDoc } = await import('./firebase-config.js');
      const heroSnap = await getDoc(doc(db, 'config', 'hero'));
      const defaultSnap = await getDoc(doc(db, 'config', 'default'));
      const heroData = heroSnap.exists()
        ? heroSnap.data()
        : (defaultSnap.data()?.hero || {});
      if (heroData.title) {
        heroTitle.textContent = heroData.title;
        const sub = document.querySelector('[data-hero-subtitle]');
        if (sub && heroData.subtitle) sub.textContent = heroData.subtitle;
      } else {
        heroTitle.textContent = 'Inclusión que transforma vidas';
      }
    } catch {
      heroTitle.textContent = 'Inclusión que transforma vidas';
    }
  }

  try {
    // Cargar estadísticas públicas
    const stats = await firestore.getAll(firestore.collections.STATS, 'order', 'asc');
    if (stats.length) renderStats(stats);

    // Cargar proyectos destacados (featured:true)
    let projects = await firestore.getAll(firestore.collections.PROJECTS, 'createdAt', 'desc');
    const featuredProjects = projects.filter(p => p.featured).slice(0, 3);
    if (featuredProjects.length) renderFeaturedProjects(featuredProjects);

    // Cargar galería destacada (featured:true)
    let gallery = await firestore.getAll(firestore.collections.GALLERY, 'createdAt', 'desc');
    const featuredGallery = gallery.filter(g => g.featured).slice(0, 6);
    if (featuredGallery.length) renderFeaturedGallery(featuredGallery);

    // Cargar videos destacados (featured:true)
    let videos = await firestore.getAll(firestore.collections.VIDEOS, 'createdAt', 'desc');
    const featuredVideos = videos.filter(v => v.featured).slice(0, 3);
    if (featuredVideos.length) renderFeaturedVideos(featuredVideos);

    // Actualizar contadores del hero card
    await renderHeroCounts();

  } catch (error) {
    console.warn('⚠️ No se pudieron cargar datos públicos:', error.message);
    renderEmptyState();
  }
}

/**
 * Cargar datos privados (requiere autenticación)
 */
async function loadPrivateData() {
  if (!AppState.user) return;
  
  try {
    // Cargar configuración del usuario
    // Implementar según necesidades
  } catch (error) {
    console.error('Error cargando datos privados:', error);
  }
}

/**
 * Renderizar estadísticas en el DOM
 */
function renderStats(stats) {
  const containers = document.querySelectorAll('[data-stats]');
  if (!containers.length) return;
  
  containers.forEach(container => {
    const type = container.dataset.stats;
    const stat = stats.find(s => s.type === type);
    if (stat) {
      container.textContent = stat.value;
      container.setAttribute('aria-label', stat.label);
    }
  });
}

/**
 * Actualizar contadores del hero card con datos reales
 */
async function renderHeroCounts() {
  try {
    const [projects, resources, users] = await Promise.allSettled([
      firestore.getAll(firestore.collections.PROJECTS, 'createdAt', 'desc'),
      firestore.getAll(firestore.collections.RESOURCES, 'createdAt', 'desc'),
      firestore.getAll(firestore.collections.USERS, 'createdAt', 'desc'),
    ]);

    const pCount = document.querySelector('[data-hero-count-projects]');
    const rCount = document.querySelector('[data-hero-count-resources]');
    const mCount = document.querySelector('[data-hero-count-members]');

    const pVal = projects.status === 'fulfilled' ? (projects.value.length || '0') : '0';
    const rVal = resources.status === 'fulfilled' ? (resources.value.length || '0') : '0';
    const mVal = users.status === 'fulfilled' ? (users.value.length || '0') : '0';

    if (pCount) pCount.textContent = pVal;
    if (rCount) rCount.textContent = rVal;
    if (mCount) mCount.textContent = mVal;

    // Mini-stats inline del hero copy (visible en móvil)
    const statsContainer = document.querySelector('[data-stats-container]');
    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="stat-inline">
          <strong>${mVal}</strong>
          <small>Miembros</small>
        </div>
        <div class="stat-inline">
          <strong>${pVal}</strong>
          <small>Proyectos</small>
        </div>
        <div class="stat-inline">
          <strong>${rVal}</strong>
          <small>Recursos</small>
        </div>
      `;
    }
  } catch {
    // Silencioso — los dashes por defecto son aceptables
  }
}

/**
 * Renderizar proyectos destacados
 */
function renderFeaturedProjects(projects) {
  const container = document.querySelector('[data-featured-projects]');
  if (!container) return;
  
  container.innerHTML = projects.map(project => `
    <article class="card animate-fade-in">
      ${project.image ? `
        <div class="card-image">
          <img src="${project.image}" alt="${escapeHtml(project.title)}" loading="lazy">
        </div>
      ` : ''}
      <h3 class="card-title">${escapeHtml(project.title)}</h3>
      <p class="card-description">${escapeHtml(project.description)}</p>
      ${project.link ? `
        <a href="${project.link}" class="btn btn-outline btn-sm" target="_blank" rel="noopener">
          Ver proyecto
        </a>
      ` : ''}
    </article>
  `).join('');
}

/**
 * Renderizar galería destacada
 */
function renderFeaturedGallery(items) {
  const container = document.querySelector('[data-featured-gallery]');
  if (!container) return;

  container.innerHTML = items.map(item => `
    <figure class="gallery-item animate-fade-in">
      <img
        src="${escapeHtml(item.image || '')}"
        alt="${escapeHtml(item.alt || item.title || '')}"
        loading="lazy"
      >
      ${item.title ? `<figcaption class="sr-only">${escapeHtml(item.title)}</figcaption>` : ''}
    </figure>
  `).join('');
}

/**
 * Renderizar videos destacados
 */
function renderFeaturedVideos(videos) {
  const container = document.querySelector('[data-featured-videos]');
  if (!container) return;

  container.innerHTML = videos.map(video => {
    const videoId = extractYouTubeId(video.videoUrl);
    const thumb = video.thumbnail ||
      (video.platform === 'youtube' && videoId
        ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
        : 'assets/images/placeholder.jpg');

    const platformLabel = video.platform
      ? video.platform.charAt(0).toUpperCase() + video.platform.slice(1)
      : 'Video';

    return `
      <article class="featured-video-card">
        <a href="pages/videos.html" class="featured-video-thumb" aria-label="Ver video: ${escapeHtml(video.title || 'Video')}">
          <img src="${escapeHtml(thumb)}" alt="" loading="lazy">
          <span class="featured-video-play" aria-hidden="true">
            <i class="fas fa-play"></i>
          </span>
          <span class="featured-video-badge">${escapeHtml(platformLabel)}</span>
        </a>
        <div class="featured-video-info">
          <h3 class="featured-video-title">${escapeHtml(video.title || 'Sin título')}</h3>
          ${video.description ? `<p class="featured-video-desc">${escapeHtml(video.description)}</p>` : ''}
        </div>
      </article>
    `;
  }).join('');

  // Inyectar estilos si no existen
  if (!document.getElementById('featured-video-styles')) {
    const s = document.createElement('style');
    s.id = 'featured-video-styles';
    s.textContent = `
      .featured-video-card {
        background: var(--color-bg-primary);
        border: 1px solid var(--color-border);
        border-radius: 12px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        transition: transform .2s ease, box-shadow .2s ease;
      }
      .featured-video-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 24px rgba(0,0,0,.12);
      }
      .featured-video-thumb {
        position: relative;
        display: block;
        aspect-ratio: 16/9;
        overflow: hidden;
        background: #111827;
        flex-shrink: 0;
      }
      .featured-video-thumb img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform .35s ease;
      }
      .featured-video-card:hover .featured-video-thumb img {
        transform: scale(1.04);
      }
      .featured-video-play {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0,0,0,.2);
        transition: background .2s ease;
      }
      .featured-video-play i {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255,255,255,.92);
        color: var(--color-primary, #3b82f6);
        border-radius: 50%;
        font-size: 1rem;
        box-shadow: 0 4px 14px rgba(0,0,0,.25);
        transition: transform .2s ease;
      }
      .featured-video-card:hover .featured-video-play {
        background: rgba(0,0,0,.35);
      }
      .featured-video-card:hover .featured-video-play i {
        transform: scale(1.1);
      }
      .featured-video-badge {
        position: absolute;
        top: 8px;
        left: 8px;
        background: rgba(0,0,0,.65);
        color: #fff;
        font-size: .68rem;
        font-weight: 600;
        padding: 3px 8px;
        border-radius: 20px;
        pointer-events: none;
      }
      .featured-video-info {
        padding: 14px 16px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .featured-video-title {
        font-size: .92rem;
        font-weight: 700;
        color: var(--color-text-primary);
        margin: 0;
        line-height: 1.35;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .featured-video-desc {
        font-size: .78rem;
        color: var(--color-text-secondary, #6b7280);
        margin: 0;
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    `;
    document.head.appendChild(s);
  }
}

/**
 * Extraer ID de YouTube de una URL
 */
function extractYouTubeId(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.searchParams.get('v') || u.pathname.slice(1);
  } catch {
    return null;
  }
}

/**
 * Renderizar estado vacío cuando no hay datos
 */
function renderEmptyState() {
  const containers = document.querySelectorAll('[data-stats], [data-featured-projects], [data-featured-gallery], [data-featured-videos]');
  containers.forEach(container => {
    if (!container.querySelector('.empty-state')) {
      container.innerHTML = `
        <div class="empty-state" role="status">
          <p>Cargando contenido...</p>
        </div>
      `;
    }
  });
}

/**
 * Mostrar mensaje de error accesible
 */
function showErrorMessage(message) {
  const alert = document.createElement('div');
  alert.className = 'alert alert-error';
  alert.setAttribute('role', 'alert');
  alert.innerHTML = `
    <span class="alert-icon" aria-hidden="true">⚠️</span>
    <div class="alert-content">
      <p class="alert-title">Error</p>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
  
  // Insertar al inicio del main
  const main = document.querySelector('main');
  if (main) {
    main.insertBefore(alert, main.firstChild);
    
    // Auto-remover después de 10 segundos
    setTimeout(() => {
      alert.style.opacity = '0';
      setTimeout(() => alert.remove(), 300);
    }, 10000);
  }
}

/**
 * Escapar HTML para prevenir XSS
 */
export function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Formatear fecha para mostrar
 */
export function formatDate(date, locale = 'es-CO') {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Debounce para optimizar eventos
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle para optimizar scroll/resize
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Iniciar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
