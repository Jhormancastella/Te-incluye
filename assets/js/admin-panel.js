/**
 * admin-panel.js
 * Panel de administración para Incluyeme
 * Conectado a Firebase (Auth, Firestore, Storage)
 */

import {
  auth, db, storage,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, query, orderBy, limit, serverTimestamp, getCountFromServer,
  ref, uploadBytes, getDownloadURL, deleteObject
} from './firebase-config.js';
import { firestore, handleFirebaseError } from './db.js';
import { escapeHtml, showToast, confirmDialog, exportAsJSON, importJSON, formatDate, extractYouTubeId, getYouTubeThumbnail } from './utils.js';

// ── Estado global ──────────────────────────────────────────────────────────
const AdminState = {
  user: null,
  profile: null,
  role: 'guest',
  currentSection: 'dashboard',
  data: {
    proyectos: [],
    recursos: [],
    galeria: [],
    videos: [],
    stats: [],
    config: {}
  }
};

// ── Inicialización ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  initNavigation();
  initThemeToggle();
  initSidebar();
  initDashboardShortcuts();
});

// ── Autenticación ──────────────────────────────────────────────────────────
function initAuth() {
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      AdminState.user = firebaseUser;
      AdminState.profile = await fetchProfile(firebaseUser.uid);
      AdminState.role = AdminState.profile?.role || 'user';

      if (AdminState.role === 'admin') {
        showAdminPanel();
        loadAllData();
      } else {
        showAccessDenied();
      }
    } else {
      AdminState.user = null;
      AdminState.profile = null;
      AdminState.role = 'guest';
      showLogin();
    }
    document.documentElement.style.opacity = '1';
  });

  // Login form
  const loginForm = document.getElementById('apLoginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('apEmail').value.trim();
      const password = document.getElementById('apPassword').value;
      const errorEl = document.getElementById('apLoginError');
      const submitBtn = document.getElementById('apLoginSubmit');

      errorEl.textContent = '';
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando...';

      try {
        await signInWithEmailAndPassword(auth, email, password);
        showToast('Sesión iniciada correctamente', 'success');
      } catch (error) {
        errorEl.textContent = handleFirebaseError(error);
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-right-to-bracket"></i> Iniciar sesión';
      }
    });
  }

  // Logout
  const logoutBtn = document.getElementById('apLogoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await signOut(auth);
      window.location.replace('../index.html');
    });
  }

  // Toggle password visibility
  const eyeBtn = document.getElementById('apEyeBtn');
  if (eyeBtn) {
    eyeBtn.addEventListener('click', () => {
      const passInput = document.getElementById('apPassword');
      const icon = eyeBtn.querySelector('i');
      if (passInput.type === 'password') {
        passInput.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
      } else {
        passInput.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
      }
    });
  }
}

async function fetchProfile(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? snap.data() : null;
  } catch {
    return null;
  }
}

function showLogin() {
  window.location.replace('../index.html');
}

function showAdminPanel() {
  document.documentElement.classList.add('ap-authed');
  const loginWrap = document.getElementById('apLoginWrap');
  const content = document.getElementById('apContent');
  if (loginWrap) loginWrap.style.display = 'none';
  if (content) content.style.display = 'block';

  // Mostrar info de usuario
  const userInfo = document.getElementById('apUserInfo');
  if (userInfo) {
    const name = AdminState.profile?.name || AdminState.user?.email || '';
    const email = AdminState.user?.email || '';
    const initial = name.charAt(0).toUpperCase();
    userInfo.innerHTML = `
      <div class="ap-user-avatar">${escapeHtml(initial)}</div>
      <div class="ap-user-details">
        <span class="ap-user-name">${escapeHtml(name)}</span>
        <span class="ap-user-email">${escapeHtml(email)}</span>
      </div>
    `;
  }
}

function showAccessDenied() {
  const loginWrap = document.getElementById('apLoginWrap');
  if (loginWrap) {
    loginWrap.innerHTML = `
      <div class="ap-login-card" style="text-align:center;">
        <i class="fas fa-shield-halved" style="font-size:3rem;color:var(--color-error);margin-bottom:1rem;"></i>
        <h2>Acceso denegado</h2>
        <p>No tienes permisos de administrador.</p>
        <button class="btn" onclick="window.location.href='../index.html'">Volver al inicio</button>
      </div>
    `;
  }
}

// ── Navegación ─────────────────────────────────────────────────────────────
function initNavigation() {
  const navItems = document.querySelectorAll('.ap-nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const section = item.dataset.section;
      switchSection(section);
      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
    });
  });
}

function switchSection(section) {
  AdminState.currentSection = section;
  const sections = document.querySelectorAll('.ap-section');
  sections.forEach(s => s.classList.remove('active'));
  const target = document.getElementById(`sec-${section}`);
  if (target) target.classList.add('active');

  const titleMap = {
    dashboard: 'Dashboard',
    contenido: 'Contenido principal',
    proyectos: 'Proyectos',
    recursos: 'Recursos',
    galeria: 'Galería',
    videos: 'Videos',
    configuracion: 'Configuración'
  };
  const topbarTitle = document.getElementById('apTopbarTitle');
  if (topbarTitle) topbarTitle.textContent = titleMap[section] || 'Panel';

  // Cargar datos de la sección
  if (section === 'dashboard') loadDashboard();
  if (section === 'contenido') loadContenido();
  if (section === 'proyectos') renderTable('proyectos');
  if (section === 'recursos') renderTable('recursos');
  if (section === 'galeria') renderTable('galeria');
  if (section === 'videos') renderTable('videos');
  if (section === 'configuracion') loadConfiguracion();
}

// ── Sidebar (mobile) ───────────────────────────────────────────────────────
function initSidebar() {
  const menuBtn = document.getElementById('apMenuBtn');
  const sidebar = document.getElementById('apSidebar');
  const closeBtn = document.getElementById('apSidebarClose');
  const overlay = document.getElementById('apOverlay');

  if (menuBtn && sidebar) {
    menuBtn.addEventListener('click', () => {
      sidebar.classList.add('open');
      overlay?.classList.add('active');
      menuBtn.setAttribute('aria-expanded', 'true');
    });
  }
  if (closeBtn && sidebar) {
    closeBtn.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay?.classList.remove('active');
      menuBtn?.setAttribute('aria-expanded', 'false');
    });
  }
  if (overlay && sidebar) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });
  }
}

// ── Tema (dark/light) ──────────────────────────────────────────────────────
function initThemeToggle() {
  const toggle = document.getElementById('apThemeToggle');
  if (!toggle) return;

  const saved = localStorage.getItem('admin-theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeIcon(saved);

  toggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('admin-theme', next);
    updateThemeIcon(next);
  });
}

function updateThemeIcon(theme) {
  const toggle = document.getElementById('apThemeToggle');
  if (!toggle) return;
  const icon = toggle.querySelector('i');
  if (theme === 'dark') {
    icon.classList.replace('fa-moon', 'fa-sun');
  } else {
    icon.classList.replace('fa-sun', 'fa-moon');
  }
}

// ── Cargar todos los datos ─────────────────────────────────────────────────
async function loadAllData() {
  try {
    const [proyectos, recursos, galeria, videos, stats] = await Promise.all([
      firestore.getAll(firestore.collections.PROJECTS),
      firestore.getAll(firestore.collections.RESOURCES),
      firestore.getAll(firestore.collections.GALLERY),
      firestore.getAll(firestore.collections.VIDEOS),
      firestore.getAll(firestore.collections.STATS, 'order', 'asc')
    ]);

    AdminState.data.proyectos = proyectos;
    AdminState.data.recursos = recursos;
    AdminState.data.galeria = galeria;
    AdminState.data.videos = videos;
    AdminState.data.stats = stats;

    // Cargar config
    const heroSnap = await getDoc(doc(db, 'config', 'hero'));
    const featuredSnap = await getDoc(doc(db, 'config', 'featured'));
    AdminState.data.config.hero = heroSnap.exists() ? heroSnap.data() : {};
    AdminState.data.config.featured = featuredSnap.exists() ? featuredSnap.data() : {};

    loadDashboard();
  } catch (error) {
    console.error('Error cargando datos:', error);
    showToast('Error al cargar datos', 'error');
  }
}

// ── Dashboard ──────────────────────────────────────────────────────────────
function initDashboardShortcuts() {
  document.querySelectorAll('[data-goto]').forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.dataset.goto;
      switchSection(section);
      document.querySelectorAll('.ap-nav-item').forEach(i => {
        i.classList.toggle('active', i.dataset.section === section);
      });
    });
  });
}

async function loadDashboard() {
  const statsGrid = document.getElementById('apStatsGrid');
  if (statsGrid) {
    // Get user count (including admins) from Firestore
    let userCount = 0;
    try {
      const usersSnap = await getCountFromServer(collection(db, 'users'));
      userCount = usersSnap.data().count;
    } catch (e) {
      console.error('Error fetching user count:', e);
    }
    const stats = [
      { icon: 'fa-user', label: 'Usuarios', value: userCount, color: '#0ea5e9' },
      { icon: 'fa-rocket', label: 'Proyectos', value: AdminState.data.proyectos.length, color: '#3b82f6' },
      { icon: 'fa-map-location-dot', label: 'Recursos', value: AdminState.data.recursos.length, color: '#10b981' },
      { icon: 'fa-images', label: 'Galería', value: AdminState.data.galeria.length, color: '#8b5cf6' },
      { icon: 'fa-video', label: 'Videos', value: AdminState.data.videos.length, color: '#f59e0b' }
    ];
    statsGrid.innerHTML = stats.map(s => `
      <div class="ap-stat-card" style="--stat-color:${s.color}">
        <div class="ap-stat-icon"><i class="fas ${s.icon}"></i></div>
        <div class="ap-stat-info">
          <strong>${s.value}</strong>
          <span>${s.label}</span>
        </div>
      </div>
    `).join('');
  }

  // Recientes
  renderRecent('dashProyectos', AdminState.data.proyectos.slice(0, 3), 'proyectos');
  renderRecent('dashGaleria', AdminState.data.galeria.slice(0, 3), 'galeria');
  renderRecent('dashVideos', AdminState.data.videos.slice(0, 3), 'videos');
  renderRecent('dashRecursos', AdminState.data.recursos.slice(0, 3), 'recursos');
}

function renderRecent(containerId, items, type) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (!items.length) {
    container.innerHTML = '<p class="ap-empty">Sin elementos aún</p>';
    return;
  }
  container.innerHTML = items.map(item => {
    const date = item.createdAt ? formatDate(item.createdAt) : '';
    let thumb = '';
    if (type === 'proyectos' && item.image) {
      thumb = `<img src="${escapeHtml(item.image)}" alt="" class="ap-recent-thumb">`;
    } else if (type === 'galeria' && item.image) {
      thumb = `<img src="${escapeHtml(item.image)}" alt="" class="ap-recent-thumb">`;
    } else if (type === 'videos') {
      const ytId = extractYouTubeId(item.videoUrl || '');
      const src = item.thumbnail || (ytId ? getYouTubeThumbnail(ytId) : '');
      thumb = src ? `<img src="${escapeHtml(src)}" alt="" class="ap-recent-thumb">` : '';
    }
    const label = item.label || item.category || item.platform || '';
    return `
      <div class="ap-recent-item">
        ${thumb}
        <div class="ap-recent-info">
          <span class="ap-recent-title">${escapeHtml(item.title || 'Sin título')}</span>
          <div class="ap-recent-meta">
            ${label ? `<span class="ap-recent-tag">${escapeHtml(label)}</span>` : ''}
            ${date ? `<small>${date}</small>` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ── Contenido (Hero, Banner, Stats) ────────────────────────────────────────
function loadContenido() {
  // Hero
  const hero = AdminState.data.config.hero || {};
  document.getElementById('heroTitle').value = hero.title || '';
  document.getElementById('heroSubtitle').value = hero.subtitle || '';

  // Featured
  const featured = AdminState.data.config.featured || {};
  document.getElementById('featuredType').value = featured.type || 'image';
  document.getElementById('featuredEnabled').value = featured.enabled ? 'true' : 'false';
  document.getElementById('featuredUrl').value = featured.url || '';
  document.getElementById('featuredTitle').value = featured.title || '';
  document.getElementById('featuredDesc').value = featured.desc || '';

  // Stats
  renderStatsEditor();

  // Form listeners
  document.getElementById('formHero').onsubmit = saveHero;
  document.getElementById('formFeatured').onsubmit = saveFeatured;
  document.getElementById('formStats').onsubmit = saveStats;
}

async function saveHero(e) {
  e.preventDefault();
  const title = document.getElementById('heroTitle').value.trim();
  const subtitle = document.getElementById('heroSubtitle').value.trim();
  try {
    await setDoc(doc(db, 'config', 'hero'), { title, subtitle, updatedAt: serverTimestamp() });
    AdminState.data.config.hero = { title, subtitle };
    showToast('Hero guardado', 'success');
  } catch (error) {
    showToast(handleFirebaseError(error), 'error');
  }
}

async function saveFeatured(e) {
  e.preventDefault();
  const data = {
    type: document.getElementById('featuredType').value,
    enabled: document.getElementById('featuredEnabled').value === 'true',
    url: document.getElementById('featuredUrl').value.trim(),
    title: document.getElementById('featuredTitle').value.trim(),
    desc: document.getElementById('featuredDesc').value.trim(),
    updatedAt: serverTimestamp()
  };
  try {
    await setDoc(doc(db, 'config', 'featured'), data);
    AdminState.data.config.featured = data;
    showToast('Banner guardado', 'success');
  } catch (error) {
    showToast(handleFirebaseError(error), 'error');
  }
}

function renderStatsEditor() {
  const container = document.getElementById('statsEditor');
  if (!container) return;
  const stats = AdminState.data.stats;
  container.innerHTML = stats.map((s, i) => `
    <div class="ap-stat-row" data-index="${i}">
      <input type="text" placeholder="Etiqueta" value="${escapeHtml(s.label || '')}" data-field="label">
      <input type="number" placeholder="Valor" value="${s.value || ''}" data-field="value">
      <input type="number" placeholder="Orden" value="${s.order || i}" data-field="order">
      <button type="button" class="btn btn-sm btn-danger" data-remove="${i}"><i class="fas fa-trash"></i></button>
    </div>
  `).join('') + `
    <button type="button" class="btn btn-sm btn-secondary" id="btnAddStat"><i class="fas fa-plus"></i> Agregar</button>
  `;

  container.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.remove);
      AdminState.data.stats.splice(idx, 1);
      renderStatsEditor();
    });
  });

  document.getElementById('btnAddStat').addEventListener('click', () => {
    AdminState.data.stats.push({ label: '', value: 0, order: AdminState.data.stats.length });
    renderStatsEditor();
  });

  container.querySelectorAll('input').forEach(input => {
    input.addEventListener('change', () => {
      const row = input.closest('.ap-stat-row');
      const idx = parseInt(row.dataset.index);
      const field = input.dataset.field;
      AdminState.data.stats[idx][field] = input.type === 'number' ? parseFloat(input.value) || 0 : input.value;
    });
  });
}

async function saveStats(e) {
  e.preventDefault();
  try {
    const batch = [];
    for (const stat of AdminState.data.stats) {
      if (stat.id) {
        batch.push(updateDoc(doc(db, 'stats', stat.id), { ...stat, updatedAt: serverTimestamp() }));
      } else {
        batch.push(firestore.add(firestore.collections.STATS, stat));
      }
    }
    await Promise.all(batch);
    showToast('Estadísticas guardadas', 'success');
    const newStats = await firestore.getAll(firestore.collections.STATS, 'order', 'asc');
    AdminState.data.stats = newStats;
    renderStatsEditor();
  } catch (error) {
    showToast(handleFirebaseError(error), 'error');
  }
}

// ── Tablas CRUD ────────────────────────────────────────────────────────────
function renderTable(type) {
  const tbody = document.getElementById(`tbody${capitalize(type)}`);
  if (!tbody) return;
  const items = AdminState.data[type];
  const searchInput = document.getElementById(`search${capitalize(type)}`);

  const render = (filtered) => {
    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="10" class="ap-empty">No hay elementos</td></tr>`;
      return;
    }
    tbody.innerHTML = filtered.map(item => renderRow(type, item)).join('');
    attachRowActions(type);
  };

  render(items);

  if (searchInput) {
    searchInput.oninput = () => {
      const q = searchInput.value.toLowerCase();
      const filtered = items.filter(item =>
        (item.title || '').toLowerCase().includes(q) ||
        (item.label || '').toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q)
      );
      render(filtered);
    };
  }

  // Filter (galeria, videos)
  const filterSelect = document.getElementById(`filter${capitalize(type)}`);
  if (filterSelect) {
    filterSelect.onchange = () => {
      const val = filterSelect.value;
      const filtered = val ? items.filter(i => i.category === val) : items;
      render(filtered);
    };
  }

  // Botón nuevo
  const btnNuevoIds = {
    proyectos: 'btnNuevoProyecto',
    recursos: 'btnNuevoRecurso',
    galeria: 'btnNuevaImagen',
    videos: 'btnNuevoVideo'
  };
  const btnNuevo = document.getElementById(btnNuevoIds[type]);
  if (btnNuevo) {
    btnNuevo.onclick = () => openModal(type, null);
  }
}

function renderRow(type, item) {
  const id = item.id;
  const featuredIcon = item.featured ? '<i class="fas fa-star" style="color:#f59e0b"></i>' : '<i class="fas fa-star" style="color:#d1d5db"></i>';
  const date = item.createdAt ? formatDate(item.createdAt, 'es-CO') : '';

  if (type === 'proyectos') {
    return `
      <tr data-id="${id}">
        <td><img src="${escapeHtml(item.image || '')}" alt="" class="ap-thumb"></td>
        <td>${escapeHtml(item.title || '')}</td>
        <td>${escapeHtml(item.label || '')}</td>
        <td>${date}</td>
        <td>${featuredIcon}</td>
        <td>
          <button class="ap-action-btn" data-edit="${id}" title="Editar"><i class="fas fa-pen"></i></button>
          <button class="ap-action-btn ap-action-btn--danger" data-delete="${id}" title="Eliminar"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `;
  }
  if (type === 'recursos') {
    return `
      <tr data-id="${id}">
        <td>${escapeHtml(item.title || '')}</td>
        <td>${escapeHtml(item.label || '')}</td>
        <td>${escapeHtml(item.address || '')}</td>
        <td>${escapeHtml(item.phone || '')}</td>
        <td>${escapeHtml(item.schedule || '')}</td>
        <td>${featuredIcon}</td>
        <td>
          <button class="ap-action-btn" data-edit="${id}" title="Editar"><i class="fas fa-pen"></i></button>
          <button class="ap-action-btn ap-action-btn--danger" data-delete="${id}" title="Eliminar"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `;
  }
  if (type === 'galeria') {
    return `
      <tr data-id="${id}">
        <td><img src="${escapeHtml(item.image || '')}" alt="" class="ap-thumb"></td>
        <td>${escapeHtml(item.title || '')}</td>
        <td>${escapeHtml(item.category || '')}</td>
        <td>${escapeHtml(item.type || 'image')}</td>
        <td>${date}</td>
        <td>${featuredIcon}</td>
        <td>
          <button class="ap-action-btn" data-edit="${id}" title="Editar"><i class="fas fa-pen"></i></button>
          <button class="ap-action-btn ap-action-btn--danger" data-delete="${id}" title="Eliminar"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `;
  }
  if (type === 'videos') {
    const thumb = item.thumbnail || (extractYouTubeId(item.videoUrl) ? getYouTubeThumbnail(extractYouTubeId(item.videoUrl)) : '');
    return `
      <tr data-id="${id}">
        <td><img src="${escapeHtml(thumb)}" alt="" class="ap-thumb"></td>
        <td>${escapeHtml(item.title || '')}</td>
        <td>${escapeHtml(item.category || '')}</td>
        <td>${date}</td>
        <td>${featuredIcon}</td>
        <td>
          <button class="ap-action-btn" data-edit="${id}" title="Editar"><i class="fas fa-pen"></i></button>
          <button class="ap-action-btn ap-action-btn--danger" data-delete="${id}" title="Eliminar"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `;
  }
  return '';
}

function attachRowActions(type) {
  document.querySelectorAll('[data-edit]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.edit;
      const item = AdminState.data[type].find(i => i.id === id);
      if (item) openModal(type, item);
    };
  });
  document.querySelectorAll('[data-delete]').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.dataset.delete;
      const ok = await confirmDialog('¿Eliminar este elemento? Esta acción no se puede deshacer.');
      if (!ok) return;
      try {
        await firestore.delete(getCollectionName(type), id);
        AdminState.data[type] = AdminState.data[type].filter(i => i.id !== id);
        renderTable(type);
        showToast('Elemento eliminado', 'success');
      } catch (error) {
        showToast(handleFirebaseError(error), 'error');
      }
    };
  });
}

function getCollectionName(type) {
  const map = {
    proyectos: firestore.collections.PROJECTS,
    recursos: firestore.collections.RESOURCES,
    galeria: firestore.collections.GALLERY,
    videos: firestore.collections.VIDEOS,
    stats: firestore.collections.STATS
  };
  return map[type];
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ── Modal Universal ────────────────────────────────────────────────────────
function openModal(type, item = null) {
  const modal = document.getElementById('apModal');
  const title = document.getElementById('apModalTitle');
  const body = document.getElementById('apModalBody');
  const confirmBtn = document.getElementById('apModalConfirm');

  const isEdit = !!item;
  title.textContent = `${isEdit ? 'Editar' : 'Nuevo'} ${type.slice(0, -1)}`;

  body.innerHTML = getModalForm(type, item);
  modal.hidden = false;

  // File upload handler
  const fileInput = body.querySelector('input[type="file"]');
  if (fileInput) {
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const path = `${type}/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        const urlInput = body.querySelector('[data-field="image"]') || body.querySelector('[data-field="videoUrl"]');
        if (urlInput) urlInput.value = url;
        showToast('Archivo subido', 'success');
      } catch (error) {
        showToast('Error al subir: ' + handleFirebaseError(error), 'error');
      }
    });
  }

  confirmBtn.onclick = async () => {
    const formData = {};
    body.querySelectorAll('[data-field]').forEach(input => {
      const field = input.dataset.field;
      formData[field] = input.type === 'checkbox' ? input.checked : input.value.trim();
    });

    // Validación básica
    if (!formData.title) {
      showToast('El título es obligatorio', 'warning');
      return;
    }

    try {
      if (isEdit) {
        await firestore.update(getCollectionName(type), item.id, formData);
        const idx = AdminState.data[type].findIndex(i => i.id === item.id);
        AdminState.data[type][idx] = { ...AdminState.data[type][idx], ...formData };
      } else {
        const newId = await firestore.add(getCollectionName(type), formData);
        const newItem = await firestore.getById(getCollectionName(type), newId);
        AdminState.data[type].unshift(newItem);
      }
      renderTable(type);
      closeModal();
      showToast(isEdit ? 'Cambios guardados' : 'Elemento creado', 'success');
    } catch (error) {
      showToast(handleFirebaseError(error), 'error');
    }
  };

  // Cancel
  document.getElementById('apModalCancel').onclick = closeModal;
  document.getElementById('apModalClose').onclick = closeModal;
}

function closeModal() {
  document.getElementById('apModal').hidden = true;
}

function getModalForm(type, item) {
  const val = (field) => item ? (item[field] || '') : '';
  const checked = (field) => item && item[field] ? 'checked' : '';

  let fields = '';
  if (type === 'proyectos') {
    fields = `
      <div class="form-group"><label>Título</label><input type="text" data-field="title" value="${escapeHtml(val('title'))}"></div>
      <div class="form-group"><label>Descripción</label><textarea data-field="description" rows="3">${escapeHtml(val('description'))}</textarea></div>
      <div class="form-group"><label>Etiqueta</label><input type="text" data-field="label" value="${escapeHtml(val('label'))}"></div>
      <div class="form-group"><label>Enlace</label><input type="url" data-field="link" value="${escapeHtml(val('link'))}"></div>
      <div class="form-group"><label>Imagen</label><input type="file" accept="image/*"><input type="text" data-field="image" value="${escapeHtml(val('image'))}" placeholder="O pega una URL"></div>
      <div class="form-group"><label><input type="checkbox" data-field="featured" ${checked('featured')}> Destacado</label></div>
    `;
  } else if (type === 'recursos') {
    fields = `
      <div class="form-group"><label>Título</label><input type="text" data-field="title" value="${escapeHtml(val('title'))}"></div>
      <div class="form-group"><label>Etiqueta</label><input type="text" data-field="label" value="${escapeHtml(val('label'))}"></div>
      <div class="form-group"><label>Dirección</label><input type="text" data-field="address" value="${escapeHtml(val('address'))}"></div>
      <div class="form-group"><label>Teléfono</label><input type="text" data-field="phone" value="${escapeHtml(val('phone'))}"></div>
      <div class="form-group"><label>Horario</label><input type="text" data-field="schedule" value="${escapeHtml(val('schedule'))}"></div>
      <div class="form-group"><label><input type="checkbox" data-field="featured" ${checked('featured')}> Destacado</label></div>
    `;
  } else if (type === 'galeria') {
    fields = `
      <div class="form-group"><label>Título</label><input type="text" data-field="title" value="${escapeHtml(val('title'))}"></div>
      <div class="form-group"><label>Descripción (alt)</label><input type="text" data-field="alt" value="${escapeHtml(val('alt'))}"></div>
      <div class="form-group"><label>Categoría</label>
        <select data-field="category">
          <option value="Eventos" ${val('category')==='Eventos'?'selected':''}>Eventos</option>
          <option value="Infraestructura" ${val('category')==='Infraestructura'?'selected':''}>Infraestructura</option>
          <option value="Capacitación" ${val('category')==='Capacitación'?'selected':''}>Capacitación</option>
          <option value="Testimonios" ${val('category')==='Testimonios'?'selected':''}>Testimonios</option>
        </select>
      </div>
      <div class="form-group"><label>Imagen</label><input type="file" accept="image/*"><input type="text" data-field="image" value="${escapeHtml(val('image'))}" placeholder="O pega una URL"></div>
      <div class="form-group"><label><input type="checkbox" data-field="featured" ${checked('featured')}> Destacado</label></div>
    `;
  } else if (type === 'videos') {
    fields = `
      <div class="form-group"><label>Título</label><input type="text" data-field="title" value="${escapeHtml(val('title'))}"></div>
      <div class="form-group"><label>Descripción</label><textarea data-field="description" rows="2">${escapeHtml(val('description'))}</textarea></div>
      <div class="form-group"><label>URL del video (YouTube)</label><input type="url" data-field="videoUrl" value="${escapeHtml(val('videoUrl'))}"></div>
      <div class="form-group"><label>Categoría</label>
        <select data-field="category">
          <option value="Educación" ${val('category')==='Educación'?'selected':''}>Educación</option>
          <option value="Deportes" ${val('category')==='Deportes'?'selected':''}>Deportes</option>
          <option value="Salud" ${val('category')==='Salud'?'selected':''}>Salud</option>
          <option value="Empleo" ${val('category')==='Empleo'?'selected':''}>Empleo</option>
          <option value="Eventos" ${val('category')==='Eventos'?'selected':''}>Eventos</option>
        </select>
      </div>
      <div class="form-group"><label>Miniatura (opcional)</label><input type="text" data-field="thumbnail" value="${escapeHtml(val('thumbnail'))}" placeholder="URL de miniatura"></div>
      <div class="form-group"><label><input type="checkbox" data-field="featured" ${checked('featured')}> Destacado</label></div>
    `;
  }
  return `<form class="ap-form" id="modalForm">${fields}</form>`;
}

// ── Configuración ──────────────────────────────────────────────────────────
function loadConfiguracion() {
  const cfgEmail = document.getElementById('cfgCurrentEmail');
  if (cfgEmail && AdminState.user) {
    cfgEmail.textContent = `Email actual: ${AdminState.user.email}`;
  }

  document.getElementById('formCredenciales').onsubmit = saveCredentials;
  document.getElementById('btnExport').onclick = exportData;
  document.getElementById('btnImport').onclick = importData;
  document.getElementById('btnReset').onclick = resetDefaults;
}

async function saveCredentials(e) {
  e.preventDefault();
  const newEmail = document.getElementById('cfgEmail').value.trim();
  const newPass = document.getElementById('cfgPass').value;
  const confirmPass = document.getElementById('cfgPassConfirm').value;

  if (newPass && newPass !== confirmPass) {
    showToast('Las contraseñas no coinciden', 'warning');
    return;
  }

  // Para cambiar email o contraseña, Firebase requiere reautenticación
  const currentPass = prompt('Ingresa tu contraseña actual para confirmar los cambios:');
  if (!currentPass) return;

  try {
    const credential = EmailAuthProvider.credential(AdminState.user.email, currentPass);
    await reauthenticateWithCredential(AdminState.user, credential);

    if (newEmail && newEmail !== AdminState.user.email) {
      await updateEmail(AdminState.user, newEmail);
      await updateDoc(doc(db, 'users', AdminState.user.uid), { email: newEmail.toLowerCase() });
    }
    if (newPass) {
      await updatePassword(AdminState.user, newPass);
    }
    showToast('Credenciales actualizadas', 'success');
    document.getElementById('formCredenciales').reset();
  } catch (error) {
    showToast(handleFirebaseError(error), 'error');
  }
}

async function exportData() {
  try {
    const data = {
      proyectos: AdminState.data.proyectos,
      recursos: AdminState.data.recursos,
      galeria: AdminState.data.galeria,
      videos: AdminState.data.videos,
      stats: AdminState.data.stats,
      config: AdminState.data.config,
      exportedAt: new Date().toISOString()
    };
    exportAsJSON(data, `incluyeme-backup-${Date.now()}.json`);
    showToast('Datos exportados', 'success');
  } catch (error) {
    showToast('Error al exportar', 'error');
  }
}

async function importData() {
  try {
    const data = await importJSON();
    const ok = await confirmDialog('¿Importar estos datos? Se sobrescribirán los datos actuales.');
    if (!ok) return;

    // Importar cada colección
    for (const [key, items] of Object.entries(data)) {
      if (Array.isArray(items)) {
        for (const item of items) {
          const { id, ...rest } = item;
          if (id) {
            await setDoc(doc(db, getCollectionName(key) || key, id), rest);
          } else {
            await firestore.add(getCollectionName(key) || key, rest);
          }
        }
      } else if (key === 'config') {
        for (const [docId, docData] of Object.entries(items)) {
          await setDoc(doc(db, 'config', docId), docData);
        }
      }
    }
    showToast('Datos importados. Recargando...', 'success');
    setTimeout(() => location.reload(), 1500);
  } catch (error) {
    showToast('Error al importar: ' + error.message, 'error');
  }
}

async function resetDefaults() {
  const ok = await confirmDialog('¿Restaurar valores por defecto? Se borrarán todos los datos personalizados.');
  if (!ok) return;

  try {
    // Borrar todas las colecciones
    const collections = [
      firestore.collections.PROJECTS,
      firestore.collections.RESOURCES,
      firestore.collections.GALLERY,
      firestore.collections.VIDEOS,
      firestore.collections.STATS
    ];
    for (const col of collections) {
      const items = await firestore.getAll(col);
      for (const item of items) {
        await firestore.delete(col, item.id);
      }
    }
    // Borrar config
    await deleteDoc(doc(db, 'config', 'hero'));
    await deleteDoc(doc(db, 'config', 'featured'));

    showToast('Datos restaurados. Recargando...', 'success');
    setTimeout(() => location.reload(), 1500);
  } catch (error) {
    showToast(handleFirebaseError(error), 'error');
  }
}
