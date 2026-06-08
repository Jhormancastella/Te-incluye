/**
 * seed-admin.js
 * Script de uso único para crear/promover la cuenta admin.
 * 
 * USO: Abre seed-admin.html en el navegador una sola vez.
 * Una vez que el usuario admin esté en Firestore, este archivo
 * ya no es necesario.
 */

import {
  auth, db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  doc, setDoc, getDoc, updateDoc, serverTimestamp
} from './firebase-config.js';

const ADMIN_EMAIL = 'teincluye222@gmail.com';

export async function setupAdmin(password) {
  const log = (msg, type = 'info') => {
    console[type === 'error' ? 'error' : 'log'](msg);
    const el = document.getElementById('seed-log');
    if (el) {
      const line = document.createElement('p');
      line.className = `seed-line seed-${type}`;
      line.textContent = msg;
      el.appendChild(line);
    }
  };

  try {
    log('🔍 Verificando cuenta admin...');

    let uid;

    // Intentar login primero (si la cuenta ya existe)
    try {
      const { user } = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, password);
      uid = user.uid;
      log(`✅ Login exitoso. UID: ${uid}`);
    } catch (loginErr) {
      if (loginErr.code === 'auth/user-not-found' || loginErr.code === 'auth/invalid-credential') {
        // Crear cuenta nueva
        log('⚙️  Cuenta no encontrada. Creando...');
        const { user } = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, password);
        uid = user.uid;
        await updateProfile(user, { displayName: 'Admin Te-incluye' });
        log(`✅ Cuenta creada. UID: ${uid}`);
      } else {
        throw loginErr;
      }
    }

    // Verificar/crear documento en Firestore
    const userRef = doc(db, 'users', uid);
    const snap    = await getDoc(userRef);

    if (snap.exists()) {
      const current = snap.data();
      if (current.role !== 'admin') {
        await updateDoc(userRef, { role: 'admin', updatedAt: serverTimestamp() });
        log('✅ Rol actualizado a admin en Firestore');
      } else {
        log('✅ Usuario ya tiene role: admin en Firestore');
      }
    } else {
      await setDoc(userRef, {
        uid,
        name:         'Admin Te-incluye',
        email:        ADMIN_EMAIL.toLowerCase(),
        photoURL:     '',
        bio:          'Administrador de Corporación Te-incluye',
        cedula:       '',
        ubicacion:    '',
        discapacidad: '',
        role:         'admin',
        createdAt:    serverTimestamp(),
        updatedAt:    serverTimestamp()
      });
      log('✅ Documento admin creado en Firestore con role: admin');
    }

    log('');
    log('🎉 Setup completado. Ahora puedes ingresar a pages/admin.html', 'success');
    return true;

  } catch (err) {
    log(`❌ Error: ${err.message}`, 'error');
    console.error(err);
    return false;
  }
}
