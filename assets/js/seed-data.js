/**
 * Script de seed de datos de prueba para Firebase
 * Ejecutar desde consola del navegador en pages/admin.html después de autenticarse
 * 
 * Nota: Usamos CDN ESM para compatibilidad con módulos nativos del navegador
 * Uso: 
 * 1. Ir a pages/admin.html y loguearse
 * 2. Abrir consola (F12)
 * 3. Pegar este código y ejecutar: await seedTestData()
 */

// Imports desde CDN de Firebase (ESM compatible)
import { db } from './firebase-config.js';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  doc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Datos de prueba para Galería
const gallerySeed = [
  {
    title: "Bandera del orgullo de la discapacidad",
    category: "comunidad",
    image: "https://pbs.twimg.com/media/GJO5gNiWsAAV6pL.jpg",
    alt: "Bandera del orgullo de la discapacidad: símbolo de identidad, dignidad y diversidad para la comunidad con discapacidad",
    description: "La bandera del orgullo de la discapacidad representa la identidad colectiva y el movimiento por los derechos humanos",
    featured: true,
    createdAt: new Date().toISOString()
  },
  {
    title: "Celebrando la diversidad",
    category: "eventos",
    image: "https://images.unsplash.com/photo-1573497620643-d3da7db1a583?w=800&h=600&fit=crop",
    alt: "Grupo diverso de personas celebrando juntas, incluyendo personas con discapacidad",
    description: "Evento comunitario de inclusión en Bogotá, Colombia",
    featured: true,
    createdAt: new Date().toISOString()
  },
  {
    title: "Accesibilidad en acción",
    category: "proyectos",
    image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&h=600&fit=crop",
    alt: "Persona en silla de ruedas utilizando rampa accesible en espacio público",
    description: "Implementación de rampas y señalización táctil en parque municipal",
    featured: false,
    createdAt: new Date().toISOString()
  },
  {
    title: "Testimonio: María",
    category: "testimonios",
    image: "https://images.unsplash.com/photo-1543352634-a1c51d9f1fa7?w=800&h=600&fit=crop",
    alt: "Mujer sonriente con discapacidad visual participando en taller comunitario",
    description: "María comparte su experiencia de inclusión laboral en el sector tecnológico",
    featured: true,
    createdAt: new Date().toISOString()
  },
  {
    title: "Deporte inclusivo",
    category: "comunidad",
    image: "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800&h=600&fit=crop",
    alt: "Equipo de baloncesto en silla de ruedas entrenando en cancha adaptada",
    description: "Liga municipal de baloncesto adaptado promueve salud y comunidad",
    featured: false,
    createdAt: new Date().toISOString()
  },
  {
    title: "Educación para todos",
    category: "proyectos",
    image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&h=600&fit=crop",
    alt: "Aula inclusiva con estudiantes diversos y materiales adaptados",
    description: "Programa de educación inclusiva en escuelas públicas de Medellín",
    featured: true,
    createdAt: new Date().toISOString()
  },
  {
    title: "Arte sin barreras",
    category: "eventos",
    image: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&h=600&fit=crop",
    alt: "Exposición de arte con obras táctiles y descripciones en braille",
    description: "Muestra artística accesible con audioguías y recorridos con intérprete de lengua de señas",
    featured: false,
    createdAt: new Date().toISOString()
  }
];

// Datos de prueba para Videos
const videosSeed = [
  {
    title: "Historias que inspiran: Inclusión laboral",
    platform: "youtube",
    videoUrl: "https://www.youtube.com/embed/hJs3lx9P0CA",
    thumbnail: "https://img.youtube.com/vi/hJs3lx9P0CA/maxresdefault.jpg",
    description: "Documental sobre empresas colombianas que lideran la inclusión laboral de personas con discapacidad",
    featured: true,
    createdAt: new Date().toISOString()
  },
  {
    title: "Tecnología asistiva: Rompiendo barreras",
    platform: "youtube",
    videoUrl: "https://www.youtube.com/embed/esMq3cqxNsA",
    thumbnail: "https://img.youtube.com/vi/esMq3cqxNsA/maxresdefault.jpg",
    description: "Exploramos las últimas innovaciones en tecnología asistiva desarrolladas en Colombia",
    featured: false,
    createdAt: new Date().toISOString()
  },
  {
    title: "Deporte adaptado: Fuerza y comunidad",
    platform: "youtube",
    videoUrl: "https://www.youtube.com/embed/sJTgCFOuQGw",
    thumbnail: "https://img.youtube.com/vi/sJTgCFOuQGw/maxresdefault.jpg",
    description: "Atletas paralímpicos colombianos comparten sus historias de superación",
    featured: true,
    createdAt: new Date().toISOString()
  },
  {
    title: "Accesibilidad digital: Web para todos",
    platform: "youtube",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    description: "Tutorial práctico sobre cómo crear sitios web accesibles siguiendo WCAG 2.1",
    featured: false,
    createdAt: new Date().toISOString()
  }
];

// Datos de prueba para Proyectos
const projectsSeed = [
  {
    title: "Rutas Accesibles Medellín",
    location: "Medellín, Antioquia",
    category: "cultura",
    image: "https://images.unsplash.com/photo-1561070791519-389dc1e8215a?w=800&h=600&fit=crop",
    description: "Mapeo colaborativo de rutas accesibles en el centro de Medellín, con información sobre rampas, semáforos sonoros y baños adaptados.",
    link: "https://rutasaccesibles.medellin.gov.co",
    featured: true,
    createdAt: new Date().toISOString()
  },
  {
    title: "Empleo Inclusivo Bogotá",
    location: "Bogotá, Cundinamarca",
    category: "empleo",
    image: "https://images.unsplash.com/photo-1521737852567-6949f3f9f2b5?w=800&h=600&fit=crop",
    description: "Programa de intermediación laboral que conecta empresas con talento diverso, ofreciendo capacitación y acompañamiento en procesos de selección inclusivos.",
    link: "https://empleoinclusivo.bogota.gov.co",
    featured: true,
    createdAt: new Date().toISOString()
  },
  {
    title: "Salud Sin Barreras",
    location: "Cali, Valle del Cauca",
    category: "salud",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=600&fit=crop",
    description: "Red de IPS con protocolos de atención accesible, intérpretes de lengua de señas y materiales en formatos alternativos para personas con discapacidad.",
    link: null,
    featured: false,
    createdAt: new Date().toISOString()
  },
  {
    title: "Aulas Inclusivas",
    location: "Barranquilla, Atlántico",
    category: "educacion",
    image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&h=600&fit=crop",
    description: "Capacitación docente y dotación de materiales adaptados para implementar educación inclusiva en 50 instituciones educativas públicas.",
    link: "https://aulasinclusivas.barranquilla.gov.co",
    featured: true,
    createdAt: new Date().toISOString()
  },
  {
    title: "Deporte Para Todos",
    location: "Cartagena, Bolívar",
    category: "deporte",
    image: "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800&h=600&fit=crop",
    description: "Liga municipal de deportes adaptados con disciplinas como baloncesto en silla de ruedas, natación adaptada y atletismo paralímpico.",
    link: null,
    featured: false,
    createdAt: new Date().toISOString()
  },
  {
    title: "Cultura Accesible",
    location: "Manizales, Caldas",
    category: "cultura",
    image: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&h=600&fit=crop",
    description: "Programa de accesibilidad en teatros y museos con audiodescripción, subtitulado en tiempo real y recorridos táctiles.",
    link: "https://culturaaccesible.manizales.gov.co",
    featured: false,
    createdAt: new Date().toISOString()
  }
];

// Datos de prueba para Recursos
const resourcesSeed = [
  {
    title: "Guía de Derechos de las Personas con Discapacidad",
    category: "derechos",
    icon: "fas fa-scale-balanced",
    description: "Documento completo sobre derechos fundamentales, mecanismos de protección y rutas de atención en Colombia.",
    link: "https://www.minjusticia.gov.co/portals/0/MJD/Derechos%20Humanos/Guia_Derechos_PcD.pdf",
    featured: true,
    createdAt: new Date().toISOString()
  },
  {
    title: "Directorio de IPS con Atención Accesible",
    category: "salud",
    icon: "fas fa-heart",
    description: "Listado actualizado de instituciones de salud con protocolos de atención accesible y personal capacitado.",
    link: "https://www.minsalud.gov.co/salud/publica/PET/Paginas/Discapacidad.aspx",
    featured: true,
    createdAt: new Date().toISOString()
  },
  {
    title: "Manual de Ajustes Razonables en el Trabajo",
    category: "empleo",
    icon: "fas fa-briefcase",
    description: "Guía práctica para empleadores sobre cómo implementar ajustes razonables para empleados con discapacidad.",
    link: "https://www.mintrabajo.gov.co/documents/20147/0/Guia+Ajustes+Razonables.pdf",
    featured: false,
    createdAt: new Date().toISOString()
  },
  {
    title: "Recursos de Tecnología Asistiva",
    category: "tecnologia",
    icon: "fas fa-laptop-code",
    description: "Catálogo de software y hardware de apoyo con información de acceso, costos y proveedores en Colombia.",
    link: "https://www.mintic.gov.co/portal/604/w3-propertyvalue-25987.html",
    featured: true,
    createdAt: new Date().toISOString()
  },
  {
    title: "Organizaciones de Personas con Discapacidad",
    category: "comunidad",
    icon: "fas fa-users",
    description: "Directorio de organizaciones, colectivos y redes de apoyo liderados por personas con discapacidad.",
    link: "#",
    featured: false,
    createdAt: new Date().toISOString()
  },
  {
    title: "Guía de Accesibilidad Web WCAG 2.1",
    category: "tecnologia",
    icon: "fas fa-code",
    description: "Manual práctico para desarrolladores sobre cómo implementar estándares de accesibilidad en sitios web.",
    link: "https://www.w3.org/WAI/WCAG21/quickref/",
    featured: false,
    createdAt: new Date().toISOString()
  }
];

// Datos de prueba para Configuración del Hero
const heroSeed = {
  id: 'hero-config',
  title: "Inclusión que transforma vidas",
  subtitle: "Corporación Te-incluye: visibilizamos, conectamos y potenciamos iniciativas para personas con discapacidad en Colombia.",
  updatedAt: new Date().toISOString()
};

/**
 * Función principal para cargar datos de prueba
 */
export async function seedTestData() {
  try {
    console.log('🌱 Iniciando carga de datos de prueba...');
    
    // Limpiar datos existentes (opcional - comentar si no se desea borrar)
    // await clearCollections();
    
    // Cargar datos por colección
    await seedCollection('gallery', gallerySeed);
    await seedCollection('videos', videosSeed);
    await seedCollection('projects', projectsSeed);
    await seedCollection('resources', resourcesSeed);
    
    // Configurar hero
    await seedHero();
    
    console.log('✅ Datos de prueba cargados exitosamente!');
    console.log('📊 Resumen:');
    console.log(`   - Galería: ${gallerySeed.length} imágenes`);
    console.log(`   - Videos: ${videosSeed.length} videos`);
    console.log(`   - Proyectos: ${projectsSeed.length} proyectos`);
    console.log(`   - Recursos: ${resourcesSeed.length} recursos`);
    console.log(`   - Hero: 1 configuración`);
    console.log('\n🔄 Recarga la página para ver los cambios');
    
    return true;
  } catch (error) {
    console.error('❌ Error cargando datos de prueba:', error);
    throw error;
  }
}

/**
 * Cargar datos en una colección específica
 */
async function seedCollection(collectionName, items) {
  console.log(`📦 Cargando ${items.length} items en "${collectionName}"...`);
  
  for (const item of items) {
    try {
      await addDoc(collection(db, collectionName), item);
    } catch (error) {
      console.warn(`⚠️ No se pudo agregar item a ${collectionName}:`, error.message);
    }
  }
}

/**
 * Configurar el hero de la homepage
 */
async function seedHero() {
  console.log('🎨 Configurando hero de homepage...');
  try {
    // Usar un documento con ID fijo para facilitar la actualización
    await addDoc(collection(db, 'config'), {
      type: 'hero',
      ...heroSeed
    });
  } catch (error) {
    console.warn('⚠️ No se pudo configurar el hero:', error.message);
  }
}

/**
 * (Opcional) Limpiar todas las colecciones - USAR CON PRECAUCIÓN
 */
export async function clearCollections() {
  const collections = ['gallery', 'videos', 'projects', 'resources', 'config', 'registry'];
  
  for (const colName of collections) {
    console.log(`🗑️ Limpiando colección: ${colName}`);
    const snapshot = await getDocs(collection(db, colName));
    for (const docSnap of snapshot.docs) {
      await deleteDoc(doc(db, colName, docSnap.id));
    }
  }
  console.log('✅ Colecciones limpiadas');
}

// Hacer disponible globalmente para ejecutar desde consola
if (typeof window !== 'undefined') {
  window.seedTestData = seedTestData;
  window.clearCollections = clearCollections;
}
