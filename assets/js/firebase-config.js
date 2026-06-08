/**
 * Configuración de Firebase para Te-incluye
 * Versión Firebase: 10.8.0
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp, collection, getDocs, addDoc, query, orderBy, limit, getCountFromServer }
  from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  updateEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBXexiPHuOYXVNbB7-qDmn6WH3jDr0HEIc",
  authDomain: "te-incluye.firebaseapp.com",
  projectId: "te-incluye",
  storageBucket: "te-incluye.firebasestorage.app",
  messagingSenderId: "322105066683",
  appId: "1:322105066683:web:77c60b21b09bc27c0b959e"
};

const app = initializeApp(firebaseConfig);

export const db      = getFirestore(app);
export const auth    = getAuth(app);
export const storage = getStorage(app);

// Auth functions
export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  updateEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
};

// Firestore helpers
export { doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp, collection, getDocs, addDoc, query, orderBy, limit, getCountFromServer };

// Storage helpers
export { ref, uploadBytes, getDownloadURL, deleteObject };

if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  console.log('✅ Firebase inicializado: te-incluye');
}
