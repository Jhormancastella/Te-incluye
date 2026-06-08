/**
 * UI/Videos.js - Gestión de Galería de Videos
 * Embed responsivo de YouTube, Vimeo y Facebook con accesibilidad
 */
import { firestore } from "../db.js";
import { escapeHtml } from "../app.js";

/**
 * Normalizar categoría para comparar (sin tildes, minúsculas)
 * Ej: "Educación" y "educacion" → "educacion"
 */
function normalizeCategory(value) {
  if (!value) return '';
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Estado de videos
 */
const VideoState = {
  items: [],
  currentFilter: 'all',
  players: new Map() // Para gestionar iframes embebidos
};

/**
 * Inicializar galería de videos
 */
export function initVideos() {
  const videosContainer = document.querySelector('[data-videos]');
  if (!videosContainer) return;
  
  // Configurar filtros
  setupVideoFilters();
  
  // Cargar videos
  loadVideos();
  
  console.log('🎬 Galería de videos inicializada');
}

/**
 * Cargar videos desde Firestore
 */
export async function loadVideos(category = 'all') {
   try {
     VideoState.currentFilter = category;
     
     // Obtener videos de Firestore
     let items = await firestore.getAll(firestore.collections.VIDEOS);
     
     // Filtrar por categoría si es necesario
     if (category !== 'all') {
       const filterSlug = normalizeCategory(category);
       items = items.filter(item => normalizeCategory(item.category) === filterSlug);
     }
     
     VideoState.items = items;
     
     // Renderizar
     renderVideos();
     
   } catch (error) {
     console.error('Error cargando videos:', error);
     showVideoError('No se pudieron cargar los videos');
   }
 }

/**
 * Configurar filtros de plataforma
 */
function setupVideoFilters() {
  const filterButtons = document.querySelectorAll('[data-video-filter]');
  
  filterButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      
      // Actualizar estado visual
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Cargar videos filtrados
      const platform = button.dataset.videoFilter;
      await loadVideos(platform);
    });
  });
}

/**
 * Renderizar videos en el DOM
 */
function renderVideos() {
  const container = document.querySelector('[data-videos]');
  if (!container) return;
  
  const items = VideoState.items;
  
  if (!items.length) {
    container.innerHTML = `
      <div class="empty-state" role="status">
        <p>No hay videos en esta categoría</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = items.map((item, index) => createVideoCard(item, index)).join('');
  
  // Configurar lazy loading de iframes
  setupLazyEmbeds();
}

/**
 * Crear HTML para una tarjeta de video
 */
function createVideoCard(item, index) {
   const { id, title, description, videoUrl, category, thumbnail, duration } = item;
   
   const videoId  = extractVideoId(videoUrl);
   const embedUrl = getEmbedUrl(videoId);
   const thumb    = thumbnail || getDefaultThumbnail(videoId);

   const categoryLabel = category || 'General';

   return `
     <article class="featured-video-card" style="animation-delay:${index * 50}ms" data-video-id="${id}">
       <div class="featured-video-thumb video-wrapper"
            data-embed-url="${escapeHtml(embedUrl || '')}"
            data-video-id="${escapeHtml(videoId || '')}">
         <img src="${escapeHtml(thumb)}" alt="${escapeHtml(title || 'Video')}" loading="lazy">
         <button type="button" class="featured-video-play video-play-trigger"
                 aria-label="Reproducir: ${escapeHtml(title || 'Video')}">
           <i class="fas fa-play" aria-hidden="true"></i>
         </button>
         <span class="featured-video-badge">${escapeHtml(categoryLabel)}</span>
         ${duration ? `<span class="video-duration">${escapeHtml(duration)}</span>` : ''}
       </div>
       <div class="featured-video-info">
         <h3 class="featured-video-title">${escapeHtml(title || 'Sin título')}</h3>
         ${description ? `<p class="featured-video-desc">${escapeHtml(description)}</p>` : ''}
         ${item.date ? `<p class="featured-video-date"><i class="fas fa-calendar-alt" aria-hidden="true"></i> ${escapeHtml(item.date)}</p>` : ''}
       </div>
     </article>
   `;
 }

/**
 * Extraer ID de video desde URL
 */
function extractVideoId(url) {
   if (!url) return null;
   
   try {
     const urlObj = new URL(url);
     
     // Intentar detectar plataforma por dominio
     const hostname = urlObj.hostname.toLowerCase();
     
     // YouTube
     if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
       return urlObj.searchParams.get('v') || urlObj.pathname.slice(1);
     }
     
     // Vimeo
     if (hostname.includes('vimeo.com')) {
       return urlObj.pathname.split('/').filter(Boolean).pop();
     }
     
     // Facebook
     if (hostname.includes('facebook.com')) {
       return urlObj.pathname.split('/').pop();
     }
     
     return url;
   } catch {
     return url;
   }
 }
 
 function getEmbedUrl(videoId) {
   if (!videoId) return null;
   
   // Si el videoId parece una URL completa
   if (videoId.startsWith('http')) {
     return videoId;
   }
   
   // Intentar como YouTube por defecto
   return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
 }

/**
 * Obtener thumbnail por defecto según plataforma
 */
function getDefaultThumbnail(videoId) {
   if (!videoId) return '../assets/images/placeholder.jpg';
   
   // YouTube para miniaturas
   if (videoId.length === 11 || videoId.length === 34) {
     return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
   }
   
   return '../assets/images/placeholder.jpg';
 }

/**
 * Configurar lazy loading de iframes (abrir en modal al hacer clic)
 */
function setupLazyEmbeds() {
  // Intentar usar el modal existente en la página
  const modal       = document.getElementById('video-modal');
  const player      = document.getElementById('video-player');
  const modalTitle  = document.getElementById('video-modal-title');
  const modalDesc   = document.getElementById('video-description');
  const modalClose  = modal?.querySelector('.modal-close');

document.querySelectorAll('.featured-video-play.video-play-trigger').forEach(trigger => {
     trigger.addEventListener('click', (e) => {
       e.preventDefault();
       e.stopPropagation();

       const wrapper  = trigger.closest('.video-wrapper');
       if (!wrapper) return;

       const embedUrl = wrapper.dataset.embedUrl;
       const card     = wrapper.closest('.featured-video-card');
       const title    = card?.querySelector('.featured-video-title')?.textContent || 'Video';
       const desc     = card?.querySelector('.featured-video-desc')?.textContent || '';

if (modal && player) {
         // Usar modal existente
         if (modalTitle) modalTitle.textContent = title;
         if (modalDesc)  modalDesc.textContent  = desc;
         player.innerHTML = createEmbedIframe(embedUrl, title);
         modal.classList.remove('hidden');
         modal.setAttribute('aria-hidden', 'false');
         document.body.style.overflow = 'hidden';
       } else {
         // Fallback: embed inline directo
         wrapper.innerHTML = createEmbedIframe(embedUrl, title);
       }
    });
  });

  // Cerrar modal
  if (modal) {
    const closeModal = () => {
      // Detener reproducción eliminando el iframe
      if (player) player.innerHTML = '';
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };

    modalClose?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal();
    }, { once: false });
  }
}

/**
 * Crear iframe de embed accesible
 */
function createEmbedIframe(url, title) {
   const commonAttrs = `
     title="${escapeHtml(title)}"
     frameborder="0"
     allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
     allowfullscreen
     loading="eager"
   `;
   
   if (!url) return `<p>Video no disponible</p>`;
   
   return `
     <div class="embed-responsive">
       <iframe 
         src="${url}&autoplay=1"
         ${commonAttrs}
       ></iframe>
     </div>
   `;
 }

/**
 * Inicializar YouTube Player API (opcional para controles avanzados)
 */
function initYouTubePlayer(iframe) {
  if (!window.YT || !iframe) return;
  
  try {
    const player = new YT.Player(iframe, {
      events: {
        onReady: (event) => {
          // Player listo
          console.log('YouTube player ready');
        },
        onStateChange: (event) => {
          // Manejar estados si es necesario
          if (event.data === YT.PlayerState.ENDED) {
            // Video terminado
          }
        }
      }
    });
    
    VideoState.players.set(iframe.dataset.id || iframe.src, player);
  } catch (error) {
    console.warn('No se pudo inicializar YouTube Player:', error);
  }
}

/**
 * Mostrar mensaje de error en videos
 */
function showVideoError(message) {
  const container = document.querySelector('[data-videos]');
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
 * Actualizar videos después de cambios en admin
 */
export function refreshVideos() {
  loadVideos(VideoState.currentFilter);
}

/**
 * Pausar todos los videos (útil al cerrar modales o cambiar de página)
 */
export function pauseAllVideos() {
  // YouTube
  if (window.YT) {
    VideoState.players.forEach(player => {
      if (player && typeof player.pauseVideo === 'function') {
        player.pauseVideo();
      }
    });
  }
  
  // Vimeo (postMessage)
  document.querySelectorAll('iframe[src*="vimeo"]').forEach(iframe => {
    iframe.contentWindow?.postMessage('{"method":"pause"}', '*');
  });
}

// Exportar funciones para uso externo
export const VideoAPI = {
  load: loadVideos,
  refresh: refreshVideos,
  pauseAll: pauseAllVideos
};

// CSS adicional para videos (inyectar si no existe)
if (!document.getElementById('video-styles')) {
  const style = document.createElement('style');
  style.id = 'video-styles';
  style.textContent = `
    [data-videos].gallery-grid {
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: var(--space-5);
    }
    @media (max-width: 640px) {
      [data-videos].gallery-grid {
        grid-template-columns: 1fr;
      }
    }
    .featured-video-card {
      width: 100%;
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
      border: none;
      padding: 0;
      cursor: pointer;
      transition: background .2s ease;
      width: 100%;
      height: 100%;
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
      pointer-events: none;
    }
    .featured-video-card:hover .featured-video-play { background: rgba(0,0,0,.35); }
    .featured-video-card:hover .featured-video-play i { transform: scale(1.1); }
    .featured-video-play:focus-visible {
      outline: 3px solid var(--color-primary, #3b82f6);
      outline-offset: -3px;
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
      z-index: 2;
    }
    .video-duration {
      position: absolute;
      bottom: 8px;
      right: 8px;
      background: rgba(0,0,0,.75);
      color: #fff;
      font-size: .7rem;
      font-weight: 600;
      padding: 2px 7px;
      border-radius: 4px;
      pointer-events: none;
      z-index: 2;
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
    .featured-video-date {
      font-size: .73rem;
      color: var(--color-text-muted, #9ca3af);
      margin: 0;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    #video-player .embed-responsive {
      position: relative;
      width: 100%;
      aspect-ratio: 16/9;
    }
    #video-player .embed-responsive iframe {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      border: none;
    }
  `;
  document.head.appendChild(style);
}
