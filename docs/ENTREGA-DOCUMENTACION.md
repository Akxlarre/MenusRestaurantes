# Entrega para documentación – Menu (Mini wok)

Este documento reúne la información del proyecto en el orden de prioridad solicitado, para que puedas generar la documentación técnica, funcional y de API.

---

## 1. Estructura del proyecto

### Árbol de directorios y archivos

```
Menu/
├── .env.example
├── .gitignore
├── .vscode/
│   ├── extensions.json
│   └── launch.json
├── astro.config.mjs
├── package-lock.json
├── package.json
├── public/
│   ├── favicon.ico
│   ├── favicon.svg
│   └── hero-zen-bg.jpg
├── README.md
├── src/
│   ├── assets/
│   │   ├── astro.svg
│   │   └── background.svg
│   ├── components/
│   │   ├── admin/
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── CategoriesList.tsx
│   │   │   ├── CategoriesPage.tsx
│   │   │   ├── CategoryForm.tsx
│   │   │   ├── CreateProductPage.tsx
│   │   │   ├── DashboardHome.tsx
│   │   │   ├── LanguageToggle.tsx
│   │   │   ├── LoginForm.tsx
│   │   │   ├── MenuList.tsx
│   │   │   ├── ProductForm.tsx
│   │   │   ├── QRGenerator.tsx
│   │   │   └── QRPage.tsx
│   │   ├── public/
│   │   │   ├── Hero.astro
│   │   │   ├── MenuCard.astro
│   │   │   ├── ProductNavbar.astro
│   │   │   ├── PublicNavbar.astro
│   │   │   ├── RealtimeMenu.astro
│   │   │   └── SakuraPetals.astro
│   │   └── Welcome.astro
│   ├── layouts/
│   │   └── Layout.astro
│   ├── lib/
│   │   ├── imageUtils.ts
│   │   └── supabase.ts
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── categories.astro
│   │   │   ├── create.astro
│   │   │   ├── dashboard.astro
│   │   │   ├── login.astro
│   │   │   └── qr.astro
│   │   ├── index.astro
│   │   └── menu/
│   │       └── [id].astro
│   ├── stores/
│   │   ├── authStore.ts
│   │   └── i18nStore.ts
│   ├── styles/
│   │   ├── global.css
│   │   └── theme.css
│   └── (no hay carpeta config/)
├── tsconfig.json
└── docs/
    └── ENTREGA-DOCUMENTACION.md  (este archivo)
```

**Nota:** No existe carpeta `config/`. La configuración está en `astro.config.mjs`, `tsconfig.json` y variables de entorno.

---

## 2. Archivos de configuración y package.json

### package.json

- **Nombre:** menu  
- **Versión:** 0.0.1  
- **Tipo:** module  
- **Scripts:** `dev`, `build`, `preview`, `astro`  
- **Dependencias principales:**  
  Astro 5, React 19, Supabase JS, Tailwind v4, DaisyUI, GSAP, jsPDF, qrcode, nanostores, zod (incluido pero no usado en el código).  
- **Adapter:** `@astrojs/vercel` (output: server).

### Configuración principal

- **astro.config.mjs:** adapter Vercel, output server, integración React, Tailwind v4, prefetch hover.
- **tsconfig.json:** extiende `astro/tsconfigs/strict`, JSX React.
- **.env.example:**  
  `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY` (crear `.env` local a partir de este archivo).

### .gitignore

Excluye: `dist/`, `.astro/`, `node_modules/`, logs, `.env`, `.env.production`, `.DS_Store`, `.idea/`, `.vercel/`.

---

## 3. Modelos de datos y base de datos

No hay migraciones ni carpeta `supabase/` en el repo. El esquema se infiere del uso de Supabase en el código.

### Tablas y relaciones inferidas

| Tabla | Campos usados en código | Notas |
|-------|--------------------------|--------|
| **categories** | id, name_es, name_zh, slug, display_order, created_at, updated_at | Orden: display_order ASC |
| **menu_items** | id, name_es, name_zh, description_es, description_zh, price, image_url, is_available | Productos del menú |
| **menu_item_categories** | menu_item_id, category_id | N:M entre menu_items y categories |

### Storage Supabase

- **Bucket:** `menu-images`  
- Uso: subida de imágenes de productos (WebP). URLs públicas para `image_url` en `menu_items`.

### Esquema SQL sugerido (para documentación)

```sql
-- Ejemplo conceptual; las tablas reales están en Supabase.
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_es TEXT NOT NULL,
  name_zh TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_es TEXT NOT NULL,
  name_zh TEXT NOT NULL,
  description_es TEXT,
  description_zh TEXT,
  price NUMERIC NOT NULL CHECK (price >= 0),
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE menu_item_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  UNIQUE(menu_item_id, category_id)
);

-- Índices sugeridos
CREATE INDEX idx_menu_item_categories_menu_item ON menu_item_categories(menu_item_id);
CREATE INDEX idx_menu_item_categories_category ON menu_item_categories(category_id);
```

No hay seeds ni diagramas ER en el repositorio.

---

## 4. Rutas / Páginas (equivalente a controladores)

Astro usa file-based routing. No hay API REST propia; la lógica de datos va en páginas (SSR) y en componentes React que llaman a Supabase desde el cliente.

| Ruta | Archivo | Descripción |
|------|---------|-------------|
| `/` | src/pages/index.astro | Home: menú público por categorías, Hero, RealtimeMenu |
| `/menu/[id]` | src/pages/menu/[id].astro | Detalle de producto (id = UUID) |
| `/admin/login` | src/pages/admin/login.astro | Login admin (Supabase Auth) |
| `/admin/dashboard` | src/pages/admin/dashboard.astro | Dashboard: listado de productos |
| `/admin/categories` | src/pages/admin/categories.astro | CRUD categorías |
| `/admin/create` | src/pages/admin/create.astro | Crear/editar producto (?edit=id) |
| `/admin/qr` | src/pages/admin/qr.astro | Generador de QR y PDF |

No hay endpoints tipo `/api/*` en el proyecto.

---

## 5. Servicios y lógica de negocio

### src/lib/supabase.ts

- Crea el cliente de Supabase con `PUBLIC_SUPABASE_URL` y `PUBLIC_SUPABASE_ANON_KEY`.  
- Usado en páginas (SSR) y en componentes React para todas las operaciones de datos y auth.

### src/lib/imageUtils.ts

- **compressImage(file, options):** comprime/redimensiona imagen y la convierte a WebP (canvas).  
- **formatFileSize(bytes):** formatea tamaño para mostrar.  
- **supportsWebP():** detección de soporte WebP en el navegador.  
- Uso principal: subida de imágenes en el formulario de productos (ProductForm).

### Lógica de negocio repartida en componentes

- **Auth:** Login (LoginForm), comprobación de sesión y redirección a `/admin/login` (AdminLayout), logout.  
- **Productos:** Alta/edición con categorías e imagen (ProductForm), listado con filtros/orden (MenuList), toggle disponibilidad, actualización de precio, borrado (incluye borrado de imagen en storage).  
- **Categorías:** CRUD en CategoriesList y CategoryForm; slug único (error 23505); display_order auto-incremental al crear.  
- **QR:** Generación de QR con URL del sitio y descarga de PDF con 6 códigos (QRGenerator).  
- **Realtime:** Suscripción a `postgres_changes` en `menu_items` (UPDATE) para actualizar disponibilidad y precio en la vista pública (RealtimeMenu.astro).

---

## 6. Middleware y utilidades

- **Middleware:** No hay middleware de Astro ni Express; la protección de rutas admin es en cliente (AdminLayout comprueba sesión y redirige a `/admin/login`).  
- **Utilidades:** imageUtils (ver arriba).  
- **Validación:** No se usa Zod en el código; validación básica por `required` y `type="number"` en formularios y comprobaciones en cliente (ej. al menos una categoría en producto).

---

## 7. Frontend

### Componentes principales

- **Layout:** Layout.astro (HTML base, fuentes, ViewTransitions, global.css).  
- **Público:** Hero.astro, PublicNavbar.astro, ProductNavbar.astro, MenuCard.astro, RealtimeMenu.astro, SakuraPetals.astro.  
- **Admin (React):** AdminLayout, LoginForm, DashboardHome, MenuList, CategoriesPage, CategoriesList, CategoryForm, CreateProductPage, ProductForm, QRPage, QRGenerator, LanguageToggle.

### Gestión de estado

- **nanostores:**  
  - authStore.ts: userStore, isLoadingStore, setUser (no se usa de forma intensiva; la comprobación de sesión se hace con getSession en AdminLayout).  
  - i18nStore.ts: adminLang (es | zh), toggleAdminLang, adminTranslations; persistencia en localStorage (`admin-lang`).

### Rutas y navegación

- Público: `/`, `/menu/[id]`. Navegación por enlaces y scroll a secciones (#categoria).  
- Admin: enlaces tradicionales entre /admin/dashboard, /admin/categories, /admin/create, /admin/qr, /admin/login.  
- Astro View Transitions activadas en Layout.astro; scroll restaurado en MenuCard y ProductNavbar (sessionStorage).

### Servicios / cliente HTTP

- No hay capa de API propia. Todas las llamadas son al cliente de Supabase (supabase.from(...), supabase.auth.*, supabase.storage.*) desde páginas o componentes React.

---

## 8. Documentación existente

- **README.md:** Plantilla estándar de Astro (comandos npm, estructura básica). No describe la app “Mini wok”.  
- No hay Swagger/OpenAPI (no hay API REST en el proyecto).  
- No hay diagramas de arquitectura en el repo.  
- Comentarios en código: dispersos (p. ej. en imageUtils, RealtimeMenu, Hero, PublicNavbar).

---

## 9. Integraciones y dependencias externas

- **Supabase:** Base de datos (Postgres), Auth (email/password), Storage (bucket `menu-images`), Realtime (postgres_changes en `menu_items`).  
- **Vercel:** Deploy (adapter en astro.config.mjs).  
- **Google Fonts:** Playfair Display, Noto Serif SC/JP, Inter (en Layout.astro).  
- **Soporte:** Enlace fijo a WhatsApp (wa.me/56933197338) en AdminLayout y LoginForm.

No hay webhooks ni otros servicios de pago/email en el código.

---

## 10. Tests

- No hay tests en el repositorio (no existen `*.test.*`, `*.spec.*` ni carpeta de tests).

---

## Resumen de archivos por categoría

| Categoría | Archivos |
|-----------|----------|
| Config | package.json, astro.config.mjs, tsconfig.json, .env.example, .gitignore |
| Modelos/BD | Solo inferidos; ver esquema en sección 3 |
| Rutas | src/pages/index.astro, src/pages/menu/[id].astro, src/pages/admin/*.astro |
| Servicios/lib | src/lib/supabase.ts, src/lib/imageUtils.ts |
| Estado | src/stores/authStore.ts, src/stores/i18nStore.ts |
| UI admin | src/components/admin/*.tsx |
| UI público | src/components/public/*.astro, src/components/Welcome.astro |
| Layout y estilos | src/layouts/Layout.astro, src/styles/global.css, src/styles/theme.css |

Con esta entrega puedes generar la documentación técnica, de funcionalidades, lógica de negocio y, si añades una API en el futuro, la guía de API. Si quieres, el siguiente paso puede ser un único documento “Documentación técnica” ya redactado (arquitectura, flujos, módulos) a partir de este archivo.
