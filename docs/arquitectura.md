# 🏗️ Arquitectura Técnica - Inclusión Conecta v2.0

> Documentación para desarrolladores sobre la estructura modular y patrones de diseño

---

## 📐 Diagrama de Arquitectura

```
┌─────────────────────────────────────────┐
│              index.html                  │
│  (HTML estructural + imports de módulos) │
└────────────────┬────────────────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
    ▼                         ▼
┌─────────┐           ┌─────────────┐
│  CSS    │           │   JS Modules│
│ Modules │           │   (ES6)     │
└────┬────┘           └──────┬──────┘
     │                       │
     ▼                       ▼
┌─────────┐           ┌─────────────┐
│Cascade  │           │   App       │
│Order:   │           │   Class     │
│01→09    │           │ (Orchestrator)│
└─────────┘           └──────┬──────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐ ┌──────────────┐ ┌─────────────────┐
│ Core Modules │ │ Feature      │ │ Admin Module    │
│              │ │ Modules      │ │                 │
│ • storage.js │ │ • galeria.js │ │ • auth.js       │
│ • utils.js   │ │ • videos.js  │ │ • admin.js      │
│ • theme.js   │ │ • registry.js│ │                 │
│ • navigation │ │              │ │                 │
└──────────────┘ └──────────────┘ └─────────────────┘
```

---

## 🔄 Flujo de Inicialización

```javascript
// 1. DOMContentLoaded event fires
document.addEventListener('DOMContentLoaded', () => {
  
  // 2. App.init() called from app.js
  app.init()
  
  // 3. Storage initialization
  initStorage()                    // Setup localStorage wrapper
  ensureDefaults(Storage, KEYS)    // Load default data if empty
  
  // 4. Core modules init (independent)
  Theme.init()                     // Load color scheme preference
  Navigation.init()                // Setup tabs and mobile menu
  
  // 5. Feature modules init (may depend on storage)
  Galeria.init()                   // Load images, bind events
  Videos.init()                    // Load videos, bind events
  Registry.init()                  // Bind registration form
  
  // 6. Admin module (checks auth internally)
  Admin.init()                     // Render login or dashboard
  
  // 7. Render dynamic homepage content
  app.renderHomepage()             // Hero, stats, featured items
  
  // 8. Bind global events
  app.bindGlobalEvents()           // Cross-module communication
  
  // 9. Dispatch ready event
  document.dispatchEvent('app:ready')
})
```

---

## 📦 Módulos JavaScript

### Core Modules (Independientes)

#### `storage.js` - Persistencia de Datos
```javascript
// Responsabilidad: Abstracción de localStorage con metadata
export const Storage = {
  get(key, fallback)    // Leer con fallback y version check
  set(key, value)       // Escribir con timestamp y versión
  remove(key)           // Eliminar item
  has(key)              // Verificar existencia
  clear()               // Limpiar datos de la app
  keys()                // Listar keys de la app
  getInfo()             // Stats de uso de almacenamiento
  exportData()          // Backup completo a objeto
  importData(data)      // Restore desde objeto
}

// Pattern: Singleton con métodos estáticos
// Dependencies: None
// Events emitted: None
```

#### `utils.js` - Funciones Helper
```javascript
// Responsabilidad: Funciones puras reutilizables
export const escapeHtml(str)      // XSS prevention
export const isValidEmail(email)  // Regex validation
export const showToast(msg, type) // Notification UI
export const debounce(fn, wait)   // Performance optimization
export const confirmDialog(msg)   // Accessible modal confirm

// Pattern: Named exports de funciones puras
// Dependencies: None (except DOM for showToast)
// Side effects: Minimal (DOM manipulation for toast)
```

#### `theme.js` - Gestión de Modo de Color
```javascript
// Responsabilidad: Toggle claro/oscuro con persistencia
export const Theme = {
  init()              // Load preference, bind toggle, listen for system changes
  set(theme)          // Apply theme to DOM, save preference
  toggle()            // Switch between dark/light
  get()               // Return current theme
  isDark()            // Boolean check
  updateToggle()      // Sync button UI with state
}

// Pattern: Module with internal state
// Dependencies: Storage, CSS variables
// Events emitted: 'theme:changed'
```

#### `navigation.js` - Navegación y Menús
```javascript
// Responsabilidad: Tabs, mobile menu, keyboard navigation
export const Navigation = {
  init()                      // Bind all event listeners
  activateTab(tabId)          // Switch visible section, update URL hash
  getCurrentTab()             // Return active tab ID
  openMobileMenu()            // Show overlay menu, lock scroll
  closeMobileMenu()           // Hide menu, restore scroll
  bindKeyboardNav()           // Arrow keys, Alt+1-5 shortcuts
}

// Pattern: Module with internal state (currentTab, mobileMenuOpen)
// Dependencies: DOM elements, CSS classes
// Events emitted: 'nav:tabChanged', 'nav:menuOpened', 'nav:menuClosed'
```

### Feature Modules (Dependen de Core)

#### `galeria.js` - Gestión de Imágenes
```javascript
// Responsabilidad: CRUD de imágenes + lightbox + filtros
export const Galeria = {
  // Data management
  loadItems()                 // From Storage or defaults
  saveItems()                 // To Storage
  applyFilter(category)       // Filter and re-render
  
  // Rendering
  render()                    // Main grid with pagination
  renderFilters()             // Category buttons
  renderPagination()          // Page numbers
  
  // Lightbox
  openLightbox(index)         // Show modal with image
  closeLightbox()             // Hide modal, cleanup
  bindLightboxNav()           // Prev/next buttons, keyboard
  
  // Admin integration
  openAdminModal(mode, id)    // Show add/edit form
  saveImage(formData)         // Validate, save, re-render
  deleteImage(id)             // Confirm, remove, re-render
  
  // Public API
  getFeatured(limit)          // For homepage preview
  search(query)               // Text search across items
}

// Pattern: Module with state (items, filteredItems, pagination)
// Dependencies: Storage, utils, data-defaults
// Events: None (direct DOM manipulation)
```

#### `videos.js` - Gestión de Videos
```javascript
// Similar structure to galeria.js with video-specific logic:
// - YouTube/Vimeo URL parsing and thumbnail generation
// - iframe embed with sandbox attributes for security
// - Duration formatting and provider detection

export const Videos = {
  // ... same pattern as Galeria
  extractYouTubeId(url)       // Parse video ID from various URL formats
  getYouTubeThumbnail(id)     // Generate thumbnail URL
  // ... rest of methods mirror Galeria with video adaptations
}
```

#### `registry.js` - Registro de Usuarios
```javascript
// Responsabilidad: Formulario de registro + validación + persistencia
export const Registry = {
  init()                      // Bind form submission and view button
  bindForm()                  // Validation, save to Storage, feedback
  bindViewRecords()           // Show stored registrations in admin preview
  getUsers(filters)           // Query with optional filters
  exportUsersCSV()            // Download as spreadsheet
  clearRegistrations()        // Admin-only bulk delete with confirmation
}

// Pattern: Form handler module
// Dependencies: Storage, utils (validation, showToast)
// Events emitted: 'registry:newUser', 'registry:cleared'
```

### Admin Module (Orquestador de Admin)

#### `admin.js` - Panel Administrativo
```javascript
// Responsabilidad: UI del admin + coordinación de módulos para gestión
export const Admin = {
  init()                      // Check auth, render appropriate view
  
  // Auth integration
  checkAuth()                 // Show login form or dashboard
  bindAuth()                  // Listen for login/logout events
  
  // Dashboard rendering
  renderDashboard(container)  // Main admin UI with stats and forms
  getStats()                  // Aggregate counts from all data stores
  
  // Content editor
  bindContentForm()           // Save hero/banner/stats updates
  
  // Gallery/Videos admin
  bindGalleryAdmin()          // Connect Galeria module to admin UI
  bindVideosAdmin()           // Connect Videos module to admin UI
  
  // Settings
  bindSettings()              // Update admin credentials
  bindDataManagement()        // Export/import/reset functionality
}

// Pattern: Controller module (coordinates other modules)
// Dependencies: Auth, Galeria, Videos, Storage, utils
// Events: Listens to auth events, dispatches content updates
```

---

## 🎨 Sistema de Diseño CSS

### Orden de Carga (Critical for Cascade)
```css
/* 01-variables.css  → Design tokens (must load first) */
/* 02-reset.css      → Base styles, accessibility foundation */
/* 03-layout.css     → Structural components (header, nav, footer) */
/* 04-components.css → Reusable UI patterns (cards, buttons, badges) */
/* 05-forms.css      → Form-specific styles (inputs, validation) */
/* 06-gallery.css    → Gallery grid, lightbox, filters */
/* 07-admin.css      → Admin panel specific styles */
/* 08-animations.css → Transitions, keyframes, toast */
/* 09-responsive.css → Media queries (must load last for overrides) */
```

### Variables CSS - Design Tokens
```css
/* Naming convention: --category-property-state */
:root {
  /* Colors */
  --color-bg-page: #fafafa;           /* Page background */
  --color-primary: #525252;           /* Main brand color */
  --color-primary-hover: #404040;     /* Hover state */
  
  /* Typography */
  --font-size-base: 1rem;             /* 16px base */
  --font-weight-semibold: 600;        /* For headings, buttons */
  
  /* Spacing */
  --space-4: 1rem;                    /* 16px standard gap */
  
  /* Effects */
  --shadow-lg: 0 8px 24px -4px rgb(0 0 0 / 0.1);
  --radius-lg: 20px;                  /* Card border radius */
  
  /* Interaction */
  --touch-target: 44px;               /* Minimum tap area */
  --transition: 150ms ease;           /* Standard animation duration */
}
```

### Mobile-First Approach
```css
/* Base styles = mobile styles */
.card {
  padding: var(--space-4);     /* 16px on mobile */
  grid-template-columns: 1fr;  /* Single column */
}

/* Tablet overrides */
@media (min-width: 640px) {
  .card {
    padding: var(--space-5);   /* 20px on tablet */
  }
}

/* Desktop overrides */
@media (min-width: 1024px) {
  .card {
    padding: var(--space-6);   /* 24px on desktop */
    grid-template-columns: repeat(3, 1fr);
  }
}
```

---

## 🔗 Comunicación entre Módulos

### Pattern: Custom Events
```javascript
// Module A emits event
document.dispatchEvent(new CustomEvent('moduleA:action', {
  detail: { data: 'payload' }
}));

// Module B listens for event
document.addEventListener('moduleA:action', (e) => {
  console.log('Received:', e.detail.data);
  // React to the event
});
```

### Events Registry
```javascript
// Core events
'theme:changed'        // { detail: { theme: 'dark'|'light' } }
'nav:tabChanged'       // { detail: { tabId: 'inicio'|'proyectos'|... } }
'nav:menuOpened'       // No detail
'nav:menuClosed'       // No detail

// Feature events
'registry:newUser'     // { detail: { nombre, email, fecha, ... } }
'registry:cleared'     // No detail
'content:updated'      // { detail: { hero, featured, stats } }

// Admin events
'auth:loginSuccess'    // No detail
'auth:logout'          // No detail
'admin:initialized'    // No detail

// App lifecycle
'app:ready'            // No detail (all modules initialized)
'app:destroy'          // No detail (for HMR/testing)
```

### Pattern: Direct Module References (for tight coupling)
```javascript
// In app.js (orchestrator), it's acceptable to call modules directly:
import { Galeria } from './galeria.js';

// When rendering homepage preview:
const featured = Galeria.getFeatured(3);
renderGalleryPreview(featured);

// Rationale: app.js is the composition root, 
// so direct dependencies are acceptable here.
```

---

## 🔐 Seguridad y Buenas Prácticas

### XSS Prevention
```javascript
// All user-generated content rendered via escapeHtml():
export const escapeHtml = (str) => {
  const div = document.createElement('div');
  div.textContent = str;  // Browser handles escaping
  return div.innerHTML;
};

// Usage in templates:
card.innerHTML = `<h3>${escapeHtml(userInput)}</h3>`;
```

### Input Validation
```javascript
// Client-side validation (UX, not security)
if (!isValidEmail(input.value)) {
  showToast('Email inválido', 'error');
  return;
}

// ⚠️ Server-side validation required for production!
// This app is client-side only; add backend for real security.
```

### Session Management
```javascript
// Simple session with expiration (demo only)
const session = {
  email: 'admin@...',
  loginAt: Date.now(),
  expires: Date.now() + 3600000  // 1 hour
};

// Check on each admin action:
if (Date.now() > session.expires) {
  Auth.logout();
  return;
}

// ⚠️ For production: Use JWT + server-side session validation
```

### Content Security Policy (Recommended for Production)
```html
<!-- Add to <head> of index.html for production -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' https://fonts.googleapis.com; 
               style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; 
               img-src 'self' data: https:; 
               frame-src https://www.youtube.com https://player.vimeo.com;">
```

---

## 🧪 Testing Strategy

### Unit Testing (Jest Example)
```javascript
// utils.test.js
import { escapeHtml, isValidEmail } from './utils.js';

test('escapeHtml prevents XSS', () => {
  expect(escapeHtml('<script>alert("xss")</script>'))
    .toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
});

test('isValidEmail validates correctly', () => {
  expect(isValidEmail('test@example.com')).toBe(true);
  expect(isValidEmail('invalid')).toBe(false);
});
```

### Integration Testing (Playwright Example)
```javascript
// navigation.spec.js
import { test, expect } from '@playwright/test';

test('tab navigation works', async ({ page }) => {
  await page.goto('index.html');
  
  // Click projects tab
  await page.click('[data-tab="proyectos"]');
  
  // Verify section is visible
  await expect(page.locator('#proyectos')).toBeVisible();
  await expect(page.locator('#proyectos')).toHaveAttribute('aria-hidden', 'false');
});
```

### Accessibility Testing (axe-core)
```javascript
// a11y.spec.js
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('homepage should be accessible', async ({ page }) => {
  await page.goto('index.html');
  
  const results = await new AxeBuilder({ page }).analyze();
  
  // Expect no critical violations
  expect(results.violations.filter(v => v.impact === 'critical')).toHaveLength(0);
});
```

---

## 🚀 Deployment Checklist

### Pre-Production
- [ ] Change default admin credentials in `data-defaults.js`
- [ ] Add Content Security Policy meta tag
- [ ] Enable HTTPS on hosting platform
- [ ] Set up automated backups of localStorage data
- [ ] Add analytics (privacy-respecting: Plausible, Fathom)
- [ ] Test on target devices (mobile, tablet, desktop)
- [ ] Run accessibility audit (WAVE, axe)
- [ ] Compress images in `assets/images/`

### Hosting Options
```bash
# Static hosting (recommended for this SPA):
• Netlify: Drag & drop folder, automatic HTTPS
• Vercel: git push deploy, edge functions available
• GitHub Pages: Free, simple, custom domain support
• Self-hosted: nginx/Apache with proper MIME types

# For dynamic features (future):
• Add Node.js/Express backend for user accounts
• Use Supabase/Firebase for real-time data sync
• Implement server-side rendering for SEO
```

### Environment Configuration
```javascript
// config.js (create from template)
export const CONFIG = {
  api: {
    baseUrl: process.env.API_URL || '/api',
    timeout: 30000
  },
  features: {
    enableAnalytics: process.env.ENABLE_ANALYTICS === 'true',
    enablePWA: process.env.ENABLE_PWA === 'true'
  },
  admin: {
    // Load from environment variables in production
    email: process.env.ADMIN_EMAIL,
    // Password should be hashed server-side
  }
};
```

---

## 🔄 Future Architecture Considerations

### Scaling to Multi-User
```
Current: Single-device, localStorage only
Future: 
• Add authentication backend (Auth0, Cognito, custom)
• Replace localStorage with API calls to database
• Implement real-time sync with WebSockets
• Add user roles and permissions
```

### Adding PWA Support
```javascript
// Register service worker in app.js
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(reg => console.log('SW registered:', reg.scope))
    .catch(err => console.log('SW failed:', err));
}

// sw.js would cache:
• index.html and critical CSS/JS
• Images with stale-while-revalidate strategy
• API responses with network-first for dynamic content
```

### Internationalization (i18n)
```javascript
// Add i18n module
export const i18n = {
  currentLocale: 'es',
  translations: {
    es: { /* ... */ },
    en: { /* ... */ }
  },
  t(key, params) { /* return translated string */ }
};

// Usage:
<h2>${i18n.t('hero.title')}</h2>

// Language switcher in header:
<select id="langSwitcher">
  <option value="es">Español</option>
  <option value="en">English</option>
</select>
```

---

## 📚 Recursos Adicionales

### Documentación de Tecnologías
- [CSS Custom Properties (MDN)](https://developer.mozilla.org/es/docs/Web/CSS/Using_CSS_custom_properties)
- [ES6 Modules (JavaScript.info)](https://javascript.info/modules)
- [ARIA Authoring Practices (W3C)](https://www.w3.org/WAI/ARIA/apg/)
- [Web Accessibility Initiative (WAI)](https://www.w3.org/WAI/)

### Herramientas de Desarrollo
- [CSS Variables Inspector (Chrome DevTools)](https://developer.chrome.com/docs/devtools/css/)
- [Lighthouse for Performance/A11y](https://developer.chrome.com/docs/lighthouse/overview/)
- [WebPageTest for Loading Analysis](https://www.webpagetest.org/)

### Patrones de Diseño
- [Module Pattern (Addy Osmani)](https://addyosmani.com/resources/essentialjsdesignpatterns/book/#modulepatternjavascript)
- [Pub/Sub Pattern for Event Communication](https://www.patterns.dev/vanilla/pubsub-pattern/)
- [Composition over Inheritance](https://javascript.info/mixins)

---

> 🎯 **Principio Rector**: "La simplicidad es la máxima sofisticación" — Leonardo da Vinci
> 
> Mantén la arquitectura modular, la documentación actualizada, y la accesibilidad como prioridad.

**Última actualización**: Mayo 2024 · Inclusión Conecta v2.0
