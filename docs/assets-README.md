# 🖼️ Guía de Multimedia - Inclusión Conecta

> Instrucciones para gestionar imágenes y videos en la plataforma

---

## 📁 Estructura de Carpetas

```
assets/
├── 📂 images/
│   ├── 📂 featured/     # Imágenes para banner destacado (homepage)
│   │   └── banner-default.jpg
│   ├── 📂 gallery/      # Imágenes de la galería principal
│   │   ├── evento1.jpg
│   │   ├── taller1.jpg
│   │   └── ...
│   └── 📂 projects/     # Imágenes asociadas a proyectos
│       ├── rampas.jpg
│       ├── app.jpg
│       └── ...
│
└── 📂 videos/           # Videos locales (opcional, recomendado usar YouTube/Vimeo)
```

---

## 📸 Imágenes

### Especificaciones Recomendadas

| Uso | Resolución | Formato | Tamaño máx. | Ratio |
|-----|-----------|---------|-------------|-------|
| Banner destacado | 1920×600px | JPG/WebP | 500 KB | 16:5 |
| Galería | 1200×900px | JPG/WebP | 300 KB | 4:3 |
| Proyectos | 800×600px | JPG/WebP | 200 KB | 4:3 |
| Avatar/Iconos | 200×200px | PNG | 50 KB | 1:1 |

### Optimización

Antes de subir imágenes:
```bash
# Usar herramientas como:
• Squoosh.app (online, gratis)
• TinyPNG (compresión inteligente)
• ImageOptim (Mac) / FileOptimizer (Windows)

# Comandos CLI ejemplo:
cwebp input.jpg -q 80 -o output.webp
jpegoptim --max=80 input.jpg
```

### Nomenclatura de Archivos
```
✅ Recomendado:
evento-inauguracion-centro-2024.jpg
taller-accesibilidad-web-marzo.jpg
testimonio-maria-gonzalez.jpg

❌ Evitar:
IMG_20240315_123456.jpg
Screenshot 2024-03-15 at 12.34.56.png
foto1.jpg
```

### Agregar Imágenes desde el Admin

1. Ir a **Admin** → Iniciar sesión
2. Panel **Galería de Imágenes** → Click "Agregar"
3. Completar formulario:
   ```
   Título *: Nombre descriptivo de la imagen
   Descripción: Texto alternativo para accesibilidad
   Categoría: Eventos/Infraestructura/Capacitación/Testimonios
   URL *: Ruta relativa o URL completa
          • Local: assets/images/gallery/mi-foto.jpg
          • Externa: https://ejemplo.com/foto.jpg
   Destacado: ✓ Para mostrar en homepage
   ```
4. Click "Guardar"

> 💡 **Tip**: Las imágenes locales deben estar en la carpeta `assets/images/` antes de referenciarlas.

---

## 🎬 Videos

### Proveedores Soportados

| Proveedor | URL Ejemplo | Notas |
|-----------|-------------|-------|
| YouTube | `https://youtube.com/watch?v=ABC123` | ✅ Miniatura automática |
| YouTube Short | `https://youtu.be/ABC123` | ✅ Soportado |
| Vimeo | `https://vimeo.com/123456789` | ✅ Miniatura vía vumbnail.com |

### Especificaciones Recomendadas

| Parámetro | Valor Recomendado |
|-----------|------------------|
| Duración | 2-10 minutos (tutoriales), 30-90 seg (highlights) |
| Resolución | 1080p (1920×1080) mínimo |
| Formato de subida | MP4 (H.264) para YouTube, cualquier para Vimeo |
| Subtítulos | ✅ Recomendado para accesibilidad |
| Audio descriptivo | ✅ Recomendado para videos institucionales |

### Agregar Videos desde el Admin

1. Ir a **Admin** → Iniciar sesión
2. Panel **Galería de Videos** → Click "Agregar"
3. Completar formulario:
   ```
   Título *: Nombre del video
   Descripción: Resumen del contenido
   Categoría: Tutoriales/Eventos/Testimonios/Institucional
   Proveedor: YouTube / Vimeo
   URL del Video *: Pegar URL completa
   Video ID: Se auto-completa al validar URL
   Duración: Formato MM:SS (ej: 5:32)
   Vista Previa: Se genera automáticamente para YouTube
   Destacado: ✓ Para mostrar en homepage
   ```
4. Click "Guardar"

> ⚠️ **Importante**: Los videos se embeben vía iframe. Asegúrate de que:
> - El video sea público o no listado (no privado)
> - El proveedor permita embedding (configuración en YouTube/Vimeo)

### Configuración de Embed en YouTube

Para mejor experiencia de usuario:
```
1. Ir a YouTube Studio → Contenido → Seleccionar video
2. Configuración → Más opciones
3. Activar:
   ✓ Permitir incrustación
   ✓ Mostrar controles del reproductor
   ✓ Mostrar título del video
4. Opcional: Configurar pantalla final y tarjetas
```

---

## ♿ Accesibilidad en Multimedia

### Imágenes
```html
<!-- Siempre incluir alt descriptivo -->
✅ <img src="foto.jpg" alt="Persona en silla de ruedas usando rampa accesible">
❌ <img src="foto.jpg" alt="imagen1">
❌ <img src="foto.jpg"> <!-- Sin alt -->

<!-- Imágenes decorativas -->
<img src="decoracion.png" alt="" role="presentation">
```

### Videos
```
✅ Incluir subtítulos (SRT/VTT)
✅ Proporcionar transcripción textual
✅ Describir contenido visual relevante en audio
✅ Usar controles de video accesibles (nuestra plataforma lo hace automáticamente)
```

### Lightbox Accesible
Nuestro lightbox incluye:
- `role="dialog"` y `aria-modal="true"`
- Focus trap (no se puede tabular fuera del modal)
- Cierre con tecla Escape
- Botones con `aria-label` descriptivos
- Navegación por teclado (flechas para siguiente/anterior)

---

## 🔧 Solución de Problemas

### Imagen no se muestra
```
1. Verificar ruta:
   • Local: assets/images/gallery/foto.jpg
   • Debe ser relativa a index.html

2. Verificar permisos:
   • El archivo existe en la carpeta
   • Nombre coincide exactamente (case-sensitive en algunos servidores)

3. Verificar formato:
   • Extensión correcta (.jpg, .png, .webp)
   • Archivo no corrupto (abrir en visor de imágenes)

4. Debug en consola:
   • F12 → Console → Buscar errores 404
   • F12 → Network → Filtrar por "img" → Ver status
```

### Video no se reproduce
```
1. Verificar URL:
   • YouTube: https://youtube.com/watch?v=VIDEO_ID
   • Vimeo: https://vimeo.com/VIDEO_ID

2. Verificar configuración del video:
   • ¿Es público o no listado? (los privados no se pueden embed)
   • ¿Permite embedding? (YouTube Studio → Configuración)

3. Verificar consola:
   • Errores de CORS o políticas de contenido
   • Mensajes del proveedor (YouTube/Vimeo)

4. Probar URL directamente:
   • Abrir la URL en nueva pestaña
   • Si no carga allí, el problema es del video, no de la plataforma
```

### Miniatura de video no aparece
```
YouTube:
• Verificar que el VIDEO_ID sea correcto
• La miniatura se genera desde: https://img.youtube.com/vi/VIDEO_ID/hqdefault.jpg
• Si el video es muy nuevo, esperar 5-10 minutos para que YouTube genere miniaturas

Vimeo:
• Usar servicio: https://vumbnail.com/VIDEO_ID.jpg
• Algunos videos pueden no tener miniatura disponible públicamente

Fallback:
• La plataforma muestra placeholder si falla la miniatura
• Puedes especificar una miniatura personalizada en el campo "thumbnail" si es necesario
```

---

## 📦 Backup y Migración

### Exportar Multimedia References
```javascript
// En consola del navegador:
const galeria = Storage.get('inclusion_galeria');
const videos = Storage.get('inclusion_videos');

console.log('Imágenes:', galeria.map(g => g.url));
console.log('Videos:', videos.map(v => v.videoUrl));

// Exportar a JSON
exportAsJSON({galeria, videos}, 'multimedia-backup.json');
```

### Migrar a Nuevo Servidor
```
1. Copiar carpeta completa de assets/images/ y assets/videos/
2. Exportar datos desde Admin → Configuración → Exportar JSON
3. En nuevo servidor:
   • Pegar carpetas de multimedia
   • Importar JSON desde Admin → Configuración → Importar
4. Verificar que las rutas de imágenes sigan siendo válidas
```

---

## 🎨 Mejores Prácticas

### Para Imágenes
```
✅ Usar WebP cuando sea posible (mejor compresión)
✅ Incluir versión @2x para pantallas retina si es crítico
✅ Mantener consistencia en estilos (bordes, sombras vía CSS, no en la imagen)
✅ Usar nombres descriptivos en inglés o español sin espacios (kebab-case)
✅ Comprimir antes de subir (objetivo: <300KB para galería)
```

### Para Videos
```
✅ Subir primero a YouTube/Vimeo, luego embed (mejor rendimiento)
✅ Usar listas de reproducción para organizar contenido relacionado
✅ Incluir capítulo/timestamps en descripción para videos largos
✅ Probar en móvil: los controles deben ser táctiles y grandes
✅ Considerar versión con audio descriptivo para contenido institucional
```

### Para Accesibilidad
```
✅ Siempre texto alternativo significativo en imágenes
✅ Subtítulos en todos los videos (mínimo 95% de precisión)
✅ Transcripción textual disponible para contenido importante
✅ Contrastar texto sobre imágenes (usar overlay oscuro si es necesario)
✅ Probar con lector de pantalla: NVDA (Windows), VoiceOver (Mac/iOS)
```

---

## 📞 Soporte Técnico

```
📁 Ubicación multimedia: assets/images/ y assets/videos/
📄 Documentación principal: ../README.md

🔧 Problemas con rutas:
   • Verificar que index.html está en la raíz del proyecto
   • Las rutas en el admin son relativas a index.html

🖼️ Problemas con visualización:
   • Revisar consola del navegador (F12 → Console)
   • Verificar red (F12 → Network) para errores 404/CORS

💡 ¿Necesitas ayuda?
   • Revisar sección Troubleshooting en README.md principal
   • Reportar bugs con pasos para reproducir y capturas de pantalla
```

---

> 🎯 **Recordatorio**: La accesibilidad no es una feature, es un derecho. 
> Cada imagen y video que agregues impacta en la experiencia de personas con discapacidad. 
> ¡Gracias por construir inclusión! ♿✨
