/**
 * Navigation.js - Gestión de Navegación
 * Menú móvil con overlay, tabs y skip links accesibles
 */

const NavState = {
  mobileMenuOpen: false,
  currentTab: null,
  _initialized: false
};

export function initNavigation() {
  if (NavState._initialized) return;
  NavState._initialized = true;
  injectMobileMenu();
  setupMobileMenu();
  setupTabs();
  setupSkipLink();
  setupSmoothScroll();
  console.log('🧭 Navegación inicializada');
}

/* ── Inyectar estructura del menú móvil ── */
function injectMobileMenu() {
  if (document.getElementById('nav-mobile-overlay')) return;
  const inPagesDir = window.location.pathname.includes('/pages/');
  const homeHref = inPagesDir ? '../index.html' : 'index.html';
  const logoSrc = inPagesDir ? '../assets/images/logo.png' : 'assets/images/logo.png';

  // Recopilar links del nav desktop
  const desktopNav = document.querySelector('[data-nav-menu]');
  const links = desktopNav
    ? Array.from(desktopNav.querySelectorAll('a.nav-link'))
    : [];

  const themeToggle = desktopNav
    ? desktopNav.querySelector('[data-theme-toggle]')
    : null;

  const linksHtml = links.map(a => `
    <a href="${a.getAttribute('href')}"
       class="nav-mobile-link${a.classList.contains('active') ? ' active' : ''}"
       ${a.getAttribute('aria-current') ? `aria-current="${a.getAttribute('aria-current')}"` : ''}>
      ${a.innerHTML}
    </a>
  `).join('');

  const overlay = document.createElement('div');
  overlay.id = 'nav-mobile-overlay';
  overlay.className = 'nav-mobile-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = `
    <div class="nav-mobile-panel" role="dialog" aria-modal="true" aria-label="Menú de navegación">
      <div class="nav-mobile-header">
        <a href="${homeHref}" class="logo" style="text-decoration:none;">
          <img src="${logoSrc}" alt="" width="32" height="32" style="border-radius:6px;">
          <span style="font-weight:700;color:var(--color-primary);font-size:1rem;">Te-incluye</span>
        </a>
        <button class="nav-mobile-close" id="nav-mobile-close" aria-label="Cerrar menú">
          ✕
        </button>
      </div>
      <nav class="nav-mobile-links" aria-label="Navegación principal">
        ${linksHtml}
      </nav>
      <div class="nav-mobile-footer">
        <span style="font-size:0.8rem;color:var(--color-text-muted);">Inclusión que transforma</span>
        ${themeToggle ? `<button class="btn btn-ghost btn-sm" data-theme-toggle-mobile aria-label="Cambiar tema"><span class="toggle-icon-mobile">🌙</span></button>` : ''}
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
}

/* ── Configurar toggle hamburguesa ── */
function setupMobileMenu() {
  const toggle = document.querySelector('[data-nav-toggle]');
  const overlay = document.getElementById('nav-mobile-overlay');
  const closeBtn = document.getElementById('nav-mobile-close');

  if (!toggle || !overlay) return;

  const open = () => {
    NavState.mobileMenuOpen = true;
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    // Foco al primer link
    setTimeout(() => {
      overlay.querySelector('.nav-mobile-link, .nav-mobile-close')?.focus();
    }, 50);
  };

  const close = () => {
    NavState.mobileMenuOpen = false;
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    toggle.focus();
  };

  toggle.addEventListener('click', () => {
    NavState.mobileMenuOpen ? close() : open();
  });

  closeBtn?.addEventListener('click', close);

  // Cerrar al hacer clic en el fondo del overlay
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  // Cerrar con Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && NavState.mobileMenuOpen) close();
  });

  // Sincronizar toggle de tema en menú móvil
  const mobileThemeBtn = overlay.querySelector('[data-theme-toggle-mobile]');
  if (mobileThemeBtn) {
    mobileThemeBtn.addEventListener('click', () => {
      document.querySelector('[data-theme-toggle]')?.click();
      // Actualizar icono
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      mobileThemeBtn.querySelector('.toggle-icon-mobile').textContent = isDark ? '☀️' : '🌙';
    });
  }
}

/* ── Tabs accesibles ── */
function setupTabs() {
  document.querySelectorAll('[role="tablist"]').forEach(tabList => {
    const tabs = tabList.querySelectorAll('[role="tab"]');
    const panels = document.querySelectorAll('[role="tabpanel"]');

    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        activateTab(tab, tabs, panels);
      });

      tab.addEventListener('keydown', (e) => {
        const arr = Array.from(tabs);
        const idx = arr.indexOf(tab);
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          arr[(idx + 1) % arr.length].focus();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          arr[(idx - 1 + arr.length) % arr.length].focus();
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activateTab(tab, tabs, panels);
        }
      });
    });
  });
}

function activateTab(selected, allTabs, allPanels) {
  const targetId = selected.getAttribute('aria-controls');

  allTabs.forEach(t => {
    t.setAttribute('aria-selected', 'false');
    t.setAttribute('tabindex', '-1');
    t.classList.remove('active');
  });

  allPanels.forEach(p => {
    p.classList.add('hidden');
    p.setAttribute('aria-hidden', 'true');
  });

  selected.setAttribute('aria-selected', 'true');
  selected.setAttribute('tabindex', '0');
  selected.classList.add('active');

  const panel = document.getElementById(targetId);
  if (panel) {
    panel.classList.remove('hidden');
    panel.setAttribute('aria-hidden', 'false');
  }

  NavState.currentTab = targetId;
  document.dispatchEvent(new CustomEvent('tab:changed', { detail: { tabId: targetId } }));
}

/* ── Skip link ── */
function setupSkipLink() {
  document.querySelector('.skip-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    const id = e.currentTarget.getAttribute('href')?.slice(1);
    const target = document.getElementById(id);
    if (target) {
      target.setAttribute('tabindex', '-1');
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
    }
  });
}

/* ── Smooth scroll para anclas ── */
export function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (href.length > 1 && !href.includes('/')) {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          history.pushState(null, null, href);
        }
      }
    });
  });
}

export function updateActiveLink(currentPath) {
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath) {
      link.setAttribute('aria-current', 'page');
      link.classList.add('active');
    } else {
      link.removeAttribute('aria-current');
      link.classList.remove('active');
    }
  });
}

export const NavigationAPI = { updateActiveLink, setupSmoothScroll };

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNavigation);
} else {
  initNavigation();
}
