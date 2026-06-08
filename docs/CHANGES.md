# 📋 Registro de Cambios - Te-incluye v2.1

> Fecha: Mayo 2026  
> Versión: 2.1.0

---

## ✅ Cambios Realizados

### 📧 Contacto en Footers
**Archivos afectados:** Todos los HTML (`index.html`, `galeria.html`, `videos.html`, `proyectos.html`, `recursos.html`, `historia.html`, `admin.html`)

**Cambio:** Se agregó el email de contacto `teincluye222@gmail.com` en el footer de cada página con enlace `mailto:` y accesibilidad ARIA.

```html
<p style="margin-block-start: var(--space-2);">
  <a href="mailto:teincluye222@gmail.com" style="color: var(--color-primary); text-decoration: none;">
    <i class="fas fa-envelope" aria-hidden="true"></i> teincluye222@gmail.com
  </a>
</p>
```

### 🏳️ Bandera del Orgullo de la Discapacidad
**URL de la imagen:** `https://pbs.twimg.com/media/GJO5gNiWsAAV6pL.jpg`

**Ubicaciones:**
1. `historia.html` - Hero section (imagen principal)
2. `assets/js/seed-data.js` - Agregada a `gallerySeed` como imagen destacada

**Texto alternativo (accesibilidad):**
> "Bandera del orgullo de la discapacidad: símbolo de identidad, dignidad y diversidad para la comunidad con discapacidad"

### 🎬 Videos de YouTube Actualizados
**Archivos afectados:** `assets/js/seed-data.js`

**Videos agregados a la colección `videosSeed`:**

| Título | Video ID | Embed URL | Destacado |
|--------|----------|-----------|-----------|
| Historias que inspiran: Inclusión laboral | `hJs3lx9P0CA` | `https://www.youtube.com/embed/hJs3lx9P0CA` | ✅ Sí |
| Tecnología asistiva: Rompiendo barreras | `esMq3cqxNsA` | `https://www.youtube.com/embed/esMq3cqxNsA` | ❌ No |
| Deporte adaptado: Fuerza y comunidad | `sJTgCFOuQGw` | `https://www.youtube.com/embed/sJTgCFOuQGw` | ✅ Sí |

**Nota:** Todos los videos incluyen thumbnails automáticos de YouTube y descripciones relevantes.

### 📱 Optimizaciones Responsive Móvil
**Archivo afectado:** `assets/css/layout.css`

**Mejoras implementadas para pantallas <480px:**

```css
@media (max-width: 479px) {
  /* Contenedores */
  .container { padding-inline: var(--space-3); }
  
  /* Hero section */
  .hero { padding-block: var(--space-12) var(--space-8); }
  .hero-title { font-size: var(--font-size-2xl); }
  
  /* Secciones */
  .section { padding-block: var(--space-8); }
  .section-title { font-size: var(--font-size-xl); }
  
  /* Botones */
  .btn-lg { 
    padding: var(--space-3) var(--space-4); 
    min-height: 48px; /* Touch target mínimo */
  }
  
  /* Tarjetas */
  .card { padding: var(--space-4); }
  
  /* Footer móvil */
  .footer-content { 
    grid-template-columns: 1fr; 
    text-align: center; 
  }
  
  /* Componentes modales */
  .modal { max-width: 100vw; margin: var(--space-2); }
  .lightbox-nav { left/right: 10px; } /* Posición en móvil */
}
```

### 📚 Documentación Actualizada
**Archivo:** `README.md`

- Agregado email de contacto en el header
- Nueva sección "🔄 Actualizaciones Recientes" con changelog detallado
- Enlaces de contacto accesibles

---

## 🔧 Cómo Ver los Cambios

### 1. Cargar Datos de Prueba en Firebase
```javascript
// 1. Abrir admin.html y autenticarse
// 2. Abrir consola del navegador (F12)
// 3. Ejecutar:
await import('./assets/js/seed-data.js').then(m => m.seedTestData())
```

### 2. Verificar en Navegador
| Página | Qué verificar |
|--------|--------------|
| `index.html` | Footer con email, contenido destacado |
| `historia.html` | Bandera del orgullo en hero section |
| `galeria.html` | Imagen de bandera en galería, filtros responsive |
| `videos.html` | Nuevos videos de YouTube, reproductor accesible |
| `admin.html` | Footer con email, gestión de destacados |

### 3. Probar Responsive Móvil
- Abrir DevTools → Toggle Device Toolbar
- Seleccionar viewport <480px (iPhone SE, Pixel 2, etc.)
- Verificar:
  - [ ] Navegación por teclado funcional
  - [ ] Touch targets ≥44px
  - [ ] Texto legible sin zoom
  - [ ] Footer centrado y accesible

---

## ⚠️ Consideraciones Técnicas

### Imágenes Externas
- La bandera del orgullo (`pbs.twimg.com`) se carga vía CDN externo
- Se recomienda descargar y alojar en Firebase Storage para producción
- El atributo `alt` garantiza accesibilidad si la imagen no carga

### Videos de YouTube
- Los embeds usan iframes responsivos con `aspect-ratio: 16/9`
- Se recomienda habilitar `controls=1&modestbranding=1&rel=0` en producción
- Los subtítulos dependen de la configuración original del video en YouTube

### Firebase Security Rules
Antes de deploy a producción, configurar reglas en Firestore Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Lectura pública para contenido
    match /{document=**} {
      allow read: if true;
      // Escritura solo para usuarios autenticados
      allow write: if request.auth != null;
    }
  }
}
```

---

## 🎯 Próximos Pasos Recomendados

1. **Testing de accesibilidad:** Ejecutar Lighthouse → Accessibility (objetivo: ≥95)
2. **Optimización de imágenes:** Convertir a WebP y usar `srcset` para responsive images
3. **PWA:** Agregar `manifest.json` y service worker para soporte offline
4. **Analytics:** Integrar Firebase Analytics o Plausible para métricas de uso
5. **i18n:** Preparar estructura para múltiples idiomas (es/en)

---

> 💡 **Nota:** Todos los cambios mantienen compatibilidad con la arquitectura existente y no requieren migración de datos. Los nuevos contenidos se agregan vía `seed-data.js` sin sobrescribir información existente.

**Contacto para soporte:** [teincluye222@gmail.com](mailto:teincluye222@gmail.com) 🤝
