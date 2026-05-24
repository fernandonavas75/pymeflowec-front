# Documentación Técnica — PymeFlowEc Frontend

> Sistema ERP multi-tenant para PYMEs ecuatorianas — Capa de Presentación  
> Proyecto de tesis — Ingeniería en Sistemas / Computación  
> Autor: Fernando Navas

---

## Tabla de Contenidos

1. [Descripción General](#1-descripción-general)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Arquitectura del Sistema](#3-arquitectura-del-sistema)
4. [Estructura de Directorios](#4-estructura-de-directorios)
5. [Configuración del Proyecto](#5-configuración-del-proyecto)
6. [Sistema de Diseño (Design System)](#6-sistema-de-diseño-design-system)
7. [Bootstrap y Configuración de la Aplicación](#7-bootstrap-y-configuración-de-la-aplicación)
8. [Sistema de Enrutamiento](#8-sistema-de-enrutamiento)
9. [Capa de Guards — Protección de Rutas](#9-capa-de-guards--protección-de-rutas)
10. [Capa de Interceptores HTTP](#10-capa-de-interceptores-http)
11. [Capa de Modelos — Contratos de Datos](#11-capa-de-modelos--contratos-de-datos)
12. [Capa de Servicios](#12-capa-de-servicios)
13. [Layout y Componentes de Shell](#13-layout-y-componentes-de-shell)
14. [Componentes Compartidos](#14-componentes-compartidos)
15. [Módulos de Funcionalidad (Features)](#15-módulos-de-funcionalidad-features)
16. [Sistema de Autenticación Frontend](#16-sistema-de-autenticación-frontend)
17. [Control de Acceso Basado en Roles (RBAC)](#17-control-de-acceso-basado-en-roles-rbac)
18. [Sistema de Módulos — Gating Dinámico](#18-sistema-de-módulos--gating-dinámico)
19. [Modo Vista Cliente — Impersonación de Plataforma](#19-modo-vista-cliente--impersonación-de-plataforma)
20. [Generación de PDF de Facturas](#20-generación-de-pdf-de-facturas)
21. [Gestión de Estado con Signals](#21-gestión-de-estado-con-signals)
22. [Flujos de Negocio Críticos](#22-flujos-de-negocio-críticos)
23. [Configuración de Entornos](#23-configuración-de-entornos)
24. [Construcción y Despliegue](#24-construcción-y-despliegue)

---

## 1. Descripción General

**PymeFlowEc Frontend** es la capa de presentación del sistema ERP multi-tenant para PYMEs ecuatorianas. Es una Single-Page Application (SPA) construida con **Angular 17.3** bajo el paradigma de **Standalone Components**, que reemplaza la arquitectura tradicional de NgModules por un modelo más liviano y con mejor tree-shaking.

La interfaz proporciona acceso visual a todos los módulos del backend: facturación, inventario, finanzas, caja chica, egresos y administración de la plataforma, con control de acceso granular por rol de usuario y por estado de módulo activo en cada empresa.

### Características Clave

| Característica | Implementación |
|----------------|----------------|
| **Arquitectura reactiva** | Angular Signals (v17) — estado sin zona de detección de cambios innecesaria |
| **Standalone components** | Sin NgModules — importaciones explícitas por componente |
| **Design system propio** | Tokens CSS con OKLch, modo oscuro, densidad compacta, 2 variantes de acento |
| **RBAC** | Guards funcionales + lógica de sidebar por rol |
| **Gating dinámico** | Menú y rutas condicionados al estado activo de módulos del backend |
| **PDF client-side** | Generación de facturas con pdfmake (sin servidor) |
| **Impersonación** | PLATFORM_ADMIN puede operar como cualquier empresa sin cambio de sesión |
| **Internacionalización parcial** | Etiquetas de montos en `es-EC`, validación de documentos ecuatorianos |

---

## 2. Stack Tecnológico

### Framework y Runtime

| Componente | Tecnología | Versión |
|------------|-----------|---------|
| Framework | Angular | 17.3.0 |
| Lenguaje | TypeScript | 5.4.0 |
| Runtime | Node.js | ≥18 LTS (solo build) |
| Package Manager | npm | — |
| Build System | Angular CLI con esbuild | 17.3.0 |
| Dev Server | Vite (integrado via angular CLI) | — |

### Dependencias de Producción

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `@angular/core` | 17.3.0 | Framework principal, Signals, DI |
| `@angular/router` | 17.3.0 | Enrutamiento SPA con lazy loading |
| `@angular/common/http` | 17.3.0 | Cliente HTTP con interceptores funcionales |
| `@angular/material` | 17.3.0 | MatSnackBar, MatDialog, CDK (en retirada gradual) |
| `@angular/cdk` | 17.3.0 | Overlay, Portal (base de MatDialog) |
| `rxjs` | 7.8.0 | Programación reactiva (Observables, operadores) |
| `pdfmake` | 0.3.7 | Generación de PDFs de facturas (client-side) |
| `tailwindcss` | 3.4.1 | Clases utilitarias CSS (complemento del DS) |

### Herramientas de Desarrollo

| Herramienta | Propósito |
|-------------|-----------|
| TypeScript strict mode | Tipado estricto (`strict: true`, `strictTemplates: true`) |
| `npx tsc --noEmit` | Type-check sin compilar |
| ESBuild | Compilación ultra-rápida en dev y build |
| PostCSS + Autoprefixer | Procesamiento de CSS y compatibilidad cross-browser |

---

## 3. Arquitectura del Sistema

### Patrón Arquitectónico

El frontend implementa una arquitectura en capas con **Separation of Concerns** estricta:

```
Usuario (Navegador)
        │
        ▼
┌─────────────────────────────────────────────┐
│           Angular Router                    │
│   Guards (auth, permission) → Componente   │
└────────────────────┬────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│        Capa de Componentes (Features)       │
│  Presentación · Lógica de vista · Signals  │
└────────────────────┬────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│         Capa de Servicios (Core)            │
│  Lógica de negocio · Acceso a datos        │
└────────────────────┬────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│         HttpClient + Interceptores          │
│  tokenInterceptor → clientViewInterceptor  │
│              → errorInterceptor            │
└────────────────────┬────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│         Backend REST API                    │
│  http://localhost:8080/api (dev)           │
│  https://api.../api (prod)                 │
└─────────────────────────────────────────────┘
```

### Ciclo de Vida de una Petición HTTP

```
1. Componente llama a Service.listar()
2. Service llama a ApiService.get('/endpoint', params)
3. HttpClient emite la petición
4. tokenInterceptor: agrega Authorization: Bearer <token>
5. clientViewInterceptor: inyecta ?company_id=X si está en modo cliente
6. errorInterceptor: captura errores y muestra MatSnackBar
7. Backend retorna { success, data, pagination? }
8. Service mapea y retorna Observable<T>
9. Componente actualiza signal → Angular re-renderiza
```

### Paradigma de Estado — Angular Signals

A diferencia de soluciones externas (NgRx, Akita), el proyecto usa el **sistema de Signals nativo de Angular 17** para gestión de estado reactivo local y compartido:

```typescript
// Estado local de componente
loading   = signal(false);
selected  = signal<Invoice | null>(null);
tabFilter = signal<'all' | 'issued'>('all');

// Estado derivado (se recomputa automáticamente)
filteredItems = computed(() =>
  this.allItems().filter(i => matchesTab(i, this.tabFilter()))
);

// Estado global compartido entre componentes
// (en AuthService, CompanyModulesService, AdminViewService)
currentUser  = signal<AuthUser | null>(null);
approvedCodes = signal<Set<string>>(new Set());
```

---

## 4. Estructura de Directorios

```
pymeflowec-front/
├── angular.json                 ← Configuración del workspace Angular CLI
├── package.json                 ← Dependencias y scripts
├── tsconfig.json                ← TypeScript: strict mode, target ES2022
├── tailwind.config.js           ← Configuración Tailwind: colores, fuentes, animaciones
├── postcss.config.js            ← Procesamiento CSS: tailwind + autoprefixer
│
└── src/
    ├── index.html               ← Entry point HTML
    ├── main.ts                  ← Bootstrap: bootstrapApplication(AppComponent, appConfig)
    ├── styles.scss              ← Design system global (~1.700 líneas)
    │
    ├── environments/
    │   ├── environment.ts       ← Dev: apiUrl http://localhost:8080/api
    │   └── environment.prod.ts  ← Prod: apiUrl https://api.tesisfernandonavaspuce.es/api
    │
    └── app/
        ├── app.component.ts     ← Root component (solo <router-outlet>)
        ├── app.config.ts        ← Providers: router, httpClient, interceptores, Material
        ├── app.routes.ts        ← Definición de todas las rutas
        │
        ├── core/
        │   ├── guards/
        │   │   ├── auth.guard.ts        ← Verifica token + sesión activa
        │   │   ├── permission.guard.ts  ← Verifica rol (adminOnly, platform, roles[])
        │   │   └── role.guard.ts        ← Guard alternativo por rol único
        │   │
        │   ├── interceptors/
        │   │   ├── token.interceptor.ts       ← JWT + refresh automático
        │   │   ├── error.interceptor.ts       ← Notificaciones de error globales
        │   │   └── client-view.interceptor.ts ← Inyección de company_id (impersonación)
        │   │
        │   ├── models/                  ← 26 interfaces TypeScript
        │   │   ├── auth.model.ts
        │   │   ├── customer.model.ts
        │   │   ├── product.model.ts
        │   │   ├── supplier.model.ts
        │   │   ├── invoice.model.ts
        │   │   ├── invoice-payment.model.ts
        │   │   ├── invoice-settings.model.ts
        │   │   ├── tax-rate.model.ts
        │   │   ├── inventory-movement.model.ts
        │   │   ├── petty-cash.model.ts
        │   │   ├── expense.model.ts
        │   │   ├── expense-category.model.ts
        │   │   ├── expense-payment.model.ts
        │   │   ├── expense-budget.model.ts
        │   │   ├── expense-recurring.model.ts
        │   │   ├── user.model.ts
        │   │   ├── company.model.ts
        │   │   ├── audit-log.model.ts
        │   │   ├── module-request.model.ts
        │   │   └── pagination.model.ts
        │   │
        │   └── services/                ← 28 servicios inyectables
        │       ├── api.service.ts             ← Wrapper HTTP centralizado
        │       ├── auth.service.ts            ← Autenticación + signals de sesión
        │       ├── theme.service.ts           ← Modo oscuro/claro
        │       ├── admin-view.service.ts      ← Impersonación de empresa (plataforma)
        │       ├── company-modules.service.ts ← Catálogo de módulos activos
        │       ├── customers.service.ts
        │       ├── products.service.ts
        │       ├── suppliers.service.ts
        │       ├── invoices.service.ts
        │       ├── invoice-payments.service.ts
        │       ├── invoice-pdf.service.ts     ← Generación PDF con pdfmake
        │       ├── invoice-settings.service.ts
        │       ├── tax-rates.service.ts
        │       ├── users.service.ts
        │       ├── roles.service.ts
        │       ├── companies.service.ts
        │       ├── module-requests.service.ts
        │       ├── module-request-register.service.ts
        │       ├── dashboard.service.ts
        │       ├── expenses.service.ts
        │       ├── expense-categories.service.ts
        │       ├── expense-payments.service.ts
        │       ├── expense-budgets.service.ts
        │       ├── expense-recurring.service.ts
        │       ├── petty-cash.service.ts
        │       ├── audit-logs.service.ts
        │       └── inventory-movements.service.ts
        │
        ├── layout/
        │   ├── main-layout/     ← Shell: grid CSS sidebar + topbar + content
        │   ├── sidebar/         ← Navegación lateral con gating dinámico
        │   └── topbar/          ← Barra superior con toggle tema y menú de usuario
        │
        ├── shared/
        │   └── components/
        │       ├── app-icon/          ← Wrapper de íconos SVG Lucide inline
        │       ├── confirm-dialog/    ← Modal de confirmación (MatDialog)
        │       ├── stat-card/         ← Tarjeta de KPI reutilizable
        │       ├── status-badge/      ← Badge de estado con color semántico
        │       └── coming-soon/       ← Placeholder para funcionalidades pendientes
        │
        └── features/
            ├── auth/            ← login, register, forgot-password, reset-password
            ├── landing/         ← Página pública de presentación
            ├── dashboard/       ← KPIs principales de la empresa
            ├── clients/         ← Clientes: lista + formulario
            ├── products/        ← Productos: lista, formulario, ajuste de stock, CSV
            ├── suppliers/       ← Proveedores: lista + formulario
            ├── invoices/        ← Facturas: lista, crear, detalle
            ├── tax-rates/       ← Tasas de impuesto
            ├── users/           ← Usuarios de la empresa
            ├── finance/
            │   ├── petty-cash/          ← Caja chica
            │   ├── expenses/            ← Egresos operacionales
            │   ├── expense-categories/  ← Categorías de egreso
            │   ├── expense-budgets/     ← Presupuestos
            │   ├── expense-recurring/   ← Egresos recurrentes
            │   └── finance-dashboard/   ← Dashboard financiero (7 tabs)
            ├── reports/         ← Reportes: actividad, analítica, financiero
            ├── settings/        ← Configuración de facturación
            ├── module-requests/ ← Solicitudes de módulos
            ├── companies/       ← Gestión de empresas (plataforma)
            └── platform/        ← Audit logs, usuarios de soporte
```

---

## 5. Configuración del Proyecto

### `tsconfig.json` — Opciones Clave

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "useDefineForClassFields": false,
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "strictTemplates": true
  }
}
```

El modo `strict: true` habilita implícitamente: `strictNullChecks`, `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization` y `noImplicitAny`. `strictTemplates` extiende estas verificaciones a las plantillas HTML de Angular.

### `angular.json` — Budgets de Tamaño

| Tipo | Warning | Error |
|------|---------|-------|
| Bundle inicial | 1 MB | 2 MB |
| Estilos de componente | 25 KB | 40 KB |

El build usa `outputHashing: 'all'` para cache-busting automático de todos los archivos generados.

**Dependencias CommonJS permitidas** (necesarias para pdfmake):
- `pdfmake/build/pdfmake`
- `pdfmake/build/vfs_fonts`

### `tailwind.config.js`

```javascript
module.exports = {
  darkMode: 'class',        // Modo oscuro por clase CSS en <html>
  corePlugins: {
    preflight: false,        // Deshabilitado para evitar conflictos con Angular Material MDC
  },
  theme: {
    extend: {
      colors: { primary: '#6366f1' },   // Indigo — color primario
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      animation: {
        'fade-in':  'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'shimmer':  'shimmer 1.5s infinite',
      },
    },
  },
};
```

---

## 6. Sistema de Diseño (Design System)

El archivo `src/styles.scss` (~1.700 líneas) define el sistema de diseño completo. No utiliza librerías de terceros para componentes — todos los patrones visuales son CSS puro + variables.

### 6.1 Modelo de Color — OKLch

Los tokens de color usan el espacio de color **OKLch** (perceptually uniform lightness-chroma-hue), que garantiza que los colores percibidos mantengan contraste relativo consistente entre modo claro y oscuro.

```scss
:root {
  // Fondos (profundidad)
  --bg:        oklch(98% 0.003 240);
  --surface:   oklch(100% 0 0);
  --surface-2: oklch(96% 0.004 240);
  --surface-3: oklch(92% 0.006 240);

  // Texto
  --text-ds:    oklch(15% 0.01 240);
  --text-muted-ds: oklch(46% 0.02 240);
  --text-subtle:   oklch(62% 0.015 240);

  // Bordes
  --border-ds:       oklch(88% 0.008 240);
  --border-strong-ds: oklch(74% 0.012 240);

  // Acento por defecto (Indigo)
  --accent:      oklch(55% 0.22 266);
  --accent-hover: oklch(50% 0.22 266);
  --accent-soft:  oklch(94% 0.04 266);

  // Semánticos
  --success: oklch(55% 0.18 145);
  --warn:    oklch(68% 0.17 55);
  --danger:  oklch(54% 0.22 27);
}

[data-theme="dark"] {
  --bg:        oklch(13% 0.005 240);
  --surface:   oklch(17% 0.008 240);
  // ... variantes oscuras de todos los tokens
}
```

### 6.2 Variantes de Acento

El acento del sistema de diseño se puede cambiar dinámicamente en tiempo de ejecución modificando el atributo `data-accent` del elemento `<html>`:

| Atributo | Color | Caso de uso |
|----------|-------|-------------|
| `data-accent="indigo"` (default) | Indigo #6366f1 | Empresas comerciales |
| `data-accent="emerald"` | Verde #55b748 | Empresas agrícolas / ecológicas |
| `data-accent="amber"` | Ámbar #f59e0b | Alertas / modo plataforma |

### 6.3 Tokens de Layout

```scss
--sidebar-w:           248px;   // Sidebar expandido
--sidebar-w-collapsed: 64px;    // Sidebar colapsado
--topbar-h:            60px;    // Altura de la topbar
--radius-ds:           10px;    // Border-radius estándar
--radius-sm-ds:        6px;
--radius-lg-ds:        14px;
```

### 6.4 Sistema de Densidad

El modo compacto se activa poniendo `data-density="compact"` en `<html>`. Reduce `--density-row`, `--density-gap` y `--density-pad`, comprimiendo tablas y formularios para pantallas pequeñas.

### 6.5 Componentes del Design System

| Clase CSS | Descripción |
|-----------|-------------|
| `.ds-table` | Tabla con cabeceras sticky, hover de fila, responsive |
| `.ds-tabs` / `.ds-tab` | Pestañas con contador `<span class="count">` |
| `.ds-tabs-sep` | Separador visual entre grupos de tabs |
| `.btn` | Botón base con variantes: `btn-primary`, `btn-ghost`, `btn-danger` |
| `.card` / `.card-head` / `.card-body` | Tarjeta de contenido con sombra |
| `.kpi-grid` / `.kpi` | Grid de KPIs con `.kpi-label`, `.kpi-value`, `.kpi-delta` |
| `.modal-backdrop` / `.modal-box` | Modal inline con animación `ds-modal-in` |
| `.drawer-backdrop` / `.drawer` | Panel lateral con cabecera, cuerpo y pie |
| `.mfield` / `.m-input` | Campo de formulario (reemplaza `mat-form-field`) |
| `.seg` / `.seg-btn` | Control segmentado (radio visual) |
| `.badge` | Etiqueta de estado con variantes semánticas |
| `.filter-search` | Input de búsqueda con ícono integrado |

### 6.6 Animaciones

| Nombre | Efecto | Uso |
|--------|--------|-----|
| `pageEnter` | Fade + translateY(6px) | Entrada de páginas |
| `cardEntrance` | Fade + translateY(8px) con delays | Entrada de KPI cards |
| `shimmer` | Gradiente en movimiento | Skeleton loading |
| `ds-fade` | Fade suave | Modales y drawers |
| `ds-slide-in` | Slide desde la derecha | Drawers laterales |

---

## 7. Bootstrap y Configuración de la Aplicación

### `src/main.ts`

```typescript
bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error(err));
```

Angular 17 usa `bootstrapApplication()` standalone — no existe `AppModule`.

### `src/app/app.config.ts`

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        tokenInterceptor,        // 1° — JWT
        clientViewInterceptor,   // 2° — company_id (impersonación)
        errorInterceptor,        // 3° — notificaciones
      ])
    ),
    provideAnimationsAsync(),
    importProvidersFrom(MatSnackBarModule, MatDialogModule),
  ],
};
```

**Orden de interceptores:** Los interceptores se ejecutan en el orden en que se registran en `withInterceptors`. El token se agrega primero, luego se inyecta el scope de empresa, y finalmente se interceptan los errores. La respuesta los atraviesa en orden inverso.

---

## 8. Sistema de Enrutamiento

### `src/app/app.routes.ts`

El archivo define todas las rutas de la aplicación. Las rutas privadas usan `MainLayoutComponent` como layout padre con `children`, lo que permite mantener el sidebar y topbar persistentes.

**Estructura general:**
```
/ (Landing)
/login
/register
/forgot-password
/reset-password
└── MainLayout (authGuard)
    ├── /dashboard
    ├── /customers               (MOD_INVOICING implícito)
    │   ├── /new                 (permissionGuard: adminOnly)
    │   └── /:id/edit            (permissionGuard: adminOnly)
    ├── /products
    │   ├── /new                 (adminOnly)
    │   └── /:id/edit            (adminOnly)
    ├── /suppliers
    │   └── /new · /:id/edit     (adminOnly)
    ├── /invoices
    │   ├── /new
    │   └── /:id
    ├── /tax-rates               (adminOnly)
    ├── /users                   (adminOnly)
    ├── /settings/invoice        (adminOnly)
    ├── /module-requests         (adminOnly)
    ├── /finance/petty-cash      (permissionGuard: roles[STORE_ADMIN, STORE_SELLER])
    ├── /finance/expenses        (adminOnly)
    ├── /finance/expense-categories  (adminOnly)
    ├── /finance/expense-budgets     (adminOnly)
    ├── /finance/expense-recurring   (adminOnly)
    ├── /finance/dashboard           (adminOnly)
    ├── /reports
    ├── /companies               (permissionGuard: platform)
    │   └── /:id                 (permissionGuard: platform)
    ├── /platform/support-users  (permissionGuard: platformAdmin)
    └── /platform/audit-logs     (permissionGuard: platform)
** → redirect /
```

### Datos de Ruta (Route Data)

Cada ruta puede incluir propiedades en `data` que son leídas por el `permissionGuard`:

```typescript
{
  path: 'users',
  component: UsersListComponent,
  canActivate: [authGuard, permissionGuard],
  data: { adminOnly: true }
}

{
  path: 'companies',
  component: CompaniesListComponent,
  canActivate: [authGuard, permissionGuard],
  data: { platform: true }
}

{
  path: 'petty-cash',
  canActivate: [authGuard, permissionGuard],
  data: { roles: ['STORE_ADMIN', 'STORE_SELLER'] }
}
```

---

## 9. Capa de Guards — Protección de Rutas

### 9.1 `auth.guard.ts`

**Propósito:** Verifica que el usuario tenga una sesión activa antes de acceder a cualquier ruta privada.

```
Flujo de ejecución:
1. Obtener token de localStorage ('pf_token')
2. Si no hay token → navigate('/login') → false
3. Si currentUser signal ya tiene valor → true (sesión en memoria)
4. Si no → llamar authService.me() (carga sesión desde el backend)
   - OK → true
   - Error (401/403) → authService.logout() → false
```

El guard tolera la recarga de página: si el token existe pero la señal `currentUser` está vacía (porque Angular recién inicializó), llama a `/auth/me` para restaurar la sesión desde el backend antes de permitir el acceso.

```typescript
export const authGuard: CanActivateFn = () => {
  const token = authService.getToken();
  if (!token) {
    router.navigate(['/login']);
    return false;
  }
  if (authService.currentUser()) return true;

  return authService.me().pipe(
    map(() => true),
    catchError(() => {
      authService.logout();
      return of(false);
    })
  );
};
```

### 9.2 `permission.guard.ts`

**Propósito:** Verifica permisos de rol sobre la ruta activa. Se ejecuta **después** de `authGuard` (el usuario ya está autenticado).

**Propiedades `data` soportadas:**

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `adminOnly: true` | `boolean` | Alias para `roles: ['STORE_ADMIN']` |
| `roles: []` | `string[]` | Lista de roles que pueden acceder |
| `platform: true` | `boolean` | Solo usuarios PLATFORM_* |
| `platformAdmin: true` | `boolean` | Solo PLATFORM_ADMIN |

**Lógica de resolución:**

```
1. Si requirePlatformAdmin → verificar isPlatformAdmin()
2. Si requirePlatform → verificar isSystemUser()
3. Si isSystemUser() → bypass (plataforma accede a todo lo de tienda)
4. Si requiredRoles.length === 0 → permitir
5. hasRole(...requiredRoles) → permitir | redirect /dashboard
```

La regla 3 (bypass de sistema) permite que PLATFORM_ADMIN pueda ingresar a rutas de tienda cuando opera en modo cliente sin necesitar guards adicionales.

### 9.3 `role.guard.ts`

Guard alternativo más simple. Lee un único rol de `route.data['role']`. Usado en rutas donde la lógica de acceso es un rol exacto (no lista). Actualmente tiene uso reducido — `permissionGuard` cubre todos los casos.

---

## 10. Capa de Interceptores HTTP

Los interceptores son **funcionales** (Angular 15+ API), inyectados mediante `withInterceptors()` en `app.config.ts`. Se ejecutan en orden de registro para requests y en orden inverso para responses.

### 10.1 `token.interceptor.ts`

**Propósito:** Agrega el token JWT a todas las requests autenticadas y maneja el refresco automático.

```
Request:
  1. Leer localStorage['pf_token']
  2. Si existe → clonar request con header Authorization: Bearer <token>
  3. Pasar al siguiente interceptor

Error (401):
  1. Si la URL es /auth/refresh o /auth/login → no hacer nada (evitar loop)
  2. Llamar authService.refreshToken() → POST /auth/refresh
     - OK → actualizar token en localStorage, reintentar request original
     - Error → authService.logout() (limpia storage, redirige a /login)
```

```typescript
export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('pf_token');
  const authReq = token ? addAuthHeader(req, token) : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/')) {
        return authService.refreshToken().pipe(
          switchMap(res => next(addAuthHeader(req, res.access_token))),
          catchError(() => { authService.logout(); return throwError(...); })
        );
      }
      return throwError(() => error);
    })
  );
};
```

**Invariante de seguridad:** Las URLs que contienen `/auth/refresh` o `/auth/login` nunca reciben el intento de refresco, lo que previene un bucle infinito de llamadas cuando el refresh token también expira.

### 10.2 `error.interceptor.ts`

**Propósito:** Intercepta todos los errores HTTP y muestra notificaciones al usuario via `MatSnackBar`. Centraliza el manejo de errores para que los componentes no necesiten implementarlo individualmente.

| Código HTTP | Mensaje mostrado |
|-------------|-----------------|
| `0` | No se pudo conectar con el servidor |
| `403` | No tienes permiso para realizar esta acción |
| `404` | El recurso solicitado no fue encontrado |
| `422` | Error de validación (usa `error.error.message` del backend) |
| `500+` | Error interno del servidor |
| `401` | No se muestra (lo maneja `tokenInterceptor`) |

```typescript
snackBar.open(message, 'Cerrar', {
  duration: 5000,
  panelClass: ['error-snackbar'],
  horizontalPosition: 'right',
  verticalPosition: 'top',
});
```

### 10.3 `client-view.interceptor.ts`

**Propósito:** Soporte para el modo de impersonación de PLATFORM_ADMIN. Cuando el administrador de plataforma está operando como una empresa específica, inyecta `?company_id=X` en cada request HTTP de tienda.

```
Si AdminViewService.viewedCompany() tiene valor:
  Si la URL contiene '/platform/' o '/auth/' → no modificar
  Si no → clonar request con params.set('company_id', empresa.id)

Si no hay empresa en vista → pasar sin modificar
```

Esto permite que el backend use el `company_id` del query param en lugar del extraído del JWT, efectuando el scope de datos a la empresa visualizada.

---

## 11. Capa de Modelos — Contratos de Datos

Los modelos TypeScript en `src/app/core/models/` definen todos los tipos de datos intercambiados con el backend. Funcionan como un contrato formal que garantiza type-safety end-to-end.

### 11.1 Modelo de Paginación (`pagination.model.ts`)

Todos los endpoints de lista del backend retornan una estructura anidada consistente:

```typescript
export interface ApiListResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    total_pages: number;
    current_page: number;
    per_page: number;
  };
}

// FinanceListResponse es alias de ApiListResponse
export type FinanceListResponse<T> = ApiListResponse<T>;
```

### 11.2 Modelo de Autenticación (`auth.model.ts`)

```typescript
export interface AuthUser {
  id: number;
  full_name: string;
  email: string;
  role: { id: number; name: string; scope: 'STORE' | 'PLATFORM' };
  company?: { id: number; name: string; ruc: string; business_name?: string };
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
}
```

### 11.3 Modelo de Factura (`invoice.model.ts`)

```typescript
export type InvoiceStatus = 'ISSUED' | 'CANCELLED';
export type InvoicePayStatusAgg = 'PENDIENTE' | 'PARCIAL' | 'COBRADO';

export interface Invoice {
  id: number;
  invoice_number: string;
  customer: StoreCustomer;
  created_by: User;
  details: InvoiceDetail[];
  subtotal: number;
  tax_amount: number;
  total: number;
  status: InvoiceStatus;
  payment_status?: InvoicePayStatusAgg;
  amount_paid?: number;
  amount_pending?: number;
  issue_date: string;
  created_at: string;
}

export interface InvoiceDetail {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount: number;
  tax_percentage: number;
  tax_amount: number;
  line_subtotal: number;
  line_total: number;
}
```

### 11.4 Modelos de Finanzas

**`petty-cash.model.ts`:**
```typescript
export type PettyCashStatus = 'OPEN' | 'CLOSED';
export type PettyCashMovementType = 'EXPENSE' | 'REPLENISH' | 'ADJUSTMENT';

export interface PettyCash {
  id: number;
  name: string;
  opening_amount: number;
  current_balance: number;
  status: PettyCashStatus;
  opened_at: string;
  closed_at?: string;
}
```

**`expense.model.ts`:**
```typescript
export type ExpensePaymentStatus = 'PENDIENTE' | 'PARCIAL' | 'PAGADO' | 'ANULADO';
export type VoucherType = 'FACTURA' | 'NOTA_VENTA' | 'RECIBO' | 'LIQUIDACION' | 'SIN_COMPROBANTE' | 'OTRO';

export interface Expense {
  id: number;
  category_id: number;
  category?: ExpenseCategory;
  supplier_id?: number;
  supplier_name_free?: string;
  description: string;
  expense_date: string;
  amount: number;
  voucher_type?: VoucherType;
  payment_status: ExpensePaymentStatus;
}
```

### 11.5 Etiquetas de Display (`*_LABELS`)

Cada modelo con enums define un objeto de etiquetas para la interfaz:

```typescript
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  EFECTIVO:       'Efectivo',
  TRANSFERENCIA:  'Transferencia',
  TARJETA_DEBITO: 'Tarjeta Débito',
  TARJETA_CREDITO:'Tarjeta Crédito',
  CHEQUE:         'Cheque',
  OTRO:           'Otro',
};

export const EXPENSE_PAYMENT_STATUS_LABELS: Record<ExpensePaymentStatus, string> = {
  PENDIENTE: 'Pendiente',
  PARCIAL:   'Parcial',
  PAGADO:    'Pagado',
  ANULADO:   'Anulado',
};
```

---

## 12. Capa de Servicios

### 12.1 `ApiService` — Wrapper HTTP Centralizado

`ApiService` es el único punto de acceso HTTP de todos los servicios de datos. Encapsula la URL base y el manejo de `HttpParams`:

```typescript
@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = environment.apiUrl;  // http://localhost:8080/api

  get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Observable<T>
  post<T>(path: string, body: unknown): Observable<T>
  put<T>(path: string, body: unknown): Observable<T>
  patch<T>(path: string, body?: unknown): Observable<T>
  delete<T>(path: string): Observable<T>
}
```

El método `buildParams()` filtra automáticamente valores `undefined`, `null` y cadenas vacías, evitando que parámetros opcionales se envíen como `undefined` en la query string.

**Nota:** Cuatro servicios (`company-modules`, `companies`, `module-requests`, `invoice-settings`) usan `HttpClient` directamente debido a necesidades específicas de headers o URL construction. Esto representa deuda técnica documentada en el audit FE-05.

### 12.2 `AuthService` — Autenticación con Signals

El servicio central de autenticación mantiene el estado de sesión usando signals de Angular:

```typescript
currentUser   = signal<AuthUser | null>(null);
isAuthenticated = computed(() => !!this.currentUser());
role            = computed(() => this.currentUser()?.role?.name);
isSystemUser    = computed(() => !this.currentUser()?.company);     // usuario de plataforma
isPlatformAdmin = computed(() => role() === 'PLATFORM_ADMIN');
isStoreAdmin    = computed(() => role() === 'STORE_ADMIN');
isStoreWarehouse= computed(() => role() === 'STORE_WAREHOUSE');
```

**Claves de localStorage:**

| Clave | Contenido |
|-------|-----------|
| `pf_token` | JWT access token (8h) |
| `pf_refresh` | Refresh token (7d) |
| `pf_user` | Objeto `AuthUser` serializado en JSON |

El constructor llama a `loadFromStorage()` que rehidrata el signal `currentUser` desde `pf_user` al iniciar la aplicación, evitando el parpadeo de pantalla de login al recargar la página.

**Métodos principales:**

| Método | Descripción |
|--------|-------------|
| `login(email, password)` | POST /auth/login → guarda tokens y user en storage |
| `logout()` | Limpia storage, resetea signals, navega a /login |
| `me()` | GET /auth/me → refresca `currentUser` desde el backend |
| `refreshToken()` | POST /auth/refresh → actualiza `pf_token` |
| `hasRole(...roles)` | Verifica si el rol actual está en la lista dada |
| `forgotPassword(email)` | POST /users/forgot-password |
| `resetPassword(token, pw)` | POST /users/reset-password |

### 12.3 `CompanyModulesService` — Catálogo de Módulos Activos

Gestiona de forma reactiva los módulos habilitados para la empresa actual. Es el corazón del sistema de gating dinámico.

```typescript
catalog       = signal<ModuleCatalogItem[]>([]);
approvedCodes = signal<Set<string>>(new Set());  // Módulos con status APPROVED y no vencidos
pendingCodes  = signal<Set<string>>(new Set());  // Módulos con status PENDING
loadFailed    = signal(false);                   // Fallback: si falla la API, mostrar todo
catalogReady  = signal(false);                   // Evita doble llamada desde otros componentes
```

`loadCatalog()` llama a `GET /platform/modules/company-catalog` y construye los Sets de códigos filtrados por expiración:

```typescript
this.approvedCodes.set(new Set(
  items
    .filter(m => m.status === 'APPROVED' && (!m.expires_at || new Date(m.expires_at) > now))
    .map(m => m.code)
));
```

### 12.4 `AdminViewService` — Impersonación

Gestiona el modo de vista cliente para PLATFORM_ADMIN. Cuando se activa, recarga el catálogo de módulos de la empresa seleccionada y el interceptor `clientViewInterceptor` inyecta el `company_id` en todas las requests:

```typescript
enterClientView(company: ViewedCompany): void {
  this.modulesSvc.reset();
  this.viewedCompany.set(company);
  this.loading.set(true);
  this.modulesSvc.loadCatalogForCompany(company.id).subscribe(...);
}

exitClientView(): void {
  this.viewedCompany.set(null);
  this.modulesSvc.reset();
}
```

### 12.5 `InvoicePdfService` — Generación de PDF

Genera PDFs de facturas completamente en el cliente usando `pdfmake`. Los módulos se importan de forma **lazy** (`import()` dinámico) para no incluirlos en el bundle inicial:

```typescript
async download(invoice: Invoice): Promise<void> {
  const [pdfMakeModule, vfsModule] = await Promise.all([
    import('pdfmake/build/pdfmake'),
    import('pdfmake/build/vfs_fonts'),
  ]);
  pdfMake.createPdf(this.buildDoc(invoice, company, settings)).download(...);
}
```

**Plantillas de PDF disponibles:**

| Plantilla | Característica |
|-----------|---------------|
| `classic` | Cabecera oscura (`#0f172a`), franja de acento en color configurado |
| `modern` | Borde superior de color, fondo suave en cabecera de tabla |
| `minimal` | Sin fondos de color, solo líneas de borde sutiles |

La configuración visual (color de acento, nombre a mostrar, pie de página) se carga desde `InvoiceSettingsService` y puede personalizarse por empresa desde `/settings/invoice`.

### 12.6 `DashboardService` — Agregación de KPIs

Carga datos de múltiples endpoints en paralelo para construir las métricas del dashboard principal:

```typescript
loadDashboard(): Observable<DashboardData> {
  return forkJoin({
    invoices:  this.invoicesService.list({ status: 'ISSUED', limit: 500 }),
    expenses:  this.expensesService.list({ limit: 500 }),
    products:  this.productsService.list({ limit: 500 }),
  }).pipe(map(({ invoices, expenses, products }) => ({
    totalRevenue:   calcRevenue(invoices.data),
    totalExpenses:  expenses.data.reduce((s, e) => s + +e.amount, 0),
    stockAlerts:    products.data.filter(p => p.stock <= (p.min_stock || 5)),
    // ...
  })));
}
```

**Importante:** Desde la corrección F-06, los egresos del dashboard se calculan sumando `amount` de `ExpensesService`, no como `stock × purchase_price` de productos.

---

## 13. Layout y Componentes de Shell

### 13.1 `MainLayoutComponent`

Componente raíz de todas las rutas privadas. Implementa el shell de la aplicación con CSS Grid:

```
┌──────────────────────────────────────────────┐
│                  Topbar (60px)               │
├──────────┬───────────────────────────────────┤
│          │                                   │
│ Sidebar  │         <router-outlet>           │
│ (248px)  │         (contenido de página)     │
│          │                                   │
└──────────┴───────────────────────────────────┘
```

**Responsabilidades:**
- Toggle del sidebar (colapsado/expandido)
- Cierre automático del sidebar en mobile al navegar
- Precarga de `InvoiceSettings` para usuarios STORE_ADMIN al inicializar

### 13.2 `SidebarComponent`

La lógica de navegación más compleja del frontend. Construye la lista de ítems visibles usando un `computed()` que evalúa múltiples condiciones simultáneamente:

**Interfaces internas:**
```typescript
interface NavItem {
  label: string;       // Texto del menú
  icon: string;        // Nombre del ícono (app-icon)
  route: string;       // Ruta Angular
  queryParams?: Record<string, string>;
  adminOnly?: boolean;       // Solo STORE_ADMIN
  platformOnly?: boolean;    // Solo usuarios sin empresa
  platformAdminOnly?: boolean;
  moduleCode?: string;       // Código del módulo requerido
  warehouseHidden?: boolean; // Ocultar para STORE_WAREHOUSE
}

interface RenderedItem extends NavItem {
  moduleStatus: 'APPROVED' | 'PENDING' | null;  // Para mostrar badge de estado
}
```

**Algoritmo de filtrado** (`visibleNavGroups` computed):

```
Por cada ítem de navegación:
  1. Si warehouseHidden && isWarehouse → skip
  2. Si platformOnly:
     - Si no está en modo cliente Y isSystem:
       - Si platformAdminOnly && !isPlatformAdmin → skip
       - Agregar con moduleStatus=null
     - continue (no procesar más)
  3. Si isSystem (no en modo cliente) → skip (plataforma no ve menú de tienda)
  4. Si moduleCode:
     - Si adminOnly && !isAdmin → skip
     - Si loadFailed → agregar (fallback de red)
     - Si !approved && !pending → skip
     - STORE_ADMIN: agregar con moduleStatus=APPROVED|PENDING
     - STORE_SELLER: agregar solo si approved (moduleStatus=null)
  5. Si adminOnly: agregar si isAdmin
  6. Default: agregar (ítem general de tienda)
```

El modo cliente (`isClientView`) hace que PLATFORM_ADMIN se comporte como STORE_ADMIN de la empresa visualizada, habilitando el gating de módulos desde el catálogo de esa empresa.

### 13.3 `TopbarComponent`

Barra de navegación superior con:
- Botón de toggle del sidebar
- Toggle de modo oscuro/claro via `ThemeService`
- Avatar con iniciales del usuario (`full_name.split(' ').map(n => n[0]).join('')`)
- Menú desplegable con nombre de empresa y botón de logout

---

## 14. Componentes Compartidos

### `AppIconComponent`

Abstracción sobre íconos SVG inline (basados en Lucide Icons). Acepta un `name` y renderiza el SVG correspondiente. Los íconos se agregan manualmente al componente a medida que se necesitan en la aplicación, evitando cargar una librería completa de íconos.

**Íconos disponibles (selección):** `receipt_long`, `people`, `inventory_2`, `local_shipping`, `wallet`, `trending_down`, `bar_chart`, `percent`, `manage_accounts`, `extension`, `business`, `manage_search`, `palette`, `tag`, `target`, `repeat`, `banknote`, `pending_actions`, `support_agent`, `circle_dollar`.

### `ConfirmDialogComponent`

Modal de confirmación para acciones destructivas (anular factura, eliminar registro). Recibe datos via `MAT_DIALOG_DATA`:

```typescript
{
  title: string;      // Título del modal
  message: string;    // Mensaje descriptivo
  confirmText?: string; // Texto del botón (default: 'Confirmar')
  danger?: boolean;   // Colorea el botón en rojo si true
}
```

### `StatCardComponent`

Tarjeta de KPI reutilizable con inputs: `label`, `value`, `delta?`, `icon?`, `variant?` (success/warn/danger).

### `StatusBadgeComponent`

Badge de estado con mapeo de colores semánticos. Acepta un `status` string y lo formatea con el color correspondiente del design system.

---

## 15. Módulos de Funcionalidad (Features)

### 15.1 Autenticación (`/auth`)

**`LoginComponent`:** Formulario reactivo con `FormGroup`. Tras autenticarse redirige a `/dashboard`. Muestra errores de validación inline del backend (`422`) y errores de credenciales (`401`).

**`RegisterComponent`:** Registro de empresa + usuario administrador. Incluye selección de módulos disponibles (cargados de `GET /platform/modules/public`). Crea la empresa y la sesión en un único POST a `/auth/register`.

**`ForgotPasswordComponent`:** Envía un email de recuperación. No requiere sesión.

**`ResetPasswordComponent`:** Lee el token del query param (`?token=...`) y permite establecer nueva contraseña.

### 15.2 Clientes (`/customers`)

**`ClientsListComponent`:** Lista con búsqueda en tiempo real. Identifica clientes por tipo de documento (Cédula/RUC/Consumidor Final). Drawer lateral con detalle y link a facturas del cliente.

**`ClientFormComponent`:** Formulario de creación/edición con validación de cédula y RUC ecuatorianos (checksum módulo 10 / 11). El tipo de documento condiciona las reglas de validación del campo `document_number`.

### 15.3 Productos (`/products`)

**`ProductsListComponent`:** Tabla con filtros activo/inactivo, búsqueda por nombre/SKU, indicador visual de stock bajo (semáforo verde/ámbar/rojo según `stock/min_stock`). Acciones: activar, desactivar, ajustar stock (dialog), eliminar.

**`ProductFormComponent`:** Incluye selector de proveedor y tasa de impuesto. El campo SKU se autogenera si se deja vacío.

**`CsvImportDialogComponent`:** Importación masiva de productos desde CSV. Valida columnas requeridas, muestra errores por fila, y llama a `POST /products/bulk` con hasta 300 registros.

**`StockAdjustDialogComponent`:** Dialog de ajuste de stock con tipo (ENTRADA/SALIDA/AJUSTE) y notas. Solo visible para `STORE_ADMIN` y `STORE_WAREHOUSE`.

### 15.4 Facturas (`/invoices`)

**`InvoicesListComponent`:** La pantalla más compleja del módulo de facturación.

Características:
- **Tabs de estado:** ISSUED / CANCELLED (filtra por `status`)
- **Tabs de cobro:** Todos / Pendiente / Parcial / Cobrada (filtra por `payment_status`)
- **Búsqueda:** por número de factura o nombre de cliente
- **Drawer lateral:** al seleccionar una factura muestra:
  - Detalle completo (ítems, totales, estado)
  - Historial de cobros (`InvoicePayment[]`)
  - Formulario inline para registrar nuevo cobro
  - Botón de anulación (solo STORE_ADMIN, con `ConfirmDialog`)
  - Botón de descarga PDF
- **Columna "Cobro":** badge PENDIENTE/PARCIAL/COBRADA con barra de progreso

**`InvoiceCreateComponent`:** Creador de facturas tipo carrito de compras (POS):

```
1. Buscar / seleccionar cliente (autocomplete con búsqueda)
2. Agregar ítems al carrito:
   a. Selector de producto (búsqueda por nombre/SKU)
   b. Cantidad, precio unitario, descuento por línea
3. Footer del carrito con subtotal, IVA, total, total descuentos
4. Seleccionar fecha de emisión
5. Confirmar → POST /api/invoices
```

Calcula los totales localmente antes de enviar: `line_subtotal = qty × price − discount`, `tax = subtotal × (pct/100)`.

### 15.5 Caja Chica (`/finance/petty-cash`)

- **KPI de saldo:** barra de progreso con colores (verde: >50%, ámbar: 20-50%, rojo: <20% del fondo de apertura)
- **Tabla de movimientos:** monto con color (rojo = egreso, verde = reabastecimiento), saldo acumulado `balance_after` por fila
- **Formulario inline:** tipo de movimiento (segmented control EXPENSE/REPLENISH/ADJUSTMENT), monto, descripción, categoría opcional
- **Modal de apertura:** `opening_amount` y nombre de sesión (solo STORE_ADMIN)
- **Historial de sesiones:** sesiones CLOSED expandibles con resumen

### 15.6 Egresos Operacionales (`/finance/expenses`)

- **Tabs de estado de pago:** Todos / Pendiente / Parcial / Pagado / Anulado
- **Filtros:** categoría, rango de fechas, búsqueda por descripción
- **Drawer de detalle:** KPIs (total/pagado/pendiente), ítems completos, sección de pagos inline con formulario (método de pago con campos condicionales: referencia para transferencia, número de cheque, contrapartida para tarjeta)
- **Modal crear/editar:** categoría, descripción, monto, proveedor (FK o libre), fecha, comprobante

### 15.7 Dashboard Financiero (`/finance/dashboard`)

Módulo de analytics financiero con 7 tabs internas. Carga datos lazy al activar cada tab para minimizar llamadas HTTP iniciales:

| Tab | Fuente de datos | Visualizaciones |
|-----|----------------|-----------------|
| Ingresos | `/invoices` (ISSUED) + `/invoice-payments` | KPIs, gráfico de barras SVG (ventas/día) |
| Egresos y Gastos | `/expenses` + `/expense-categories` | KPIs, barras horizontales por categoría |
| Compras | `/expenses` (filtrado INVENTARIO) | KPIs de IVA crédito tributario |
| Ventas | `/invoices` con `details[]` | Detalle ítem por ítem |
| Cuentas por Cobrar | `/invoices` (payment_status PENDIENTE/PARCIAL) | Tabla con acción "Registrar cobro" |
| Cuentas por Pagar | `/expenses` (payment_status PENDIENTE/PARCIAL) | Tabla con acción "Registrar pago" |
| Reportes | Todos los anteriores agregados | Resumen general + Ingresos Líquidos |

Los gráficos se implementan con **SVG inline** sin librerías externas (no ApexCharts) para evitar el freeze detectado con getters reactivos en componentes de gráfico.

### 15.8 Reportes (`/reports`)

Componente con 3 vistas via query param `?view=`:

| View | Acceso | Contenido |
|------|--------|-----------|
| `analytics` (default) | Todos | KPIs generales de la empresa |
| `activity` | Solo STORE_ADMIN | Audit log de la empresa (`/audit-logs/my-company`) |
| `finance` | Requiere MOD_FINANCE | KPIs financieros: saldo caja, facturas pendientes, egresos |

---

## 16. Sistema de Autenticación Frontend

### Flujo de Login

```
POST /api/auth/login
  ↓
authService.login(email, password)
  ↓
API retorna: { access_token, refresh_token, user }
  ↓
localStorage.setItem('pf_token', access_token)
localStorage.setItem('pf_refresh', refresh_token)
localStorage.setItem('pf_user', JSON.stringify(user))
  ↓
currentUser.set(user)  ← signal actualizado → toda la UI reacciona
  ↓
router.navigate(['/dashboard'])
```

### Flujo de Refresco de Token

```
Request any → 401 response
  ↓ (tokenInterceptor)
GET localStorage['pf_refresh']
  ↓
POST /api/auth/refresh { refresh_token }
  ↓ OK: { access_token }
localStorage.setItem('pf_token', nuevo_token)
  ↓
Reintentar request original con nuevo token
  ↓ Error:
authService.logout() → limpia storage → navigate('/login')
```

### Flujo de Recuperación de Contraseña

```
POST /api/users/forgot-password { email }
  ↓
Backend envía email con link: /reset-password?token=<uuid>
  ↓
Usuario abre link → ResetPasswordComponent lee ?token de URL
  ↓
POST /api/users/reset-password { token, new_password }
  ↓
Redirect a /login
```

---

## 17. Control de Acceso Basado en Roles (RBAC)

### Roles del Sistema

| Rol | Scope | Descripción |
|-----|-------|-------------|
| `PLATFORM_ADMIN` | PLATFORM | Administrador de la plataforma SaaS. `company = null` |
| `PLATFORM_STAFF` | PLATFORM | Soporte técnico (solo lectura). `company = null` |
| `STORE_ADMIN` | STORE | Administrador de empresa. Acceso CRUD completo |
| `STORE_SELLER` | STORE | Vendedor: crear facturas, registrar cobros |
| `STORE_WAREHOUSE` | STORE | Bodeguero: solo ajuste de stock |

### Matriz de Acceso por Sección

| Sección | STORE_ADMIN | STORE_SELLER | STORE_WAREHOUSE | PLATFORM_* |
|---------|:-----------:|:------------:|:---------------:|:----------:|
| Dashboard | ✅ | ✅ | ✅ | ✅ (modo cliente) |
| Clientes | ✅ | ✅ (solo vista) | ❌ | ✅ |
| Facturas | ✅ | ✅ | ❌ | ✅ |
| Crear/editar clientes | ✅ | ❌ | ❌ | ✅ |
| Productos (ver) | ✅ | ✅ | ✅ | ✅ |
| Ajustar stock | ✅ | ❌ | ✅ | ✅ |
| Proveedores | ✅ | ❌ | ❌ | ✅ |
| Caja chica | ✅ | ✅ (movimientos) | ❌ | ✅ |
| Egresos | ✅ | ❌ | ❌ | ✅ |
| Usuarios | ✅ | ❌ | ❌ | ❌ |
| Módulos | ✅ | ❌ | ❌ | ✅ |
| Empresas | ❌ | ❌ | ❌ | ✅ |
| Auditoría | ❌ | ❌ | ❌ | ✅ |

### Implementación RBAC en Tres Capas

**Capa 1 — Rutas (Guards):**
```typescript
canActivate: [authGuard, permissionGuard]
data: { adminOnly: true }
```

**Capa 2 — Sidebar (Computed):**
```typescript
if (item.adminOnly && !isAdmin) continue;
```

**Capa 3 — Templates (Condicionales):**
```html
@if (authService.isStoreAdmin()) {
  <button (click)="annul()">Anular</button>
}
```

---

## 18. Sistema de Módulos — Gating Dinámico

El gating de módulos es una característica diferenciadora del sistema que controla qué funcionalidades están disponibles para cada empresa según los módulos que tiene activos/aprobados.

### Flujo Completo

```
1. Usuario hace login
   ↓
2. SidebarComponent.ngOnInit()
   Si isStoreUser() → CompanyModulesService.loadCatalog()
   GET /platform/modules/company-catalog
   ↓
3. Backend retorna:
   [{ code: 'MOD_INVOICING', status: 'APPROVED', expires_at: null },
    { code: 'MOD_FINANCE',   status: 'PENDING',  expires_at: null },
    { code: 'MOD_PRODUCTS',  status: 'APPROVED', expires_at: '2026-12-31' }]
   ↓
4. CompanyModulesService actualiza signals:
   approvedCodes = Set { 'MOD_INVOICING', 'MOD_PRODUCTS' }
   pendingCodes  = Set { 'MOD_FINANCE' }
   ↓
5. visibleNavGroups() recomputa:
   - 'Clientes'  → MOD_INVOICING ∈ approved → MUESTRA (status: APPROVED)
   - 'Egresos'   → MOD_FINANCE ∈ pending   → MUESTRA si adminOnly (status: PENDING, con badge)
   - 'Productos' → MOD_PRODUCTS ∈ approved → MUESTRA (status: APPROVED)
   - 'Tasas IVA' → MOD_TAX ∉ approved ni pending → OCULTA
```

### Indicadores Visuales de Estado de Módulo

El sidebar muestra un badge de estado junto a los ítems según `moduleStatus`:

- `APPROVED`: ícono verde de check (módulo activo)
- `PENDING`: ícono ámbar de reloj (módulo en espera de aprobación)

STORE_SELLER solo ve ítems con módulos APPROVED (no se le muestra el estado PENDING).

### Fallback de Red

Si `GET /company-catalog` falla (red no disponible, servidor caído):
```typescript
loadFailed.set(true);  // El sidebar muestra TODOS los ítems
```
Esto garantiza que un error de red no deje al usuario con un sidebar completamente vacío.

---

## 19. Modo Vista Cliente — Impersonación de Plataforma

Permite que PLATFORM_ADMIN opere sobre los datos de cualquier empresa sin cambiar de sesión ni re-autenticarse. El usuario de plataforma mantiene su JWT pero las requests se scopean a la empresa seleccionada.

### Flujo de Activación

```
1. PLATFORM_ADMIN en /companies → selecciona empresa → "Ver empresa"
   ↓
2. AdminViewService.enterClientView({ id: 5, name: 'Empresa XYZ' })
   a. modulesSvc.reset()          ← limpia módulos previos
   b. viewedCompany.set(empresa)  ← activa modo cliente
   c. loading.set(true)
   d. modulesSvc.loadCatalogForCompany(5) ← carga módulos de empresa 5
   ↓
3. clientViewInterceptor detecta viewedCompany() !== null
   → Toda request no-/platform/ recibe: params.set('company_id', '5')
   ↓
4. SidebarComponent.visibleNavGroups():
   - isClientView = true → isAdmin = true (forzado)
   - isSystem = false (forzado)
   → Muestra sidebar de tienda con módulos de empresa 5
   ↓
5. PLATFORM_ADMIN puede ver/crear facturas, egresos, etc. de empresa 5
```

### Desactivación

```
AdminViewService.exitClientView()
  → viewedCompany.set(null)
  → modulesSvc.reset()
```

`clientViewInterceptor` deja de inyectar `company_id` en las requests. El sidebar vuelve a mostrar el menú de plataforma.

---

## 20. Generación de PDF de Facturas

La generación de PDF ocurre completamente en el navegador, sin roundtrip al servidor. Usa `pdfmake` con importación dinámica para mantener el bundle inicial pequeño.

### Proceso de Generación

```typescript
async download(invoice: Invoice): Promise<void> {
  // 1. Importación lazy (solo cuando se necesita)
  const [pdfMakeModule, vfsModule] = await Promise.all([
    import('pdfmake/build/pdfmake'),
    import('pdfmake/build/vfs_fonts'),
  ]);

  // 2. Registrar fuentes virtuales
  pdfMake.addVirtualFileSystem(vfs);

  // 3. Construir definición del documento
  const docDef = this.buildDoc(invoice, company, settings);

  // 4. Descargar
  pdfMake.createPdf(docDef).download(`factura-${invoice.invoice_number}.pdf`);
}
```

### Estructura del Documento

```
┌─────────────────────────────────────────────┐
│ CABECERA (empresa izq | factura der)        │
│ template: classic=fondo oscuro              │
│           modern=banda de color             │
│           minimal=solo líneas               │
├─────────────────────────────────────────────┤
│ FACTURAR A: nombre + CI/RUC                 │
├─────────────────────────────────────────────┤
│ TABLA DE ÍTEMS                              │
│ Cant. | Descripción | P.Unit | IVA | Total  │
│ ...                                         │
├─────────────────────────────────────────────┤
│                    Subtotal: $xxx.xx        │
│                    IVA 15%:  $xxx.xx        │
│                    TOTAL:    $xxx.xx        │
├─────────────────────────────────────────────┤
│ Pie: texto personalizable + marca           │
└─────────────────────────────────────────────┘
```

### Fórmula de Cálculo por Línea (en PDF)

El PDF toma los valores ya calculados del backend (no los recalcula):
- `line_subtotal` = precalculado por el backend
- `tax_amount` = precalculado por el backend
- `line_total` = `line_subtotal + tax_amount`

Si la factura tiene `status === 'CANCELLED'`, se agrega un badge `[ ANULADA ]` en rojo en la cabecera.

---

## 21. Gestión de Estado con Signals

Angular 17 introduce Signals como primitiva de estado reactivo. El proyecto los adopta en dos niveles:

### Estado Global (Servicios Singleton)

Los servicios inyectados `providedIn: 'root'` mantienen estado compartido entre componentes:

```typescript
// AuthService — Estado de sesión
currentUser   = signal<AuthUser | null>(null);
isAuthenticated = computed(() => !!this.currentUser());

// CompanyModulesService — Módulos activos
approvedCodes = signal<Set<string>>(new Set());
pendingCodes  = signal<Set<string>>(new Set());
loadFailed    = signal(false);

// AdminViewService — Modo de impersonación
viewedCompany    = signal<ViewedCompany | null>(null);
isClientViewMode = computed(() => !!this.viewedCompany());
```

### Estado Local (Componentes)

Los componentes usan signals para estado de UI que no necesita compartirse:

```typescript
// Patrón estándar en features
loading      = signal(false);
allItems     = signal<Invoice[]>([]);
selected     = signal<Invoice | null>(null);
tabFilter    = signal<'all' | 'issued' | 'cancelled'>('all');
searchCtrl   = new FormControl('');
searchTerm   = toSignal(this.searchCtrl.valueChanges.pipe(startWith('')), { initialValue: '' });

// Derived state — se recomputa solo cuando alguna dependencia cambia
filteredItems = computed(() => {
  const tab = this.tabFilter();
  const q   = this.searchTerm()?.toLowerCase() ?? '';
  return this.allItems().filter(inv =>
    (tab === 'all' || inv.status === tab.toUpperCase()) &&
    (inv.invoice_number.includes(q) || inv.customer?.full_name?.toLowerCase().includes(q))
  );
});
```

### Patrón `toSignal` — Integración RxJS ↔ Signals

Para campos de búsqueda reactivos que usan `FormControl` de Angular Forms:

```typescript
searchTerm = toSignal(
  this.searchCtrl.valueChanges.pipe(startWith('')),
  { initialValue: '' }
);
```

Convierte el `Observable` del `valueChanges` en un `Signal` que el `computed()` puede leer como dependencia.

---

## 22. Flujos de Negocio Críticos

### 22.1 Creación de Factura (Frontend)

```
1. Usuario llena el formulario en InvoiceCreateComponent
2. Selecciona cliente (autocomplete → GET /customers?search=...)
3. Agrega ítems:
   a. Búsqueda de producto → GET /products?search=...
   b. Seleccionar producto → agrega a cartItems[]
   c. Ajustar cantidad / precio / descuento
   d. Computed: subtotal = qty × price − discount
   e. Computed: tax     = subtotal × (tax_rate/100)
4. Validaciones client-side:
   - Al menos 1 ítem
   - Descuento no puede exceder el valor bruto de línea
   - Stock local (el backend también valida)
5. Enviar → POST /api/invoices { customer_id, items[], issue_date, notes }
6. Backend retorna la factura creada (201)
7. Router navega a /invoices/:id (vista de detalle)
```

### 22.2 Registro de Cobro de Factura

```
1. Usuario abre drawer de factura en InvoicesListComponent
2. Expande sección "Cobros"
3. Llena formulario inline:
   - Monto
   - Método de pago (segmented control)
   - Campos condicionales:
     · TRANSFERENCIA → campo referencia
     · TARJETA_DEBITO/CREDITO → campo contrapartida
     · CHEQUE → número de cheque
   - Fecha del cobro
4. Enviar → POST /api/invoice-payments { invoice_id, amount, payment_method, ... }
5. Backend actualiza payment_status de la factura automáticamente
6. Componente recarga cobros + estado de factura
7. Badge de estado se actualiza reactivamente
```

### 22.3 Flujo de Solicitud de Módulo

```
STORE_ADMIN en /module-requests:
1. Selecciona módulo del catálogo (GET /platform/modules/public)
2. Escribe comentario opcional
3. POST /api/module-requests { module_id, comments }
4. Backend crea registro con status: PENDING
5. pendingCodes signal se actualiza → sidebar muestra badge ámbar

PLATFORM_ADMIN en /module-requests (vista plataforma):
1. Lista todas las solicitudes (GET /module-requests/all)
2. Selecciona solicitud PENDING
3. PATCH /module-requests/:id/approve
   → Backend activa CompanyModule (is_active: true)
   → approvedCodes se actualiza en siguiente loadCatalog
```

### 22.4 Flujo de Apertura/Cierre de Caja Chica

```
Apertura:
1. STORE_ADMIN hace clic en "Abrir sesión"
2. Modal: ingresa monto de apertura y nombre de sesión
3. POST /api/petty-cash/open { opening_amount, name }
4. Backend crea sesión OPEN; current_balance = opening_amount
5. Componente recarga → muestra KPI de saldo y tabla de movimientos

Movimiento (STORE_ADMIN / STORE_SELLER):
1. Segmented control: EXPENSE / REPLENISH / ADJUSTMENT
2. Formulario inline: monto, descripción, categoría opcional
3. POST /api/petty-cash/:id/movements { movement_type, amount, description }
4. Backend actualiza current_balance y registra balance_after
5. Nueva fila aparece al tope de la tabla con saldo acumulado

Cierre (STORE_ADMIN):
1. Clic en "Cerrar sesión"
2. ConfirmDialog
3. PATCH /api/petty-cash/:id/close { closing_amount_reported? }
4. Sesión pasa a CLOSED; historial queda en tab expandible
```

---

## 23. Configuración de Entornos

### `src/environments/environment.ts` (Desarrollo)

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'
};
```

### `src/environments/environment.prod.ts` (Producción)

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.tesisfernandonavaspuce.es/api'
};
```

Angular CLI reemplaza automáticamente el archivo de entorno en build de producción (`ng build`) via la configuración `fileReplacements` en `angular.json`.

---

## 24. Construcción y Despliegue

### Comandos

```bash
# Servidor de desarrollo (puerto 5173 via Vite)
ng serve
# o
npm start

# Build de producción (salida en dist/pymeflowec-frontend/)
ng build

# Build de desarrollo (con source maps, sin optimización)
ng build --configuration development

# Type-check sin compilar (rápido para CI)
npx tsc --noEmit
```

### Proceso de Build

```
1. TypeScript compilation (tsc con strict mode)
2. Angular template compilation (strictTemplates)
3. ESBuild bundle:
   - Tree-shaking de imports no usados
   - Code-splitting por rutas (lazy loading implícito)
   - Minificación de JS y CSS
4. PostCSS: Tailwind purge (elimina clases no usadas) + Autoprefixer
5. Output hashing: main.[hash].js, styles.[hash].css
```

### Artefactos de Build

```
dist/pymeflowec-frontend/
├── index.html              ← Entry point (sin hash)
├── main.[hash].js          ← Bundle principal (~500-800 KB gzip)
├── polyfills.[hash].js     ← zone.js (~30 KB gzip)
├── styles.[hash].css       ← Tailwind + DS + Material (~100 KB gzip)
├── chunk-*.js              ← Lazy chunks por ruta
└── assets/                 ← Archivos estáticos
```

### Configuración de Servidor Web

Para que el enrutamiento SPA funcione correctamente, el servidor web debe redirigir todas las rutas no encontradas a `index.html`:

**Nginx:**
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

**Apache (.htaccess):**
```apache
RewriteEngine On
RewriteRule ^(?!.*\.).*$ /index.html [L]
```

### Budgets de Tamaño (angular.json)

| Artefacto | Warning | Error |
|-----------|---------|-------|
| Bundle inicial total | 1 MB | 2 MB |
| Estilos de componente individuales | 25 KB | 40 KB |

Si el build supera estos límites, Angular CLI emite advertencias o errores, forzando al desarrollador a optimizar (lazy loading, code splitting, eliminación de dependencias).

---

*Documentación generada el 13/05/2026 para defensa de tesis.*  
*Sistema: PymeFlowEc Frontend v1.0.0 — Framework: Angular 17.3.0 — Autor: Fernando Navas*
