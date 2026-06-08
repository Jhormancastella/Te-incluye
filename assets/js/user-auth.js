/**
 * user-auth.js
 * Sistema de autenticación para usuarios públicos (no admin).
 * - Registro sin verificación de correo
 * - Login / Logout
 * - Perfil en Firestore: nombre, bio, foto
 * - Rol: 'user' | 'admin'  (definido en Firestore)
 * - Muestra nombre/avatar en el header de todas las páginas
 */

import {
  auth, db, storage,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  doc, getDoc, setDoc, updateDoc, serverTimestamp,
  ref, uploadBytes, getDownloadURL
} from './firebase-config.js';
import { escapeHtml, isValidEmail } from './utils.js';

function appPath(path) {
  const prefix = window.location.pathname.includes('/pages/') ? '../' : '';
  return `${prefix}${path}`;
}

function pagePath(file) {
  return window.location.pathname.includes('/pages/') ? file : `pages/${file}`;
}

// ── Estado global ──────────────────────────────────────────────────────────
export const UserState = {
  user: null,       // Firebase Auth user
  profile: null,    // Firestore profile doc
  role: 'guest'     // 'guest' | 'user' | 'admin'
};

// ── Inicializar listener de sesión ─────────────────────────────────────────
export function initUserAuth() {
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      UserState.user = firebaseUser;
      UserState.profile = await fetchProfile(firebaseUser.uid);
      UserState.role = UserState.profile?.role || 'user';
    } else {
      UserState.user    = null;
      UserState.profile = null;
      UserState.role    = 'guest';
    }
    renderUserWidget();
    document.dispatchEvent(new CustomEvent('auth:changed', {
      detail: { user: UserState.user, role: UserState.role, profile: UserState.profile }
    }));
  });
}

// ── Obtener perfil de Firestore ────────────────────────────────────────────
async function fetchProfile(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? snap.data() : null;
  } catch {
    return null;
  }
}

// ── Registro ───────────────────────────────────────────────────────────────
export async function registerUser({ name, email, password, cedula, ubicacion, discapacidad, rol }) {
  if (!name?.trim())          throw new Error('El nombre es obligatorio');
  if (!isValidEmail(email))   throw new Error('Correo electrónico inválido');
  if (password?.length < 6)   throw new Error('La contraseña debe tener al menos 6 caracteres');

  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(user, { displayName: name.trim() });

  await setDoc(doc(db, 'users', user.uid), {
    uid:              user.uid,
    name:             name.trim(),
    email:            email.toLowerCase(),
    photoURL:         '',
    bio:              '',
    cedula:           cedula?.trim()     || '',
    ubicacion:        ubicacion?.trim()  || '',
    discapacidad:     discapacidad       || '',
    rol:              rol                || '',
    role:             'user',
    createdAt:        serverTimestamp(),
    updatedAt:        serverTimestamp()
  });

  return user;
}

// ── Login ──────────────────────────────────────────────────────────────────
export async function loginUser(email, password) {
  if (!isValidEmail(email)) throw new Error('Correo electrónico inválido');
  if (!password)            throw new Error('La contraseña es obligatoria');
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
}

// ── Logout ─────────────────────────────────────────────────────────────────
export async function logoutUser() {
  await signOut(auth);
}

// ── Actualizar perfil ──────────────────────────────────────────────────────
export async function updateUserProfile({ name, bio, cedula, ubicacion, discapacidad }) {
  if (!UserState.user) throw new Error('No hay sesión activa');

  const updates = { updatedAt: serverTimestamp() };
  if (name?.trim()) {
    updates.name = name.trim();
    await updateProfile(UserState.user, { displayName: name.trim() });
  }
  if (bio          !== undefined) updates.bio          = bio;
  if (cedula       !== undefined) updates.cedula       = cedula?.trim() || '';
  if (ubicacion    !== undefined) updates.ubicacion    = ubicacion?.trim() || '';
  if (discapacidad !== undefined) updates.discapacidad = discapacidad || '';

  await updateDoc(doc(db, 'users', UserState.user.uid), updates);
  UserState.profile = { ...UserState.profile, ...updates };
  renderUserWidget();
}

// ── Subir foto de perfil ───────────────────────────────────────────────────
export async function uploadProfilePhoto(file) {
  if (!UserState.user) throw new Error('No hay sesión activa');
  if (!file.type.startsWith('image/')) throw new Error('Solo se permiten imágenes');
  if (file.size > 2 * 1024 * 1024) throw new Error('La imagen no puede superar 2 MB');

  const storageRef = ref(storage, `profiles/${UserState.user.uid}/avatar`);
  await uploadBytes(storageRef, file);
  const photoURL = await getDownloadURL(storageRef);

  await updateProfile(UserState.user, { photoURL });
  await updateDoc(doc(db, 'users', UserState.user.uid), {
    photoURL,
    updatedAt: serverTimestamp()
  });

  UserState.profile = { ...UserState.profile, photoURL };
  renderUserWidget();
  return photoURL;
}

// ── Recuperar contraseña ───────────────────────────────────────────────────
export async function resetPassword(email) {
  if (!isValidEmail(email)) throw new Error('Correo electrónico inválido');
  await sendPasswordResetEmail(auth, email);
}

// ── Solicitar cambio de rol ───────────────────────────────────────────────────
export async function requestRoleChange(newRole, message = '') {
  if (!UserState.user) throw new Error('No hay sesión activa');
  
  const validRoles = ['voluntario', 'aliado', 'persona_discapacidad', 'acompanante', 'profesional'];
  if (!validRoles.includes(newRole)) throw new Error('Rol no válido');
  
  // Verificar que no tenga ya el rol solicitado
  if (UserState.profile?.rol === newRole) {
    throw new Error('Ya tienes este rol asignado');
  }
  
  // Verificar si ya existe una solicitud pendiente
  const { query, where, getDocs, collection } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
  const q = query(
    collection(db, 'roleRequests'),
    where('userId', '==', UserState.user.uid),
    where('status', '==', 'pending')
  );
  const existing = await getDocs(q);
  if (!existing.empty) {
    throw new Error('Ya tienes una solicitud pendiente de aprobación');
  }
  
  await setDoc(doc(db, 'roleRequests', `${UserState.user.uid}_${newRole}`), {
    userId:        UserState.user.uid,
    userEmail:     UserState.user.email,
    userName:      UserState.profile?.name || UserState.user.displayName || '',
    currentRole:   UserState.profile?.rol || '',
    requestedRole: newRole,
    message:       message.trim(),
    status:        'pending',
    createdAt:     serverTimestamp()
  });
  
  return true;
}

// ── Widget de usuario en el header ────────────────────────────────────────
function renderUserWidget() {
  const container = document.getElementById('user-widget');
  if (!container) return;

  // Ocultar/mostrar link de Admin en el nav según rol
  document.querySelectorAll('a.nav-link[href$="admin.html"], a.nav-mobile-link[href$="admin.html"]')
    .forEach(link => {
      link.style.display = (UserState.role === 'admin') ? '' : 'none';
    });

  if (!UserState.user) {
    container.innerHTML = `
      <div class="auth-btns">
        <a href="${pagePath('login.html')}?mode=login" class="btn btn-outline btn-sm auth-btn-login">
          <i class="fas fa-sign-in-alt" aria-hidden="true"></i>
          <span class="btn-text">Ingresar</span>
        </a>
        <a href="${pagePath('login.html')}?mode=register" class="btn btn-primary btn-sm auth-btn-register">
          <i class="fas fa-user-plus" aria-hidden="true"></i>
          <span class="btn-text">Registrarse</span>
        </a>
      </div>`;
    return;
  }

  const name    = escapeHtml(UserState.profile?.name || UserState.user.displayName || 'Usuario');
  const photo   = UserState.profile?.photoURL || UserState.user.photoURL || '';
  const initial = name.charAt(0).toUpperCase();
  const isAdmin = UserState.role === 'admin';

  container.innerHTML = `
    <div class="user-widget" id="user-widget-inner">
      <button class="user-widget-btn" aria-haspopup="true" aria-expanded="false"
              aria-label="Menú de usuario: ${name}">
        ${photo
          ? `<img src="${photo}" alt="${name}" class="user-avatar-img">`
          : `<span class="user-avatar-initials" aria-hidden="true">${initial}</span>`
        }
        <span class="user-widget-name">${name}</span>
        <i class="fas fa-chevron-down user-widget-caret" aria-hidden="true"></i>
      </button>

      <div class="user-dropdown" role="menu" aria-label="Opciones de usuario">
        <div class="user-dropdown-header">
          ${photo
            ? `<img src="${photo}" alt="" class="user-dropdown-avatar">`
            : `<span class="user-dropdown-initials" aria-hidden="true">${initial}</span>`
          }
          <div>
            <strong>${name}</strong>
            <small>${escapeHtml(UserState.user.email)}</small>
          </div>
        </div>
        <hr class="user-dropdown-divider">
        <a href="${pagePath('perfil.html')}" class="user-dropdown-item" role="menuitem">
          <i class="fas fa-user" aria-hidden="true"></i> Mi perfil
        </a>
        ${isAdmin ? `
        <a href="${pagePath('admin.html')}" class="user-dropdown-item" role="menuitem">
          <i class="fas fa-cog" aria-hidden="true"></i> Panel admin
        </a>` : ''}
        <hr class="user-dropdown-divider">
        <button class="user-dropdown-item user-dropdown-logout" role="menuitem" id="btn-logout">
          <i class="fas fa-sign-out-alt" aria-hidden="true"></i> Cerrar sesión
        </button>
      </div>
    </div>`;

  // Toggle dropdown
  const btn      = container.querySelector('.user-widget-btn');
  const dropdown = container.querySelector('.user-dropdown');

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = dropdown.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', open);
  });

  document.addEventListener('click', () => {
    dropdown.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
  });

  container.querySelector('#btn-logout')?.addEventListener('click', async () => {
    await logoutUser();
    window.location.href = appPath('index.html');
  });
}

// ── Helpers exportados ─────────────────────────────────────────────────────
export function isLoggedIn()  { return !!UserState.user; }
export function isAdmin()     { return UserState.role === 'admin'; }
export function getCurrentUser() { return UserState.user; }
export function getCurrentProfile() { return UserState.profile; }

// ── Mensajes de error Firebase Auth en español ─────────────────────────────
export function authErrorMessage(error) {
  const map = {
    'auth/email-already-in-use':    'Este correo ya está registrado',
    'auth/invalid-email':           'Correo electrónico inválido',
    'auth/weak-password':           'La contraseña es muy débil (mínimo 6 caracteres)',
    'auth/user-not-found':          'No existe una cuenta con ese correo',
    'auth/wrong-password':          'Contraseña incorrecta',
    'auth/invalid-credential':      'Correo o contraseña incorrectos',
    'auth/too-many-requests':       'Demasiados intentos. Intenta más tarde',
    'auth/network-request-failed':  'Error de red. Verifica tu conexión',
    'auth/user-disabled':           'Esta cuenta ha sido deshabilitada'
  };
  return map[error.code] || error.message || 'Ocurrió un error inesperado';
}
