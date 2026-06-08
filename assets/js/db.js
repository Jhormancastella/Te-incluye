/**
 * Abstracción de Firestore para operaciones CRUD
 * Maneja colecciones principales: galeria, videos, proyectos, recursos, stats, registry
 * 
 * Nota: Usamos CDN ESM para compatibilidad con módulos nativos del navegador
 */

// Imports desde CDN de Firebase (ESM compatible)
import { db } from "./firebase-config.js";
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  limit, 
  where, 
  getDoc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/**
 * Servicio de base de datos con operaciones comunes
 */
export const firestore = {
  /**
   * Obtener todos los documentos de una colección ordenados
   * @param {string} collectionName - Nombre de la colección
   * @param {string} orderByField - Campo para ordenar (default: createdAt)
   * @param {string} orderDir - Dirección: 'asc' o 'desc' (default: 'desc')
   * @param {number} maxResults - Límite de resultados (opcional)
   */
  async getAll(collectionName, orderByField = "createdAt", orderDir = "desc", maxResults = null) {
    let snapshot;
    try {
      let q = query(collection(db, collectionName), orderBy(orderByField, orderDir));
      if (maxResults) q = query(q, limit(maxResults));
      snapshot = await getDocs(q);
    } catch (error) {
      console.warn(`No se pudo ordenar ${collectionName} por ${orderByField}; cargando sin orden.`, error.message);
      let q = collection(db, collectionName);
      if (maxResults) q = query(q, limit(maxResults));
      snapshot = await getDocs(q);
    }
    return snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      // Normalizar timestamps
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt
    }));
  },

  /**
   * Obtener un documento por ID
   */
  async getById(collectionName, id) {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
    };
  },

  /**
   * Agregar nuevo documento
   * @param {string} collectionName - Nombre de la colección
   * @param {Object} data - Datos a guardar
   * @returns {string} ID del documento creado
   */
  async add(collectionName, data) {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  },

  /**
   * Actualizar documento existente
   */
  async update(collectionName, id, data) {
    return updateDoc(doc(db, collectionName, id), {
      ...data,
      updatedAt: serverTimestamp()
    });
  },

  /**
   * Eliminar documento
   */
  async delete(collectionName, id) {
    return deleteDoc(doc(db, collectionName, id));
  },

  /**
   * Búsqueda con filtros básicos
   */
  async search(collectionName, filters, orderByField = "createdAt", orderDir = "desc") {
    let q = collection(db, collectionName);
    
    // Aplicar filtros where
    if (filters?.field && filters?.value && filters?.operator) {
      q = query(q, where(filters.field, filters.operator, filters.value));
    }
    
    q = query(q, orderBy(orderByField, orderDir));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
    }));
  },

  /**
   * Colecciones disponibles en el proyecto
   */
  collections: {
    GALLERY: "galeria",
    VIDEOS: "videos", 
    PROJECTS: "proyectos",
    STATS: "stats",
    REGISTRY: "registry",
    CONFIG: "config",
    RESOURCES: "recursos",
    USERS: "users",
    ROLE_REQUESTS: "roleRequests"
  }
};

// Helper para manejar errores de Firebase
export const handleFirebaseError = (error) => {
  console.error("Firebase Error:", error.code, error.message);
  
  const messages = {
    // Firestore
    "permission-denied": "No tienes permisos para realizar esta acción",
    "not-found": "El recurso solicitado no existe",
    "already-exists": "Este elemento ya existe",
    "resource-exhausted": "Límite de operaciones excedido, intenta más tarde",
    "unavailable": "Servicio no disponible, verifica tu conexión",
    // Auth
    "auth/invalid-email": "El correo electrónico no es válido",
    "auth/user-not-found": "No existe una cuenta con ese correo",
    "auth/wrong-password": "Contraseña incorrecta",
    "auth/invalid-credential": "Correo o contraseña incorrectos",
    "auth/too-many-requests": "Demasiados intentos fallidos. Intenta más tarde",
    "auth/user-disabled": "Esta cuenta ha sido deshabilitada",
    "auth/network-request-failed": "Error de red. Verifica tu conexión a internet",
    "auth/email-already-in-use": "Este correo ya está registrado"
  };
  
  return messages[error.code] || `Error: ${error.message}`;
};
