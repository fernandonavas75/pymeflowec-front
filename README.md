# PymeFlow EC — Frontend

> **Sistema ERP Multi-Tenant para PyMEs Ecuatorianas**  
> Aplicación web cliente desarrollada con Angular 17 (Standalone Components)  
> Trabajo de Titulación — Ingeniería en Sistemas / Computación  
> **Autor:** Fernando Navas · Ecuador, 2025

---

## Tabla de Contenidos

1. [Contexto y Problemática](#1-contexto-y-problemática)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Stack Tecnológico y Justificación](#3-stack-tecnológico-y-justificación)
4. [Estructura del Proyecto](#4-estructura-del-proyecto)
5. [Bootstrap y Configuración de la Aplicación](#5-bootstrap-y-configuración-de-la-aplicación)
6. [Sistema de Enrutamiento](#6-sistema-de-enrutamiento)
7. [Capa Core: Modelos de Dominio](#7-capa-core-modelos-de-dominio)
8. [Capa Core: Servicios](#8-capa-core-servicios)
9. [Autenticación y Gestión de Sesión](#9-autenticación-y-gestión-de-sesión)
10. [Control de Acceso Basado en Roles (RBAC)](#10-control-de-acceso-basado-en-roles-rbac)
11. [Pipeline de Interceptores HTTP](#11-pipeline-de-interceptores-http)
12. [Arquitectura Multi-Tenant](#12-arquitectura-multi-tenant)
13. [Gestión de Estado Reactivo](#13-gestión-de-estado-reactivo)
14. [Módulos Funcionales del ERP](#14-módulos-funcionales-del-erp)
15. [Generación de PDF Client-Side](#15-generación-de-pdf-client-side)
16. [Sistema de Estilos y Theming](#16-sistema-de-estilos-y-theming)
17. [Configuración de Entornos y Build](#17-configuración-de-entornos-y-build)
18. [Instalación y Ejecución](#18-instalación-y-ejecución)
19. [Patrones y Decisiones de Diseño](#19-patrones-y-decisiones-de-diseño)

---

## 1. Contexto y Problemática

Las pequeñas y medianas empresas (PyMEs) en Ecuador representan más del 90 % del tejido empresarial del país, sin embargo, la mayoría carece de herramientas digitales integradas para gestionar sus operaciones. Las soluciones ERP tradicionales presentan barreras de adopción significativas: costos de licenciamiento elevados, infraestructura local compleja y falta de adaptación al contexto fiscal ecuatoriano (RUC, CEDULA, IVA, emisión de facturas SRI).

**PymeFlow EC** propone una solución SaaS (*Software as a Service*) multi-tenant que democratiza el acceso a un ERP mediante un modelo de suscripción por módulos, donde varias empresas comparten la misma infraestructura con aislamiento total de datos. Este repositorio contiene el **cliente frontend** de la plataforma: una SPA (*Single Page Application*) desarrollada con Angular 17 que consume la API REST del backend (Spring Boot).

### Alcance funcional

- Gestión comercial: clientes, proveedores, productos con inventario, facturación electrónica
- Configuración fiscal: tasas de impuesto (IVA) con períodos de vigencia
- Administración de usuarios por empresa con roles diferenciados
- Capa de administración de la plataforma SaaS: empresas suscritas, módulos, auditoría, soporte

---

## 2. Arquitectura del Sistema

### 2.1 Visión general de capas

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             BROWSER (SPA)                                   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        ROUTING LAYER                                │    │
│  │  app.routes.ts — lazy loadComponent() + authGuard + permissionGuard │    │
│  └──────────────────────────────┬──────────────────────────────────────┘    │
│                                 │                                           │
│         ┌───────────────────────┼───────────────────────┐                   │
│         ▼                       ▼                       ▼                   │
│  ┌─────────────┐      ┌──────────────────┐     ┌──────────────────┐         │
│  │   PUBLIC    │      │   APP SHELL      │     │   PLATFORM ADMIN │         │
│  │  Landing    │      │  main-layout     │     │  companies/      │         │
│  │  Login      │      │  sidebar         │     │  audit-logs/     │         │
│  │  Register   │      │  topbar          │     │  support-users/  │         │
│  └─────────────┘      └────────┬─────────┘     └──────────────────┘         │
│                                │                                            │
│               ┌────────────────┼────────────────────────┐                   │
│               │         FEATURE MODULES (Lazy)          │                   │
│               │                                         │                   │
│  ┌──────────┐ ┌─────────┐ ┌──────────┐ ┌────────────┐  │                   │
│  │customers │ │products │ │suppliers │ │  invoices  │  │                   │
│  └──────────┘ └─────────┘ └──────────┘ └────────────┘  │                   │
│  ┌──────────┐ ┌─────────┐ ┌──────────┐ ┌────────────┐  │                   │
│  │tax-rates │ │  users  │ │dashboard │ │mod-requests│  │                   │
│  └──────────┘ └─────────┘ └──────────┘ └────────────┘  │                   │
│               └─────────────────────────────────────────┘                   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         CORE LAYER                                  │    │
│  │                                                                     │    │
│  │  ┌───────────┐  ┌──────────────┐  ┌───────────┐  ┌──────────────┐  │    │
│  │  │  Guards   │  │ Interceptors │  │ Services  │  │   Models     │  │    │
│  │  │ authGuard │  │ token        │  │ AuthSvc   │  │ AuthUser     │  │    │
│  │  │ permGuard │  │ clientView   │  │ ApiSvc    │  │ Invoice      │  │    │
│  │  │ roleGuard │  │ error        │  │ ...domain │  │ Product, ... │  │    │
│  │  └───────────┘  └──────────────┘  └───────────┘  └──────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                       SHARED LAYER                                  │    │
│  │   ConfirmDialog · StatCard · StatusBadge · ComingSoon               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                │  HTTPS / REST · Bearer JWT · JSON
                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                  BACKEND API — Spring Boot · Puerto 8080                     │
│  /api/auth   /api/customers   /api/products   /api/invoices                 │
│  /api/suppliers   /api/tax-rates   /api/users   /api/companies              │
│  /api/platform   /api/audit-logs   /api/module-requests                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Principios Arquitectónicos

| Principio | Implementación concreta |
|---|---|
| Separación de responsabilidades | Cuatro capas independientes: Core, Features, Layout, Shared |
| Carga diferida | Todas las rutas usan `loadComponent()` — un chunk de JS por componente |
| Sin NgModules | Arquitectura 100% Standalone Components (Angular 17) |
| Estado reactivo sin librerías externas | Angular Signals + `computed()` en AuthService |
| Centralización de cross-cutting concerns | Interceptores HTTP funcionales encadenados |
| RBAC jerárquico | `permissionGuard` con evaluación de scope + rol + adminOnly |
| Tipado fuerte | TypeScript strict mode; todos los contratos de API tipados con interfaces genéricas |

### 2.3 Flujo de datos end-to-end

```
Usuario interactúa con componente
            │
            ▼
Componente llama a un Service (CustomerService, InvoiceService…)
            │
            ▼
Service llama a ApiService.get/post/put/delete()
            │
            ▼
HttpClient despacha la request
            │
    ┌───────┴────────────────────────────────────┐
    │         PIPELINE DE INTERCEPTORES           │
    │  1. tokenInterceptor  → añade Bearer token  │
    │  2. clientViewInterceptor → inyecta company_id (si aplica) │
    │  3. errorInterceptor  → captura errores HTTP │
    └───────┬────────────────────────────────────┘
            │
            ▼
      API REST Backend
            │
            ▼
  Response tipada: ApiResponse<T> | ApiListResponse<T>
            │
            ▼
  Observable emite → Componente actualiza vista
```

---

## 3. Stack Tecnológico y Justificación

### 3.1 Framework y Lenguaje

| Tecnología | Versión | Rol | Justificación |
|---|---|---|---|
| **Angular** | 17.3 | Framework SPA | Standalone Components, Signals nativos, lazy loading por componente; ecosistema maduro para aplicaciones empresariales |
| **TypeScript** | 5.4 | Lenguaje | Strict mode habilitado; interfaces tipadas para todos los contratos de API; mejora la mantenibilidad en equipos |
| **RxJS** | 7.8 | Streams / HTTP | Composición de operadores para refresh de token, manejo de errores y flujos asíncronos complejos |
| **Zone.js** | 0.14 | Change detection | Integración con el ciclo de detección de cambios de Angular para actualizaciones de UI automáticas |

### 3.2 UI y Sistema de Estilos

| Tecnología | Versión | Rol | Justificación |
|---|---|---|---|
| **Angular Material** | 17.3 | Componentes UI | Material Design 3; formularios, tablas, diálogos, snackbars, paginación listos para producción |
| **Angular CDK** | 17.3 | Primitivos | Overlays, scrolling virtual, drag & drop; base para los componentes Material |
| **Tailwind CSS** | 3.4 | Utilidades CSS | Diseño utility-first sin CSS custom; dark mode con clase; integración con Material deshabilitando preflight |
| **PostCSS + Autoprefixer** | 8.4 / 10.4 | Procesamiento | Pipeline de transformación de CSS; prefijos vendor automáticos para compatibilidad cross-browser |
| **SCSS** | — | Preprocesador | Variables, mixins y anidamiento nativo; estilos globales en `styles.scss` |

### 3.3 Librerías de Dominio

| Librería | Versión | Uso |
|---|---|---|
| **ApexCharts** | 3.48 | Motor de gráficas SVG/Canvas para el dashboard |
| **ng-apexcharts** | 1.10 | Wrapper Angular de ApexCharts; enlace declarativo mediante propiedades de componente |
| **pdfmake** | 0.3.7 | Generación de documentos PDF en el browser; renderización de facturas sin servidor |

### 3.4 Herramientas de Build

| Herramienta | Versión | Rol |
|---|---|---|
| **Angular CLI** | 17.3 | Scaffolding, build, serve, test runner |
| **esbuild** | (interno Angular CLI 17) | Bundler de producción; reemplaza webpack; orden de magnitud más rápido |
| **Vite** | (dev server Angular CLI 17) | Servidor de desarrollo con HMR; puerto configurado en `5173` |

---

## 4. Estructura del Proyecto

```
pymeflowec-front/
│
├── src/
│   ├── app/
│   │   │
│   │   ├── core/                              # Núcleo transversal — singleton services
│   │   │   │
│   │   │   ├── guards/
│   │   │   │   ├── auth.guard.ts              # CanActivateFn: valida JWT + /auth/me
│   │   │   │   ├── permission.guard.ts        # CanActivateFn: RBAC (platform/store/adminOnly)
│   │   │   │   └── role.guard.ts              # CanActivateFn: validación de rol puntual
│   │   │   │
│   │   │   ├── interceptors/
│   │   │   │   ├── token.interceptor.ts       # Bearer JWT + lógica de refresh automático
│   │   │   │   ├── client-view.interceptor.ts # Inyección de company_id para impersonación
│   │   │   │   └── error.interceptor.ts       # Captura HTTP errors → MatSnackBar
│   │   │   │
│   │   │   ├── models/                        # Contratos TypeScript — mirrors del backend
│   │   │   │   ├── auth.model.ts              # LoginRequest, RegisterRequest, AuthUser, LoginResponse
│   │   │   │   ├── company.model.ts           # Company, CreateCompanyDto, UpdateCompanyDto
│   │   │   │   ├── customer.model.ts          # Customer, CustomerType, CreateCustomerDto
│   │   │   │   ├── invoice.model.ts           # Invoice, InvoiceDetail, CreateInvoiceDto
│   │   │   │   ├── product.model.ts           # Product, AdjustStockDto, StockMovementType
│   │   │   │   ├── supplier.model.ts          # Supplier, CreateSupplierDto
│   │   │   │   ├── user.model.ts              # User con role y company
│   │   │   │   ├── tax-rate.model.ts          # TaxRate con períodos de vigencia
│   │   │   │   ├── pagination.model.ts        # ApiResponse<T>, ApiListResponse<T>, PaginatedResponse<T>
│   │   │   │   ├── audit-log.model.ts         # AuditLog para trazabilidad de plataforma
│   │   │   │   └── module-request.model.ts    # ModuleRequest, estados APPROVED/PENDING
│   │   │   │
│   │   │   └── services/
│   │   │       ├── auth.service.ts            # Signal currentUser + JWT + refresh
│   │   │       ├── api.service.ts             # Wrapper genérico de HttpClient
│   │   │       ├── customers.service.ts       # CRUD clientes paginado
│   │   │       ├── products.service.ts        # CRUD productos + ajuste de stock
│   │   │       ├── suppliers.service.ts       # CRUD proveedores
│   │   │       ├── invoices.service.ts        # CRUD facturas + cancelación
│   │   │       ├── users.service.ts           # CRUD usuarios de empresa
│   │   │       ├── companies.service.ts       # Gestión empresas (plataforma)
│   │   │       ├── tax-rates.service.ts       # Tasas impositivas
│   │   │       ├── dashboard.service.ts       # KPIs y métricas analíticas
│   │   │       ├── invoice-pdf.service.ts     # Generación PDF con pdfmake
│   │   │       ├── audit-logs.service.ts      # Logs de auditoría de plataforma
│   │   │       ├── module-request.service.ts  # Solicitudes de módulos por empresa
│   │   │       ├── company-modules.service.ts # Módulos habilitados por empresa
│   │   │       ├── admin-view.service.ts      # Estado de impersonación de empresa
│   │   │       ├── roles.service.ts           # Catálogo de roles disponibles
│   │   │       └── theme.service.ts           # Toggle de modo oscuro/claro
│   │   │
│   │   ├── features/                          # Componentes de dominio — lazy loaded
│   │   │   ├── auth/
│   │   │   │   ├── login/                     # Formulario de inicio de sesión
│   │   │   │   ├── register/                  # Registro de empresa + admin
│   │   │   │   └── forgot-password/           # Recuperación de contraseña
│   │   │   ├── clients/
│   │   │   │   ├── clients-list/              # Tabla paginada de clientes
│   │   │   │   └── client-form/               # Formulario crear/editar (reutilizable)
│   │   │   ├── products/
│   │   │   │   ├── products-list/             # Catálogo con filtros y búsqueda
│   │   │   │   ├── product-form/              # Formulario crear/editar producto
│   │   │   │   └── stock-adjust-dialog/       # Dialog modal para ajuste de inventario
│   │   │   ├── suppliers/
│   │   │   │   ├── suppliers-list/
│   │   │   │   └── supplier-form/
│   │   │   ├── invoices/
│   │   │   │   ├── invoices-list/             # Historial de facturas con estado
│   │   │   │   ├── invoice-create/            # Wizard de emisión de factura
│   │   │   │   └── invoice-detail/            # Vista detalle + descarga PDF
│   │   │   ├── tax-rates/
│   │   │   │   ├── tax-rates-list/
│   │   │   │   └── tax-rate-form/
│   │   │   ├── users/
│   │   │   │   ├── users-list/
│   │   │   │   └── user-form/
│   │   │   ├── companies/
│   │   │   │   ├── companies-list/            # Listado de empresas suscritas (plataforma)
│   │   │   │   └── company-detail/            # Detalle empresa + módulos + estado
│   │   │   ├── dashboard/                     # Panel de KPIs con ApexCharts
│   │   │   ├── landing/                       # Página de marketing / presentación
│   │   │   ├── module-requests/
│   │   │   │   └── module-requests-list/      # Cola de aprobación de módulos
│   │   │   └── platform/
│   │   │       ├── audit-logs/                # Visor de logs de plataforma
│   │   │       └── support-users/             # Gestión de usuarios PLATFORM_STAFF
│   │   │
│   │   ├── layout/                            # Shell de la aplicación autenticada
│   │   │   ├── main-layout/                   # Router outlet + estructura de página
│   │   │   ├── sidebar/                       # Navegación lateral con module gating
│   │   │   └── topbar/                        # Barra superior con menú de usuario
│   │   │
│   │   ├── shared/                            # Componentes agnósticos de dominio
│   │   │   └── components/
│   │   │       ├── confirm-dialog/            # Dialog de confirmación genérico
│   │   │       ├── stat-card/                 # Tarjeta de métrica para dashboard
│   │   │       ├── status-badge/              # Badge con color según estado
│   │   │       └── coming-soon/               # Placeholder para módulos en desarrollo
│   │   │
│   │   ├── app.routes.ts                      # Árbol de rutas de la aplicación
│   │   ├── app.config.ts                      # ApplicationConfig (providers globales)
│   │   └── app.component.ts                   # Componente raíz (solo <router-outlet>)
│   │
│   ├── environments/
│   │   ├── environment.ts                     # Dev: apiUrl → localhost:8080
│   │   └── environment.prod.ts                # Prod: apiUrl → api.tesisfernandonavaspuce.es
│   │
│   ├── styles.scss                            # Tema Material + imports globales
│   ├── main.ts                                # bootstrapApplication(AppComponent)
│   └── index.html                             # Shell HTML
│
├── angular.json                               # Configuración Angular CLI
├── tailwind.config.js                         # Tema Tailwind + desactivación preflight
├── postcss.config.js                          # Plugins PostCSS
├── tsconfig.json                              # Configuración TypeScript strict
└── package.json                               # Dependencias y scripts
```

---

## 5. Bootstrap y Configuración de la Aplicación

Angular 17 utiliza `bootstrapApplication()` en lugar de `AppModule`. Toda la configuración de providers se centraliza en `app.config.ts`:

```typescript
// src/app/app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    // Router con árbol de rutas lazy
    provideRouter(routes),

    // HttpClient con tres interceptores funcionales en cadena
    provideHttpClient(
      withInterceptors([tokenInterceptor, clientViewInterceptor, errorInterceptor])
    ),

    // Animaciones asíncronas (evita bloquear el hilo principal en el bootstrap)
    provideAnimationsAsync(),

    // Módulos Material que requieren providers globales
    importProvidersFrom(MatSnackBarModule, MatDialogModule),

    // Paginador localizado al español ecuatoriano
    { provide: MatPaginatorIntl, useFactory: spanishPaginatorIntl },

    // subscriptSizing dinámico para form-fields (evita saltos de layout)
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { subscriptSizing: 'dynamic' } },

    // Alineación de opciones de select deshabilitada (mejor UX en listas largas)
    { provide: MAT_SELECT_CONFIG, useValue: { disableOptionCentering: true } },
  ],
};
```

La función `spanishPaginatorIntl()` localiza el paginador de Angular Material:

```typescript
function spanishPaginatorIntl(): MatPaginatorIntl {
  const intl = new MatPaginatorIntl();
  intl.itemsPerPageLabel = 'Elementos por página:';
  intl.nextPageLabel     = 'Siguiente';
  intl.previousPageLabel = 'Anterior';
  intl.firstPageLabel    = 'Primera página';
  intl.lastPageLabel     = 'Última página';
  intl.getRangeLabel = (page, pageSize, length) => {
    if (length === 0 || pageSize === 0) return `0 de ${length}`;
    const start = page * pageSize + 1;
    const end   = Math.min(page * pageSize + pageSize, length);
    return `${start} – ${end} de ${length}`;
  };
  return intl;
}
```

---

## 6. Sistema de Enrutamiento

### 6.1 Estrategia de rutas

El árbol de rutas en `app.routes.ts` aplica tres patrones simultáneamente:

**a) Rutas públicas** — acceso irrestricto:
```typescript
{
  path: 'login',
  loadComponent: () =>
    import('./features/auth/login/login.component').then(m => m.LoginComponent),
},
```

**b) Rutas de empresa** — envueltas en `MainLayoutComponent` protegidas por `authGuard`:
```typescript
{
  path: '',
  loadComponent: () =>
    import('./layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
  canActivate: [authGuard],
  children: [
    {
      path: 'products/new',
      loadComponent: () =>
        import('./features/products/product-form/product-form.component')
          .then(m => m.ProductFormComponent),
      canActivate: [permissionGuard],
      data: { adminOnly: true },   // ← metadato leído por permissionGuard
    },
    // ...
  ],
}
```

**c) Rutas de plataforma** — adicionalmente protegidas con `data: { platform: true }` o `data: { platformAdmin: true }`:
```typescript
{
  path: 'platform/support-users',
  loadComponent: () =>
    import('./features/platform/support-users/support-users-list.component')
      .then(m => m.SupportUsersListComponent),
  canActivate: [permissionGuard],
  data: { platformAdmin: true },  // ← exclusivo PLATFORM_ADMIN
},
```

### 6.2 Tabla completa de rutas

#### Rutas Públicas

| Ruta | Componente |
|---|---|
| `/` | `LandingComponent` |
| `/login` | `LoginComponent` |
| `/register` | `RegisterComponent` |
| `/forgot-password` | `ForgotPasswordComponent` |

#### Rutas de Empresa (requieren `authGuard`)

| Ruta | Guard adicional | Condición |
|---|---|---|
| `/dashboard` | — | Cualquier usuario autenticado |
| `/customers` | — | Cualquier usuario autenticado |
| `/customers/new` | — | Cualquier usuario autenticado |
| `/customers/:id/edit` | — | Cualquier usuario autenticado |
| `/invoices` | — | Cualquier usuario autenticado |
| `/invoices/new` | — | Cualquier usuario autenticado |
| `/invoices/:id` | — | Cualquier usuario autenticado |
| `/products` | — | Cualquier usuario autenticado |
| `/products/new` | `permissionGuard` | `adminOnly: true` → `STORE_ADMIN` |
| `/products/:id/edit` | `permissionGuard` | `adminOnly: true` → `STORE_ADMIN` |
| `/suppliers` | — | Cualquier usuario autenticado |
| `/suppliers/new` | `permissionGuard` | `adminOnly: true` |
| `/suppliers/:id/edit` | `permissionGuard` | `adminOnly: true` |
| `/tax-rates` | `permissionGuard` | `adminOnly: true` |
| `/tax-rates/new` | `permissionGuard` | `adminOnly: true` |
| `/tax-rates/:id/edit` | `permissionGuard` | `adminOnly: true` |
| `/users` | `permissionGuard` | `adminOnly: true` |
| `/users/new` | `permissionGuard` | `adminOnly: true` |
| `/users/:id/edit` | `permissionGuard` | `adminOnly: true` |
| `/module-requests` | `permissionGuard` | `adminOnly: true` |

#### Rutas de Plataforma (requieren `authGuard` + `permissionGuard`)

| Ruta | Condición |
|---|---|
| `/companies` | `platform: true` → cualquier usuario PLATFORM |
| `/companies/:id` | `platform: true` |
| `/platform/modules` | `platform: true` |
| `/platform/audit-logs` | `platform: true` |
| `/platform/support-users` | `platformAdmin: true` → solo `PLATFORM_ADMIN` |

---

## 7. Capa Core: Modelos de Dominio

Los modelos TypeScript en `src/app/core/models/` actúan como contratos explícitos entre el frontend y la API REST. Todos son interfaces puras (sin lógica), reflejando exactamente la estructura JSON del backend.

### 7.1 Modelo de Autenticación (`auth.model.ts`)

```typescript
export interface AuthUser {
  id: number;
  company_id: number | null;
  role_id: number;
  full_name: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  role: {
    id: number;
    name: 'PLATFORM_ADMIN' | 'PLATFORM_STAFF' | 'STORE_ADMIN' | 'STORE_SELLER' | 'STORE_WAREHOUSE' | string;
    scope: 'PLATFORM' | 'STORE';
    description?: string | null;
  };
  company: {
    id: number;
    name: string;
    business_name?: string | null;
    ruc?: string | null;
    email?: string | null;
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';
  } | null;           // null para usuarios de plataforma sin empresa asignada
}

export interface LoginResponse {
  access_token:  string;  // JWT de corta duración
  refresh_token: string;  // Token de renovación
  user: AuthUser;
}

export interface RegisterRequest {
  company_name:  string;  // Auto-crea la empresa
  company_ruc:   string;
  company_email?: string;
  company_phone?: string;
  full_name:     string;  // Usuario administrador inicial
  email:         string;
  password:      string;
}
```

### 7.2 Modelo de Factura (`invoice.model.ts`)

```typescript
export type InvoiceStatus = 'ISSUED' | 'CANCELLED';

export interface InvoiceDetail {
  id:              number;
  invoice_id:      number;
  company_id:      number;
  product_id?:     number | null;
  tax_rate_id?:    number | null;
  product_name:    string;        // snapshot del nombre al momento de emisión
  quantity:        number;
  unit_price:      number;
  tax_percentage:  number;
  tax_amount:      number;
  line_subtotal:   number;
  line_total:      number;
  created_at:      string;
}

export interface Invoice {
  id:             number;
  invoice_number: string;         // Ej: FAC-000001
  issue_date:     string;
  subtotal:       number;
  tax_amount:     number;
  total:          number;
  status:         InvoiceStatus;
  customer?:      Customer | null;
  details?:       InvoiceDetail[];
}

export interface CreateInvoiceDto {
  customer_id?: number;
  issue_date?:  string;
  items: {
    product_id?:   number;
    product_name?: string;  // permite items sin producto del catálogo
    quantity:      number;
    unit_price:    number;
    tax_rate_id?:  number;
  }[];
}
```

### 7.3 Modelo de Producto (`product.model.ts`)

```typescript
export type StockMovementType  = 'IN' | 'OUT' | 'ADJUSTMENT';
export type StockReferenceType = 'PURCHASE' | 'SALE' | 'MANUAL';

export interface Product {
  id:             number;
  company_id:     number;
  supplier_id?:   number | null;
  tax_rate_id?:   number | null;
  sku?:           string | null;
  name:           string;
  purchase_price: number;
  sale_price:     number;
  stock:          number;
  min_stock:      number;         // umbral de alerta de inventario bajo
  status:         'ACTIVE' | 'INACTIVE';
}

export interface AdjustStockDto {
  quantity:       number;
  movement_type:  StockMovementType;
  reference_type: StockReferenceType;
  notes?:         string;
}
```

### 7.4 Modelo de Cliente (`customer.model.ts`)

```typescript
export type CustomerType = 'CEDULA' | 'RUC' | 'FINAL_CONSUMER';

export interface Customer {
  id:              number;
  company_id:      number;
  customer_type:   CustomerType;
  document_number: string;       // CI o RUC según tipo
  full_name:       string;
  email?:          string | null;
  phone?:          string | null;
  address?:        string | null;
}
```

### 7.5 Contratos de respuesta paginada (`pagination.model.ts`)

```typescript
// Wrapper de respuesta singular del backend
export interface ApiResponse<T> {
  success: boolean;
  data:    T;
}

// Wrapper de respuesta paginada del backend
export interface ApiListResponse<T> {
  success: boolean;
  data:    T[];
  pagination: {
    total:        number;
    total_pages:  number;
    current_page: number;
    per_page:     number;
  };
}

// Parámetros de paginación para query strings
export interface PaginationParams {
  page?:   number;
  limit?:  number;
  search?: string;
  status?: string;
  [key: string]: string | number | boolean | undefined;
}
```

---

## 8. Capa Core: Servicios

### 8.1 ApiService — Wrapper HTTP Genérico

`ApiService` encapsula `HttpClient` y provee un API homogéneo para todos los servicios de dominio. Elimina la repetición de la URL base y la construcción de `HttpParams`:

```typescript
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http    = inject(HttpClient);
  private baseUrl = environment.apiUrl;   // inyectado desde environment.*

  private buildParams(
    params?: Record<string, string | number | boolean | undefined>
  ): HttpParams {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }
    return httpParams;
  }

  get<T>(path: string, params?: Record<string, ...>): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${path}`, { params: this.buildParams(params) });
  }

  post<T>(path: string, body: unknown):  Observable<T> { ... }
  put<T>(path: string, body: unknown):   Observable<T> { ... }
  patch<T>(path: string, body?: unknown): Observable<T> { ... }
  delete<T>(path: string):               Observable<T> { ... }
}
```

### 8.2 Patrón de servicio de dominio

Todos los servicios de dominio siguen el mismo patrón: inyectan `ApiService`, tipan sus respuestas con los genéricos y exponen `Observable<T>`:

```typescript
// Ejemplo: CustomersService
@Injectable({ providedIn: 'root' })
export class CustomersService {
  private api = inject(ApiService);

  getAll(params?: PaginationParams): Observable<ApiListResponse<Customer>> {
    return this.api.get<ApiListResponse<Customer>>('/customers', params);
  }

  getById(id: number): Observable<ApiResponse<Customer>> {
    return this.api.get<ApiResponse<Customer>>(`/customers/${id}`);
  }

  create(dto: CreateCustomerDto): Observable<ApiResponse<Customer>> {
    return this.api.post<ApiResponse<Customer>>('/customers', dto);
  }

  update(id: number, dto: UpdateCustomerDto): Observable<ApiResponse<Customer>> {
    return this.api.put<ApiResponse<Customer>>(`/customers/${id}`, dto);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.api.delete<ApiResponse<void>>(`/customers/${id}`);
  }
}
```

---

## 9. Autenticación y Gestión de Sesión

### 9.1 AuthService — Signal-based

`AuthService` utiliza un `signal<AuthUser | null>` como fuente de verdad del usuario autenticado. Todos los estados derivados (roles, permisos) se calculan con `computed()`, garantizando consistencia sin suscripciones manuales:

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private api    = inject(ApiService);
  private router = inject(Router);

  // Fuente de verdad reactiva
  currentUser   = signal<AuthUser | null>(null);

  // Estados derivados — se recalculan automáticamente cuando currentUser cambia
  isAuthenticated  = computed(() => !!this.currentUser());
  role             = computed(() => this.currentUser()?.role?.name);
  isSystemUser     = computed(() => !this.currentUser()?.company);   // usuario de plataforma
  isPlatformUser   = computed(() => this.currentUser()?.role?.scope === 'PLATFORM');
  isPlatformAdmin  = computed(() => this.currentUser()?.role?.name === 'PLATFORM_ADMIN');
  isStoreAdmin     = computed(() => this.currentUser()?.role?.name === 'STORE_ADMIN');
  isStoreUser      = computed(() => this.currentUser()?.role?.scope === 'STORE');
  isStoreWarehouse = computed(() => this.currentUser()?.role?.name === 'STORE_WAREHOUSE');

  constructor() {
    this.loadFromStorage();  // hidrata el signal desde localStorage al iniciar la app
  }
}
```

### 9.2 Flujo de Login

```
POST /api/auth/login  { email, password }
           │
           ▼  Backend retorna:
           │  { success, access_token, refresh_token, user: AuthUser }
           │
           ▼  AuthService.login() ejecuta tap():
           │    localStorage.setItem('pf_token',   access_token)
           │    localStorage.setItem('pf_refresh',  refresh_token)
           │    localStorage.setItem('pf_user',     JSON.stringify(user))
           │    this.currentUser.set(user)         ← Signal actualizado
           │
           ▼  Componente suscrito navega a /dashboard
```

### 9.3 Estrategia de tokens

| Clave localStorage | Contenido | Uso |
|---|---|---|
| `pf_token` | JWT de acceso (corta duración) | Adjuntado en cada petición HTTP por `tokenInterceptor` |
| `pf_refresh` | Token de renovación (larga duración) | Enviado a `/auth/refresh` cuando el JWT expira (401) |
| `pf_user` | `AuthUser` serializado (JSON) | Hidratación del signal en el reload de página |

### 9.4 Renovación automática de token

```
Request normal →  tokenInterceptor → Backend
                                           │
                               Si 401 Unauthorized y no es /auth/refresh:
                                           │
                                           ▼
                             POST /api/auth/refresh  { refresh_token }
                                           │
                               Si OK: actualiza pf_token en localStorage
                                      reintenta la request original con nuevo token
                                           │
                               Si falla: authService.logout() → redirige a /login
```

Implementación en `token.interceptor.ts`:

```typescript
export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token       = localStorage.getItem('pf_token');
  const authReq     = token ? addAuthHeader(req, token) : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Solo hace refresh si: es 401, no es la propia ruta de refresh, no es login
      if (error.status === 401
          && !req.url.includes('/auth/refresh')
          && !req.url.includes('/auth/login')) {
        return authService.refreshToken().pipe(
          switchMap(res => {
            const retryReq = addAuthHeader(req, res.access_token);
            return next(retryReq);   // reintento transparente
          }),
          catchError(refreshError => {
            authService.logout();    // sesión inrecuperable
            return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
```

---

## 10. Control de Acceso Basado en Roles (RBAC)

### 10.1 Jerarquía de roles

```
Scope: PLATFORM                          Scope: STORE
─────────────────                        ───────────────────────────
PLATFORM_ADMIN                           STORE_ADMIN
 └─ Acceso total                          └─ Gestión completa de la empresa
 └─ Crea PLATFORM_STAFF                  
                                         STORE_SELLER
PLATFORM_STAFF                            └─ Clientes, facturas (lectura/escritura)
 └─ Soporte: empresas, logs              
 └─ No puede crear admins de plataforma  STORE_WAREHOUSE
                                          └─ Productos, inventario
```

### 10.2 authGuard — Verificación de sesión activa

```typescript
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router      = inject(Router);

  const token = authService.getToken();
  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  // Si el signal ya tiene usuario (ej. recarga en misma sesión), permite inmediatamente
  if (authService.currentUser()) {
    return true;
  }

  // Si el token existe pero el signal está vacío (ej. primer load), valida con /auth/me
  return authService.me().pipe(
    map(() => true),
    catchError(() => {
      authService.logout();
      return of(false);
    })
  );
};
```

### 10.3 permissionGuard — RBAC por metadatos de ruta

El guard lee los datos estáticos (`data`) de la ruta activa y aplica la política correspondiente:

```typescript
export const permissionGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  const requirePlatformAdmin = route.data['platformAdmin'] ?? false;
  const requirePlatform      = route.data['platform']      ?? false;
  const adminOnly            = route.data['adminOnly']     ?? false;
  const requiredRoles        = adminOnly ? ['STORE_ADMIN'] : (route.data['roles'] ?? []);

  // Política 1: exclusivo PLATFORM_ADMIN
  if (requirePlatformAdmin) {
    if (auth.isPlatformAdmin()) return true;
    router.navigate(['/dashboard']);
    return false;
  }

  // Política 2: cualquier usuario de plataforma (PLATFORM_ADMIN o PLATFORM_STAFF)
  if (requirePlatform) {
    if (auth.isSystemUser()) return true;
    router.navigate(['/dashboard']);
    return false;
  }

  // Política 3: los usuarios de plataforma bypasean todos los guards de tienda
  // (pueden acceder a cualquier empresa en modo soporte)
  if (auth.isSystemUser()) return true;

  // Política 4: sin roles requeridos → cualquier usuario autenticado de tienda
  if (requiredRoles.length === 0) return true;

  // Política 5: verifica si el usuario tiene alguno de los roles requeridos
  if (auth.hasRole(...requiredRoles)) return true;

  router.navigate(['/dashboard']);
  return false;
};
```

### 10.4 Metadatos de ruta soportados

| Clave `data` | Tipo | Efecto |
|---|---|---|
| `platform: true` | boolean | Acceso solo para scope PLATFORM (admin o staff) |
| `platformAdmin: true` | boolean | Acceso exclusivo para `PLATFORM_ADMIN` |
| `adminOnly: true` | boolean | Alias para `roles: ['STORE_ADMIN']` |
| `roles: string[]` | string[] | Array de roles válidos (OR lógico) |

---

## 11. Pipeline de Interceptores HTTP

Los tres interceptores se registran en `app.config.ts` mediante `withInterceptors([...])` y se ejecutan **en el orden declarado** para las requests salientes (y en orden inverso para las respuestas entrantes).

### 11.1 tokenInterceptor

- Adjunta `Authorization: Bearer <token>` a todas las peticiones salientes
- Implementa refresh automático del JWT ante respuesta 401
- Evita el loop infinito excluyendo las rutas `/auth/refresh` y `/auth/login`

### 11.2 clientViewInterceptor

Mecanismo central de la multi-tenencia en el frontend. Cuando un administrador de plataforma impersona una empresa, este interceptor inyecta el `company_id` como query param en cada petición:

```typescript
export const clientViewInterceptor: HttpInterceptorFn = (req, next) => {
  const adminView = inject(AdminViewService);
  const company   = adminView.viewedCompany();  // Signal: empresa seleccionada o null

  if (!company) return next(req);  // sin impersonación → pass-through

  // Las rutas de plataforma y auth no necesitan company_id
  if (req.url.includes('/platform/') || req.url.includes('/auth/')) {
    return next(req);
  }

  // Clona la request e inyecta company_id como query param
  const modified = req.clone({
    params: req.params.set('company_id', company.id.toString()),
  });

  return next(modified);
};
```

### 11.3 errorInterceptor

Intercepta todas las respuestas de error HTTP y muestra una notificación contextual al usuario mediante `MatSnackBar`. Mapea códigos de estado a mensajes en español:

```typescript
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let message = 'Ha ocurrido un error inesperado';

      // Extrae mensaje del body de error si existe
      if (error.error?.message) {
        message = Array.isArray(error.error.message)
          ? error.error.message[0]
          : error.error.message;
      }

      // Mapeo de códigos HTTP a mensajes de usuario
      if      (error.status === 0)    message = 'No se pudo conectar con el servidor';
      else if (error.status === 403)  message = 'No tienes permiso para realizar esta acción';
      else if (error.status === 404)  message = 'El recurso solicitado no fue encontrado';
      else if (error.status === 422)  message = error.error?.message || 'Error de validación';
      else if (error.status >= 500)   message = 'Error interno del servidor';

      // Los 401 son manejados por tokenInterceptor; no mostrar snackbar
      if (error.status !== 401) {
        snackBar.open(message, 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar'],
          horizontalPosition: 'right',
          verticalPosition: 'top',
        });
      }

      return throwError(() => error);
    })
  );
};
```

---

## 12. Arquitectura Multi-Tenant

### 12.1 Modelo de multi-tenencia

PymeFlow EC implementa el modelo **shared database, shared schema** con discriminación por `company_id` en cada tabla del backend. El frontend refuerza este aislamiento mediante tres mecanismos:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MECANISMOS DE MULTI-TENENCIA (Frontend)          │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  1. Scoping por JWT                                         │    │
│  │  El JWT del usuario ya contiene company_id. El backend      │    │
│  │  valida y filtra por el tenant del token.                   │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  2. Impersonación vía clientViewInterceptor                 │    │
│  │  PLATFORM_ADMIN selecciona empresa → AdminViewService       │    │
│  │  guarda Signal<Company> → interceptor inyecta              │    │
│  │  ?company_id=X en todas las peticiones de store.           │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  3. Module Gating en Sidebar                               │    │
│  │  CompanyModulesService consulta módulos habilitados.       │    │
│  │  SidebarComponent filtra ítems de navegación               │    │
│  │  según estado del módulo: APPROVED / PENDING.              │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### 12.2 Ciclo de vida de una empresa en la plataforma

```
REGISTRO                    ACTIVACIÓN                  OPERACIÓN
─────────────────────────────────────────────────────────────────────
Usuario registra empresa     PLATFORM_ADMIN              STORE_ADMIN
  POST /auth/register   →    activa empresa   →          gestiona su empresa
  company.status = PENDING   company.status = ACTIVE     con sus usuarios y módulos
                              │
                              ├─ Aprueba módulos solicitados
                              ├─ Puede suspender: status = SUSPENDED
                              └─ Puede ver audit logs de la empresa
```

### 12.3 Estados de empresa

| Estado | Descripción |
|---|---|
| `PENDING` | Registro recibido, pendiente de activación por PLATFORM_ADMIN |
| `ACTIVE` | Empresa operativa, puede usar los módulos aprobados |
| `INACTIVE` | Suscripción expirada o deshabilitada voluntariamente |
| `SUSPENDED` | Suspendida por incumplimiento; acceso bloqueado temporalmente |

---

## 13. Gestión de Estado Reactivo

El frontend no incorpora librerías de gestión de estado externas (NgRx, Akita, Elf). La decisión es intencional: Angular 17 provee primitivos suficientemente expresivos para la complejidad actual de la aplicación.

### 13.1 Estrategia por capa

| Capa | Mecanismo | Justificación |
|---|---|---|
| **Estado de sesión global** | `signal<AuthUser \| null>` en `AuthService` | Acceso síncrono sin suscripción; auto-recálculo de estados derivados |
| **Estados derivados de rol** | `computed(() => ...)` | Dependencia automática del signal; consistencia garantizada |
| **Datos asíncronos del servidor** | `Observable<T>` desde servicios de dominio | RxJS provee cancelación, composición y manejo de errores |
| **Estado de impersonación** | `signal<Company \| null>` en `AdminViewService` | Síncrono; leído en cada request por el interceptor |
| **Estado local de formulario** | Variables de componente + `FormGroup` | Estado encapsulado; no afecta a otros componentes |

### 13.2 Por qué no NgRx

NgRx introduce un overhead significativo (acciones, reducers, efectos, selectores) apropiado para aplicaciones con estado global muy distribuido. En PymeFlow EC, el único estado verdaderamente global es la sesión del usuario, que se gestiona eficientemente con un Signal. El resto del estado vive en componentes o se obtiene directamente de la API.

---

## 14. Módulos Funcionales del ERP

### 14.1 Dashboard

Panel principal de indicadores de gestión. Combina `DashboardService` (métricas del backend) con componentes `StatCard` (shared) y gráficas de `ng-apexcharts`. Las opciones de ApexCharts se inicializan en una propiedad del componente (no en un getter) para evitar reevaluaciones infinitas que congelarían el browser.

### 14.2 Gestión de Clientes

Soporta los tres tipos de identificación fiscal vigentes en Ecuador:

| `CustomerType` | Identificador | Emisor |
|---|---|---|
| `CEDULA` | Cédula de identidad (10 dígitos) | Registro Civil |
| `RUC` | Registro Único de Contribuyentes (13 dígitos) | SRI |
| `FINAL_CONSUMER` | Sin identificación (consumidor final) | — |

El formulario `ClientFormComponent` es reutilizado para creación y edición mediante la detección del parámetro `:id` en la ruta activa.

### 14.3 Catálogo de Productos e Inventario

Los productos registran precio de compra (`purchase_price`) y precio de venta (`sale_price`) de forma independiente, permitiendo calcular márgenes. El control de stock se gestiona mediante movimientos tipados:

| `StockMovementType` | `StockReferenceType` | Descripción |
|---|---|---|
| `IN` | `PURCHASE` | Entrada por compra a proveedor |
| `OUT` | `SALE` | Salida por venta (automática al emitir factura) |
| `ADJUSTMENT` | `MANUAL` | Corrección manual por inventario físico |

El ajuste de stock se realiza desde un `MatDialog` (`StockAdjustDialogComponent`) sin navegar fuera de la lista de productos.

### 14.4 Facturación

Módulo central del ERP. El flujo de emisión opera en `InvoiceCreateComponent`:

```
Seleccionar cliente (opcional para consumidor final)
            │
            ▼
Agregar líneas de detalle:
  - Buscar producto del catálogo (autocomplete)
  - O ingresar descripción libre
  - Cantidad + precio unitario + tasa de impuesto
            │
            ▼
Cálculo automático:
  line_subtotal = quantity × unit_price
  tax_amount    = line_subtotal × (tax_percentage / 100)
  line_total    = line_subtotal + tax_amount
            │
            ▼
POST /api/invoices  → { invoice_number, status: 'ISSUED', ... }
            │
            ▼
Redirige a InvoiceDetailComponent
  donde el usuario puede descargar el PDF
```

### 14.5 Administración de la Plataforma

Conjunto de vistas exclusivas para el operador SaaS:

| Vista | Funcionalidad técnica |
|---|---|
| `CompaniesListComponent` | Lista paginada de empresas con filtro por estado |
| `CompanyDetailComponent` | Detalle de empresa: módulos activos, usuarios, cambio de estado |
| `AuditLogsComponent` | Visor de `AuditLog` con filtros por empresa, acción y fecha |
| `SupportUsersListComponent` | CRUD de usuarios `PLATFORM_STAFF` (solo `PLATFORM_ADMIN`) |
| `ModuleRequestsListComponent` | Cola de solicitudes de módulos pendientes de aprobación |

---

## 15. Generación de PDF Client-Side

`InvoicePdfService` utiliza la librería **pdfmake** para construir y descargar facturas en PDF directamente en el navegador, sin requerir ningún endpoint de servidor dedicado para documentos.

### 15.1 Estructura del documento generado

```
┌─────────────────────────────────────────────────────┐
│  LOGO / NOMBRE EMPRESA          FACTURA              │
│  Dirección · RUC · Email        Nº: FAC-000001       │
│                                 Fecha: 2025-06-15    │
├─────────────────────────────────────────────────────┤
│  CLIENTE                                             │
│  Nombre: Juan Pérez                                  │
│  Tipo: CEDULA · Doc: 0102030405                      │
├──────────────────────┬──────┬───────┬───────┬───────┤
│  Descripción         │ Cant │ P.U.  │  IVA  │ Total │
├──────────────────────┼──────┼───────┼───────┼───────┤
│  Producto A          │  2   │ 10.00 │ 1.50  │ 21.50 │
│  Servicio B          │  1   │ 50.00 │ 6.00  │ 56.00 │
├──────────────────────┴──────┴───────┴───────┴───────┤
│                              Subtotal:       77.50   │
│                              IVA (15%):       7.50   │
│                              TOTAL:          85.00   │
└─────────────────────────────────────────────────────┘
```

### 15.2 Configuración de pdfmake en angular.json

pdfmake usa módulos CommonJS. Angular CLI 17 los lista explícitamente en `allowedCommonJsDependencies` para suprimir advertencias de build:

```json
"allowedCommonJsDependencies": [
  "pdfmake",
  "pdfmake/build/pdfmake",
  "pdfmake/build/vfs_fonts"
]
```

---

## 16. Sistema de Estilos y Theming

### 16.1 Arquitectura híbrida Material + Tailwind

La aplicación combina dos sistemas de diseño complementarios:

| Sistema | Responsabilidad |
|---|---|
| **Angular Material** | Componentes interactivos: `mat-table`, `mat-form-field`, `mat-dialog`, `mat-snackbar`, `mat-paginator`, `mat-select` |
| **Tailwind CSS** | Layout, espaciado, tipografía, colores de fondo, tarjetas, animaciones |

Para que ambos sistemas coexistan sin conflictos de CSS, el `preflight` de Tailwind (que hace un reset del navegador) está **deshabilitado**:

```javascript
// tailwind.config.js
module.exports = {
  corePlugins: {
    preflight: false,   // Angular Material maneja sus propios resets CSS
  },
  // ...
};
```

### 16.2 Paleta de colores personalizada

```javascript
// tailwind.config.js — paleta primaria índigo
colors: {
  primary: {
    50:  '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',   // ← primary.DEFAULT (usado en botones, enlaces, highlights)
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
  }
}
```

### 16.3 Animaciones CSS definidas

| Nombre | Definición | Uso |
|---|---|---|
| `fade-in` | `opacity: 0→1` en 0.25s ease-out | Aparición de paneles y cards |
| `slide-up` | `translateY(20px)→0 + opacity 0→1` en 0.3s | Modales y formularios |
| `shimmer` | `backgroundPosition` animado | Skeletons de carga |

### 16.4 Sombras de card personalizadas

```javascript
boxShadow: {
  'card':    '0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.07)',
  'card-md': '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)',
}
```

### 16.5 Dark Mode

Habilitado mediante la estrategia `class` de Tailwind. `ThemeService` agrega o remueve la clase `dark` en el `<html>` raíz, lo que activa automáticamente todas las variantes `dark:` definidas en los componentes.

---

## 17. Configuración de Entornos y Build

### 17.1 Configuración de entornos

```typescript
// src/environments/environment.ts (desarrollo)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'
};

// src/environments/environment.prod.ts (producción)
export const environment = {
  production: true,
  apiUrl: 'https://api.tesisfernandonavaspuce.es/api'
};
```

Angular CLI reemplaza automáticamente `environment.ts` por `environment.prod.ts` durante `ng build --configuration production` mediante la directiva `fileReplacements` en `angular.json`.

### 17.2 Configuración TypeScript (strict mode)

```json
// tsconfig.json (opciones relevantes)
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "angularCompilerOptions": {
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true,
    "strictTemplates": true          // type checking en templates HTML
  }
}
```

### 17.3 Presupuestos de bundle (angular.json)

| Tipo | Warning | Error |
|---|---|---|
| Bundle inicial (JS + CSS) | 500 KB | 1 MB |
| Estilo por componente | 16 KB | 32 KB |

### 17.4 Optimizaciones de producción

| Técnica | Efecto |
|---|---|
| Tree-shaking (esbuild) | Elimina código no referenciado |
| Minificación JS + CSS | Reducción de tamaño de transferencia |
| Hashing de artefactos | Cache busting automático en deployments |
| Code splitting por ruta | Bundle inicial mínimo; chunks cargados bajo demanda |
| `loadComponent()` por ruta | Un chunk JS por componente lazy |

---

## 18. Instalación y Ejecución

### 18.1 Pre-requisitos

| Herramienta | Versión mínima |
|---|---|
| Node.js | 18.x LTS |
| npm | 9.x |
| Angular CLI | 17.x (`npm i -g @angular/cli@17`) |

### 18.2 Pasos de instalación

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd pymeflowec-front

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npm start
# → http://localhost:5173
# → Conecta con el backend en http://localhost:8080/api

# 4. Compilar para producción
npm run build
# → Artefactos en dist/pymeflowec-frontend/
# → API apunta a https://api.tesisfernandonavaspuce.es/api
```

### 18.3 Scripts disponibles

| Script | Comando Angular | Descripción |
|---|---|---|
| `npm start` | `ng serve --port 5173` | Servidor de desarrollo con HMR |
| `npm run build` | `ng build` | Build de producción optimizado |
| `npm run watch` | `ng build --watch --configuration development` | Compilación incremental en desarrollo |

> **Requisito de backend:** El servidor Spring Boot debe estar ejecutándose en `http://localhost:8080` para que la aplicación funcione en modo desarrollo. Las variables de entorno de producción apuntan al servidor desplegado.

---

## 19. Patrones y Decisiones de Diseño

### 19.1 Standalone Components (eliminación de NgModules)

Angular 17 consolida el modelo de Standalone Components introducido en Angular 14. Cada componente declara sus propias dependencias en el array `imports` de `@Component`, eliminando la indirección de los `NgModule`. Esto permite:

- **Lazy loading a nivel de componente**: `loadComponent()` crea un chunk JS por componente, reduciendo el bundle inicial
- **Árbol de dependencias explícito**: las imports de cada componente son autocontenidas y visibles en el mismo archivo
- **Tree-shaking más eficiente**: el bundler puede eliminar código no referenciado con mayor precisión

### 19.2 Functional Guards e Interceptors

Angular 15+ introduce `CanActivateFn` e `HttpInterceptorFn` como alternativas funcionales a las clases con interfaces. El proyecto usa exclusivamente el enfoque funcional:

```typescript
// Interceptor funcional — sin clase, sin constructor, inject() disponible
export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);  // DI sin constructor
  // ...
};

// Guard funcional
export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  // ...
};
```

**Ventajas frente al enfoque de clase:**
- Menos boilerplate (sin `implements CanActivate`, sin constructor)
- `inject()` disponible directamente sin necesidad de pasar dependencias manualmente
- Composición más sencilla (son funciones puras combinables)

### 19.3 Signals como primitivo de estado global

El `AuthService` abandona el patrón `BehaviorSubject` + `asObservable()` en favor de Signals nativos de Angular 17:

| Patrón anterior (RxJS) | Patrón actual (Signals) |
|---|---|
| `private _user$ = new BehaviorSubject<AuthUser\|null>(null)` | `currentUser = signal<AuthUser\|null>(null)` |
| `user$ = this._user$.asObservable()` | — |
| `this._user$.next(user)` | `this.currentUser.set(user)` |
| `isAdmin$ = this.user$.pipe(map(u => u?.role === 'ADMIN'))` | `isAdmin = computed(() => currentUser()?.role === 'ADMIN')` |
| `ngOnDestroy + unsubscribe` | No necesario (sin suscripciones) |

Los `computed()` se recalculan automáticamente cuando el signal del que dependen cambia, garantizando consistencia de estado sin gestión manual de suscripciones.

### 19.4 Formulario único para creación y edición

`ClientFormComponent`, `ProductFormComponent`, `SupplierFormComponent` y otros formularios son componentes únicos que sirven tanto para crear como para editar el recurso. La diferenciación se realiza leyendo el parámetro `:id` de la URL activa:

```typescript
// Patrón en formularios reutilizables
export class ClientFormComponent implements OnInit {
  isEditMode = false;
  customerId: number | null = null;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.customerId = +id;
      this.loadCustomer(this.customerId);  // pre-popula el formulario
    }
  }
}
```

### 19.5 Theming híbrido sin conflictos

La combinación de Angular Material y Tailwind CSS en el mismo proyecto requiere deshabilitar el `preflight` de Tailwind para evitar que el reset CSS de Tailwind sobrescriba los estilos base que Material necesita. Esta es una decisión de arquitectura de estilos documentada directamente en `tailwind.config.js`.

### 19.6 Localización al español (Ecuador)

La aplicación está completamente localizada sin dependencia de `@angular/localize`:

- `MatPaginatorIntl` personalizado con textos en español
- `errorInterceptor` mapea todos los códigos HTTP a mensajes en español
- Todas las etiquetas de UI, botones, títulos y mensajes de validación están en español
- Formatos de fecha adaptados al contexto ecuatoriano (`dd/MM/yyyy`)

---

## Autor

**Fernando Navas**  
Trabajo de Titulación — Ingeniería en Sistemas / Computación  
Ecuador, 2025

---

*PymeFlow EC es un sistema desarrollado como demostración de una solución SaaS empresarial aplicable al contexto de las PyMEs ecuatorianas. El proyecto abarca el diseño arquitectónico, la implementación frontend con Angular 17 y su integración con una API REST bajo principios de multi-tenencia, seguridad basada en roles y generación de documentos fiscales.*





# PymeFlowEc — Frontend Angular

Proyecto de tesis. ERP multi-tenant para PYMEs ecuatorianas.
**Stack:** Angular 17+ · SCSS · Angular Material · Tailwind · ApexCharts
**Backend:** `http://localhost:8080` · **Frontend dev:** `http://localhost:5173` (o `ng serve`)

---

## Arquitectura clave

```
src/app/
├── core/
│   ├── guards/          — authGuard, permissionGuard, roleGuard  ← NO TOCAR
│   ├── interceptors/    — token, error, client-view             ← NO TOCAR
│   ├── models/          — Invoice, Product, User, Role, etc.    ← NO TOCAR
│   └── services/        — toda la capa HTTP + theme.service.ts  ← NO TOCAR (salvo theme)
├── features/            — pantallas de la app (ver lista abajo)
├── layout/              — sidebar, topbar, main-layout
└── shared/components/   — stat-card, status-badge, confirm-dialog, coming-soon
```

**No modificar nunca:** rutas (`app.routes.ts`), guards, interceptors, modelos ni servicios HTTP.
La migración es solo de **capa de presentación**: templates HTML + SCSS.

---

## Design handoff

El paquete de diseño definitivo está en:
```
C:\Users\navas\.claude\projects\...\design-handoff\pymeflowec\project\angular-handoff\
```
Archivos clave:
- `auth.component.scss` — estilos para Login y Register (layout `.auth-wrap` / `.aside` / `.main-col`)
- `landing.component.scss` — estilos para Landing (`landing-nav`, `.hero`, `.section`, `.f-card`, `.price-card`, `.cta-banner`)
- `login.component.ts` — plantilla de referencia para Login
- `register.component.ts` — plantilla de referencia para Register
- `landing.component.ts` — plantilla de referencia para Landing

### Token aliases (en `styles.scss`)
Los componentes del handoff usan nombres cortos (`--border`, `--text`, `--radius`). Se añadieron aliases en `:root`:
```scss
--border: var(--border-ds);  --text: var(--text-ds);  --radius: var(--radius-ds); etc.
```

---

## Migración del prototipo React → Angular

El prototipo de referencia también está en `pymeflowec/project/src/` (archivos JSX/HTML).
**El prototipo es React — no se copia pegando. Se reescribe el template en Angular usando las mismas clases CSS.**

### Nomenclatura de clases CSS

El design system usa prefijo `ds-` solo donde el nombre ya existía en Material/Tailwind:

| Clase prototipo | Clase Angular (global) | Nota |
|---|---|---|
| `.sidebar` | `.ds-sidebar` | evita conflicto con Material |
| `.topbar` | `.ds-topbar` | evita conflicto |
| `.table` | `.ds-table` | evita conflicto con Tailwind |
| `.tabs` / `.tab` | `.ds-tabs` / `.ds-tab` | evita conflicto |
| `.alert` | `.ds-alert` | evita conflicto |
| `.modal` | `.ds-modal` | evita conflicto |
| `.avatar` | `.ds-avatar` | evita conflicto |
| `.stack` | `.ds-stack` | evita conflicto |
| Resto: `.btn`, `.card`, `.kpi`, `.badge`, `.drawer`, `.filters`, etc. | igual que prototipo | sin prefijo |

### Tokens CSS disponibles (definidos en `styles.scss`)

```scss
--bg, --surface, --surface-2, --surface-3
--border-ds, --border-strong-ds   (alias cortos: --border, --border-strong)
--text-ds, --text-muted-ds, --text-subtle  (alias: --text, --text-muted)
--accent, --accent-hover, --accent-soft, --accent-soft-strong, --on-accent
--success, --success-soft, --warn, --warn-soft, --danger, --danger-soft
--radius-ds (10px), --radius-sm-ds (6px), --radius-lg-ds (14px)  (alias: --radius, --radius-sm, --radius-lg)
--shadow-sm-ds, --shadow-ds, --shadow-lg-ds  (alias: --shadow-sm, --shadow, --shadow-lg)
--font-ui, --font-display, --font-mono
--sidebar-w (248px), --sidebar-w-collapsed (64px), --topbar-h (60px)
--density-row, --density-gap, --density-pad
```

Dark mode: `[data-theme="dark"]` en `<html>` (escrito por `ThemeService`).
Density: `[data-density="compact"]` en `<html>`.
Accent: `[data-accent="emerald|amber"]` en `<html>`.

---

## Estado de la migración

### ✅ Fase 1 — Fundaciones (COMPLETA)
- `src/index.html` — Fuentes: Inter Tight (400–800) + JetBrains Mono (400–600) añadidas
- `src/styles.scss` — Tokens + ~40 clases utilitarias + aliases + `.platform-banner`, `.page-tabs`, `.modal-backdrop`, `.mfield`, `.m-input`, `.seg`, `.btn-spinner`, etc.
- `src/app/core/services/theme.service.ts` — `apply()` escribe `data-theme` en `<html>`

### ✅ Fase 2 — Shell (COMPLETA)
- [x] `shared/components/app-icon/app-icon.component.ts` — ~60 SVGs Lucide inline; inputs: `name`, `size`(18), `strokeWidth`(1.75). Iconos añadidos: `sparkles`, `building`, `puzzle`
- [x] `layout/main-layout/` — wrapper `.app`, `<main class="ds-content">`
- [x] `layout/sidebar/` — `.ds-sidebar`, nav groups, `<app-icon>`
- [x] `layout/topbar/` — `.ds-topbar`, user menu, `<app-icon>`

### ✅ Fase 3 — Pantallas

| # | Pantalla | Estado | Notas |
|---|---|---|---|
| 1 | Dashboard | ✅ | KPIs + SVG sparklines inline + SVG bar chart (sin ApexCharts). Tabs de rango (7d/30d/90d) |
| 2 | Facturas — lista | ✅ | `ds-tabs` Todas/Emitidas/Canceladas + búsqueda. Drawer inline al hacer clic en fila (no navega). 9 columnas: NÚMERO·CLIENTE·VENDEDOR·ITEMS·SUBTOTAL·IVA·TOTAL·ESTADO·EMITIDA |
| 3 | Facturas — detalle | ✅ | Ruta `/invoices/:id` sigue activa como página completa (acceso directo por URL) |
| 4 | Productos — lista + ajuste stock | ✅ | `ds-tabs` Todos/Stock bajo/Agotados + búsqueda client-side. 8 columnas. `stock-adjust-dialog` |
| 5 | POS / Nueva factura | ✅ | Grid de tiles de producto + panel carrito + drawer selector de cliente. Totales reactivos con signals |
| 6 | Clientes — lista + modal | ✅ | `ds-tabs` con conteo por tipo + columnas COMPRAS/TOTAL. Modal inline: historial del cliente (`.ds-alert.accent`) cuando edita |
| 7 | Platform — Empresas | ✅ | `.platform-banner`, tabs, `.ds-table` |
| 8 | Platform — Solicitudes módulos | ✅ | Vista dual: platform vs store catalog |
| 9 | Auth — Login | ✅ | Diseño handoff: `.auth-wrap` / `.aside` / `.main-col` |
| 10 | Auth — Register | ✅ | 3 pasos: Empresa → Admin → Módulos |
| 11 | Landing | ✅ | nav, hero, features, pricing, FAQ, CTA |

### ⏳ Pendiente de migrar al nuevo diseño

| Pantalla | Archivo | Referencia | Patrón sugerido |
|---|---|---|---|
| Proveedores — lista | `features/suppliers/` | `customers.jsx` (mismo patrón) | `ds-tabs` + tabla 7 col + modal inline |
| Usuarios | `features/users/` | CRUD patrón clientes | Modal inline, roles como badges |
| Tasas de IVA | `features/tax-rates/` | CRUD patrón clientes | Tabla simple + modal inline |
| Platform — Auditoría | `features/platform/audit-logs/` | `src/screens/audit.jsx` | Filtros de fecha + tabla de eventos |
| Company detail | `features/companies/company-detail/` | — | Tabs info / módulos / usuarios |

### ⏳ Fase 4 — Limpieza (PENDIENTE)
- Desinstalar `@angular/material` cuando ningún componente lo use
- Borrar SCSS viejos componente a componente
- Dejar solo los tokens nuevos en `styles.scss`
- Revisar `invoice-detail.component` (página completa) — evaluar si se mantiene o se elimina la ruta directa

---

## Convenciones importantes

- **Iconos:** usar `<app-icon name="...">` en todos los templates nuevos. Los `mat-menu` internos pueden mantener `<mat-icon>` temporalmente.
- **Tablas:** usar `<table class="ds-table">`.
- **Tabs de pantalla:** usar `<div class="ds-tabs"><button class="ds-tab" [class.active]="...">` con `<span class="count">N</span>` dentro del botón.
- **Modales inline:** para listas (clientes, etc.) usar `@if (modalOpen())` con `.modal-backdrop` → `.modal-box`. Ver `clients-list.component.html` como referencia.
- **Drawers inline:** para paneles laterales (facturas, clientes) usar `@if (selected())` con `.drawer-backdrop` + `.drawer`. El drawer tiene `drawer-head`, `drawer-body`, `drawer-foot`.
- **Diálogos:** mantener `MatDialog` (con `ConfirmDialogComponent`) para confirmaciones destructivas.
- **Toasts:** mantener `MatSnackBar`.
- **Formularios:** `ReactiveFormsModule`. En formularios nuevos usar `.mfield` + `.m-input` (no `mat-form-field`).
- **ApexCharts:** EVITAR — reemplazar con SVG inline para sparklines y gráficos de barras simples (evita freeze del navegador).
- **Carga de datos client-side:** para pantallas con tabs + búsqueda, cargar todos los registros de una vez (`limit: 500` o `limit: 1000`) y filtrar con `computed()`. Patrón: `private allItems = signal<T[]>([])` + `filteredItems = computed(...)`.
- **`toSignal` para búsqueda:** `const q = toSignal(ctrl.valueChanges.pipe(startWith('')), { initialValue: '' })` luego usar en `computed()`.
- **Campos extra del backend:** si el backend retorna campos no definidos en el modelo TypeScript, usar `$any(obj).fieldName` en el template.
- **IVA Ecuador:** siempre 15%.
- **RUC:** 13 dígitos · **Cédula:** 10 dígitos.
- **Consumidor Final:** opción por defecto en selector de cliente.

---

## Archivos de referencia del prototipo

Todos están en `design-handoff/pymeflowec/project/`:

| Archivo | Contenido |
|---|---|
| `angular-handoff/auth.component.scss` | SCSS para Login y Register |
| `angular-handoff/landing.component.scss` | SCSS para Landing |
| `angular-handoff/login.component.ts` | Plantilla Login |
| `angular-handoff/register.component.ts` | Plantilla Register |
| `angular-handoff/landing.component.ts` | Plantilla Landing |
| `src/screens/auth.jsx` | Auth React (referencia visual) |
| `src/screens/landing.jsx` | Landing React (referencia visual) |
| `src/screens/audit.jsx` | Auditoría (pendiente) |
| `styles.css` | Design system CSS completo |

---

## Comandos útiles

```bash
ng serve                                 # dev server en localhost:4200
ng build                                 # build de producción
ng build --configuration development     # build dev (más rápido)
```
