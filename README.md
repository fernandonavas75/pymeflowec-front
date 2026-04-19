# PymeFlow EC — Frontend

> **Sistema ERP Multi-Tenant para PyMEs Ecuatorianas**  
> Trabajo de Titulación — Ingeniería en Sistemas / Computación  
> Autor: Fernando Navas

---

## Tabla de Contenidos

1. [Descripción General](#1-descripción-general)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Stack Tecnológico](#3-stack-tecnológico)
4. [Estructura del Proyecto](#4-estructura-del-proyecto)
5. [Módulos Funcionales](#5-módulos-funcionales)
6. [Autenticación y Control de Acceso](#6-autenticación-y-control-de-acceso)
7. [Multi-Tenencia](#7-multi-tenencia)
8. [Comunicación con la API](#8-comunicación-con-la-api)
9. [Gestión de Estado](#9-gestión-de-estado)
10. [Generación de Documentos](#10-generación-de-documentos)
11. [Configuración de Entornos](#11-configuración-de-entornos)
12. [Instalación y Ejecución](#12-instalación-y-ejecución)
13. [Scripts Disponibles](#13-scripts-disponibles)
14. [Rutas de la Aplicación](#14-rutas-de-la-aplicación)
15. [Patrones y Decisiones de Diseño](#15-patrones-y-decisiones-de-diseño)

---

## 1. Descripción General

**PymeFlow EC** es una plataforma web de tipo SaaS (*Software as a Service*) orientada a la gestión empresarial de pequeñas y medianas empresas (PyMEs) en el Ecuador. El sistema implementa una arquitectura **multi-tenant**, donde múltiples empresas comparten una única instancia del software manteniendo aislamiento de datos por inquilino.

Este repositorio contiene el **cliente frontend** desarrollado con Angular 17, que consume una API REST provista por el backend (Spring Boot, puerto `8080`). La interfaz cubre los flujos de negocio principales de una empresa comercial: gestión de clientes, proveedores, productos e inventario, emisión de facturas, configuración de impuestos y administración de usuarios.

Adicionalmente, el sistema incluye una capa de **administración de plataforma** exclusiva para el operador SaaS, que permite gestionar las empresas suscritas, auditar operaciones, administrar módulos habilitados y crear usuarios de soporte.

---

## 2. Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENTE (Browser)                          │
│                                                                     │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────────────────┐ │
│  │ Landing  │  │  Auth Module │  │     App Shell (Layout)        │ │
│  │  Page    │  │  login/reg   │  │  Sidebar · Topbar · Router    │ │
│  └──────────┘  └──────────────┘  └───────────────────────────────┘ │
│                                           │                         │
│              ┌────────────────────────────┼────────────────────┐    │
│              │          Feature Modules (Lazy Loaded)          │    │
│              │                                                 │    │
│  ┌──────────┐ ┌─────────┐ ┌──────────┐ ┌──────┐ ┌──────────┐  │    │
│  │Customers │ │Products │ │Suppliers │ │Invoic│ │Dashboard │  │    │
│  └──────────┘ └─────────┘ └──────────┘ └──────┘ └──────────┘  │    │
│  ┌──────────┐ ┌─────────┐ ┌──────────┐ ┌──────┐ ┌──────────┐  │    │
│  │Tax Rates │ │  Users  │ │Companies │ │ Logs │ │ Platform │  │    │
│  └──────────┘ └─────────┘ └──────────┘ └──────┘ └──────────┘  │    │
│              └─────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                      Core Layer                             │    │
│  │  Guards · Interceptors · Services · Models                  │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                              │ HTTP / REST
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│              Backend API — Spring Boot (port 8080)                  │
│         /api/auth  /api/invoices  /api/products  /api/...           │
└─────────────────────────────────────────────────────────────────────┘
```

### Principios Arquitectónicos

| Principio | Implementación |
|-----------|---------------|
| Separación de responsabilidades | Core / Features / Layout / Shared |
| Carga diferida (*Lazy Loading*) | Todas las rutas usan `loadComponent()` |
| Sin NgModules | Arquitectura 100% *Standalone Components* (Angular 17) |
| Estado reactivo | Angular Signals + `computed()` |
| HTTP centralizado | Interceptores funcionales encadenados |
| RBAC multinivel | Guards funcionales con soporte de roles anidados |

---

## 3. Stack Tecnológico

### Framework y Lenguaje

| Tecnología | Versión | Rol |
|---|---|---|
| Angular | 17.3 | Framework principal SPA |
| TypeScript | 5.4 | Lenguaje de desarrollo |
| RxJS | 7.8 | Programación reactiva / HTTP |
| Zone.js | 0.14 | Change detection |

### UI y Estilos

| Tecnología | Versión | Rol |
|---|---|---|
| Angular Material | 17.3 | Componentes UI (Material Design 3) |
| Angular CDK | 17.3 | Primitivos de layout e interacción |
| Tailwind CSS | 3.4 | Utilidades CSS, theming personalizado |
| PostCSS + Autoprefixer | 8.4 / 10.4 | Procesamiento de estilos |
| SCSS | — | Preprocesador de hojas de estilo |

### Librerías de Dominio

| Librería | Versión | Uso |
|---|---|---|
| ApexCharts + ng-apexcharts | 3.48 / 1.10 | Gráficas del dashboard analítico |
| pdfmake | 0.3.7 | Generación de facturas en PDF client-side |

### Herramientas de Build

| Herramienta | Rol |
|---|---|
| Angular CLI 17 | Scaffolding, build, serve |
| esbuild (via Angular) | Bundler de producción |
| Vite (dev server) | Servidor de desarrollo (puerto 5173) |

---

## 4. Estructura del Proyecto

```
pymeflowec-front/
├── src/
│   ├── app/
│   │   ├── core/                        # Núcleo transversal
│   │   │   ├── guards/
│   │   │   │   ├── auth.guard.ts        # Valida sesión JWT activa
│   │   │   │   ├── permission.guard.ts  # RBAC por ruta
│   │   │   │   └── role.guard.ts        # Validación de rol específico
│   │   │   ├── interceptors/
│   │   │   │   ├── token.interceptor.ts       # Inyección Bearer + refresh
│   │   │   │   ├── error.interceptor.ts       # Manejo centralizado de errores
│   │   │   │   └── client-view.interceptor.ts # Scoping de company_id
│   │   │   ├── models/
│   │   │   │   ├── auth.model.ts
│   │   │   │   ├── company.model.ts
│   │   │   │   ├── customer.model.ts
│   │   │   │   ├── invoice.model.ts
│   │   │   │   ├── product.model.ts
│   │   │   │   ├── supplier.model.ts
│   │   │   │   ├── user.model.ts
│   │   │   │   ├── tax-rate.model.ts
│   │   │   │   ├── pagination.model.ts
│   │   │   │   ├── audit-log.model.ts
│   │   │   │   └── module-request.model.ts
│   │   │   └── services/
│   │   │       ├── auth.service.ts
│   │   │       ├── api.service.ts            # Wrapper HTTP genérico
│   │   │       ├── customers.service.ts
│   │   │       ├── products.service.ts
│   │   │       ├── suppliers.service.ts
│   │   │       ├── invoices.service.ts
│   │   │       ├── users.service.ts
│   │   │       ├── companies.service.ts
│   │   │       ├── tax-rates.service.ts
│   │   │       ├── dashboard.service.ts
│   │   │       ├── invoice-pdf.service.ts
│   │   │       ├── audit-logs.service.ts
│   │   │       ├── module-request.service.ts
│   │   │       ├── company-modules.service.ts
│   │   │       ├── admin-view.service.ts     # Impersonación de empresa
│   │   │       ├── roles.service.ts
│   │   │       └── theme.service.ts
│   │   ├── features/                    # Módulos de dominio (lazy)
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   └── forgot-password/
│   │   │   ├── clients/
│   │   │   │   ├── clients-list/
│   │   │   │   └── client-form/
│   │   │   ├── products/
│   │   │   │   ├── products-list/
│   │   │   │   ├── product-form/
│   │   │   │   └── stock-adjust-dialog/
│   │   │   ├── suppliers/
│   │   │   │   ├── suppliers-list/
│   │   │   │   └── supplier-form/
│   │   │   ├── invoices/
│   │   │   │   ├── invoices-list/
│   │   │   │   ├── invoice-create/
│   │   │   │   └── invoice-detail/
│   │   │   ├── tax-rates/
│   │   │   │   ├── tax-rates-list/
│   │   │   │   └── tax-rate-form/
│   │   │   ├── users/
│   │   │   │   ├── users-list/
│   │   │   │   └── user-form/
│   │   │   ├── companies/
│   │   │   │   ├── companies-list/
│   │   │   │   └── company-detail/
│   │   │   ├── dashboard/
│   │   │   ├── landing/
│   │   │   ├── module-requests/
│   │   │   └── platform/
│   │   │       ├── audit-logs/
│   │   │       └── support-users/
│   │   ├── layout/                      # Shell de la aplicación
│   │   │   ├── main-layout/
│   │   │   ├── sidebar/
│   │   │   └── topbar/
│   │   ├── shared/                      # Componentes reutilizables
│   │   │   └── components/
│   │   │       ├── confirm-dialog/
│   │   │       ├── stat-card/
│   │   │       ├── status-badge/
│   │   │       └── coming-soon/
│   │   ├── app.routes.ts                # Definición de rutas
│   │   ├── app.config.ts                # Configuración de providers
│   │   └── app.component.ts
│   ├── environments/
│   │   ├── environment.ts               # Dev: localhost:8080
│   │   └── environment.prod.ts          # Prod: api.tesisfernandonavaspuce.es
│   ├── styles.scss                      # Estilos globales
│   ├── main.ts
│   └── index.html
├── angular.json
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 5. Módulos Funcionales

### 5.1 Dashboard

Panel de control principal con métricas clave del negocio. Integra gráficas interactivas usando ApexCharts para visualizar tendencias de ventas, stock de productos y actividad de clientes.

### 5.2 Clientes (`/customers`)

Gestión del directorio de clientes. Soporta tres tipos de identificación fiscal ecuatoriana:

| Tipo | Descripción |
|---|---|
| `CEDULA` | Persona natural — cédula de identidad |
| `RUC` | Persona jurídica o natural con actividad económica |
| `FINAL_CONSUMER` | Consumidor final (sin datos fiscales) |

### 5.3 Productos (`/products`)

Catálogo de productos con control de inventario. Funcionalidades:
- CRUD de productos con precio unitario y stock disponible
- Ajuste de stock mediante diálogo modal (`StockAdjustDialogComponent`)
- Registro de movimientos: `IN` (entrada), `OUT` (salida), `ADJUSTMENT` (corrección)

### 5.4 Proveedores (`/suppliers`)

Directorio de proveedores con información de contacto. Ruta protegida por rol administrador.

### 5.5 Facturación (`/invoices`)

Módulo central del ERP. Permite:
- Creación de facturas con líneas de detalle (`InvoiceDetail`)
- Aplicación de tasas impositivas configuradas por el administrador
- Visualización de facturas emitidas con su estado
- Descarga de la factura en formato PDF generada en el cliente (sin servidor)

### 5.6 Tasas de Impuesto (`/tax-rates`)

Configuración de impuestos con períodos de vigencia. Usado al momento de calcular el IVA en las facturas.

### 5.7 Usuarios (`/users`)

Administración de usuarios de la empresa (inquilino). Roles disponibles en el ámbito *store*: `STORE_ADMIN`, `STORE_SELLER`, `STORE_WAREHOUSE`.

### 5.8 Solicitudes de Módulos (`/module-requests`)

Flujo de aprobación para que una empresa solicite la habilitación de módulos adicionales del ERP. El operador de la plataforma aprueba o rechaza las solicitudes.

### 5.9 Administración de Plataforma

Accesible únicamente para usuarios con rol `PLATFORM_ADMIN` o `PLATFORM_STAFF`:

| Ruta | Función |
|---|---|
| `/companies` | Listado y gestión de empresas suscritas |
| `/companies/:id` | Detalle de empresa, módulos habilitados, estado |
| `/platform/modules` | Catálogo de módulos del sistema |
| `/platform/support-users` | Gestión de usuarios de soporte (solo `PLATFORM_ADMIN`) |
| `/platform/audit-logs` | Registro de auditoría de operaciones críticas |

---

## 6. Autenticación y Control de Acceso

### 6.1 Flujo de Autenticación

```
Usuario ingresa credenciales
          │
          ▼
POST /api/auth/login
          │
          ▼
Backend retorna:
  - access_token (JWT)
  - refresh_token
  - user { id, name, email, role, company }
          │
          ▼
AuthService almacena en localStorage:
  pf_token    → JWT de acceso
  pf_refresh  → Token de renovación
  pf_user     → Objeto usuario serializado
          │
          ▼
Signal currentUser actualizado
          │
          ▼
Redirect al Dashboard
```

### 6.2 Interceptores HTTP

Los interceptores se aplican en cadena en el siguiente orden:

1. **`token.interceptor`** — Adjunta el header `Authorization: Bearer <token>` a todas las peticiones autenticadas. Si el servidor responde con `401 Unauthorized`, ejecuta automáticamente la renovación del token y reintenta la petición original.

2. **`client-view.interceptor`** — Cuando un administrador de plataforma impersona una empresa, inyecta el parámetro `company_id` en cada petición para limitar los datos al inquilino seleccionado.

3. **`error.interceptor`** — Captura errores HTTP y muestra notificaciones al usuario mediante `MatSnackBar` con mensajes en español.

### 6.3 Guards de Ruta

```typescript
// Jerarquía de protección de rutas
Route
  └── canActivate: [authGuard]          // ¿Sesión activa?
        └── canActivate: [permissionGuard]  // ¿Tiene el rol requerido?
```

| Guard | Responsabilidad |
|---|---|
| `authGuard` | Verifica que existe un JWT válido. Si no, redirige a `/login` |
| `permissionGuard` | Evalúa opciones de ruta: `platform`, `platformAdmin`, `adminOnly` |
| `role.guard` | Validación de rol específico para casos puntuales |

### 6.4 Roles y Alcances

El sistema define dos ámbitos (*scopes*) de usuario:

**Plataforma (sin empresa asignada)**

| Rol | Permisos |
|---|---|
| `PLATFORM_ADMIN` | Acceso total. Crea usuarios de plataforma, gestiona empresas y módulos |
| `PLATFORM_STAFF` | Soporte. Ve empresas y logs, no puede crear admins de plataforma |

**Empresa / Store (company_id requerido)**

| Rol | Permisos |
|---|---|
| `STORE_ADMIN` | Administra todos los recursos de su empresa |
| `STORE_SELLER` | Acceso a clientes, facturas y productos (lectura) |
| `STORE_WAREHOUSE` | Acceso a productos e inventario |

### 6.5 Señales Computadas en AuthService

```typescript
isAuthenticated  = computed(() => this.currentUser() !== null)
isSystemUser     = computed(() => !this.currentUser()?.company)
isPlatformUser   = computed(() => role.scope === 'PLATFORM')
isPlatformAdmin  = computed(() => role.name === 'PLATFORM_ADMIN')
isStoreAdmin     = computed(() => role.name === 'STORE_ADMIN')
isStoreUser      = computed(() => role.scope === 'STORE')
isStoreWarehouse = computed(() => role.name === 'STORE_WAREHOUSE')
```

---

## 7. Multi-Tenencia

La arquitectura multi-tenant se implementa a nivel de frontend mediante tres mecanismos complementarios:

### 7.1 Scoping Automático por Empresa

El `client-view.interceptor` intercepta todas las peticiones HTTP salientes. Cuando el usuario autenticado pertenece a una empresa (*store user*), el interceptor adjunta automáticamente el `company_id` correspondiente, asegurando que el backend filtre los datos por inquilino.

### 7.2 Impersonación de Empresa (AdminView)

El servicio `AdminViewService` permite a los administradores de plataforma "ingresar" a la vista de una empresa específica. Al activar este modo, el interceptor usa el `company_id` seleccionado en lugar del propio del usuario, permitiendo soporte y auditoría sin necesidad de credenciales por empresa.

### 7.3 Gating de Módulos

El servicio `CompanyModulesService` consulta los módulos habilitados para la empresa activa. El componente `SidebarComponent` filtra los ítems de navegación según el estado de cada módulo (`APPROVED` / `PENDING`), impidiendo el acceso a funcionalidades no suscritas.

---

## 8. Comunicación con la API

### 8.1 Endpoints Base

| Entorno | URL Base |
|---|---|
| Desarrollo | `http://localhost:8080/api` |
| Producción | `https://api.tesisfernandonavaspuce.es/api` |

### 8.2 Wrappers de Respuesta

Todos los servicios tipan sus respuestas con los siguientes modelos genéricos definidos en `pagination.model.ts`:

```typescript
// Respuesta singular
interface ApiResponse<T> {
  data: T;
  message?: string;
}

// Respuesta paginada
interface ApiListResponse<T> {
  data: T[];
  total: number;
  page: number;
  size: number;
}

// Genérico de paginación
interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
}
```

### 8.3 ApiService

El servicio `api.service.ts` actúa como wrapper de `HttpClient`, estandarizando la construcción de parámetros, cabeceras y el manejo de errores antes de que alcancen los interceptores.

---

## 9. Gestión de Estado

El frontend no utiliza una librería de gestión de estado externa (NgRx, Akita). En su lugar se aplica el enfoque nativo de Angular 17:

| Mecanismo | Uso |
|---|---|
| **Angular Signals** | Estado global de autenticación (`AuthService.currentUser`) |
| **`computed()`** | Estado derivado del usuario autenticado (roles, permisos) |
| **`BehaviorSubject` / `Observable`** | Flujos de datos asincrónicos en servicios de dominio |
| **Component-level state** | Estado local de formularios y listas dentro de cada componente |

---

## 10. Generación de Documentos

### PDF de Factura

El servicio `InvoicePdfService` utiliza **pdfmake** para generar facturas en formato PDF directamente en el navegador, sin requerir procesamiento en el servidor. El documento incluye:

- Datos de la empresa emisora
- Datos del cliente receptor con tipo de documento fiscal
- Tabla de líneas de detalle (producto, cantidad, precio unitario, subtotal)
- Cálculo de subtotal, IVA y total
- Número de factura y fecha de emisión

La generación es completamente *client-side*, lo que reduce la carga del servidor y permite la descarga inmediata.

---

## 11. Configuración de Entornos

### Desarrollo

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'
};
```

### Producción

```typescript
// src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.tesisfernandonavaspuce.es/api'
};
```

El CLI de Angular reemplaza automáticamente el archivo de entorno durante `ng build --configuration production` mediante la directiva `fileReplacements` en `angular.json`.

---

## 12. Instalación y Ejecución

### Pre-requisitos

| Herramienta | Versión Mínima |
|---|---|
| Node.js | 18.x o superior |
| npm | 9.x o superior |
| Angular CLI | 17.x |

### Pasos

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd pymeflowec-front

# 2. Instalar dependencias
npm install

# 3. Ejecutar en modo desarrollo
npm start
# La aplicación estará disponible en http://localhost:5173

# 4. Compilar para producción
npm run build
# Los artefactos se generan en dist/pymeflowec-frontend/
```

> **Nota:** El backend (Spring Boot) debe estar corriendo en `http://localhost:8080` para que la aplicación funcione en modo desarrollo.

---

## 13. Scripts Disponibles

| Comando | Descripción |
|---|---|
| `npm start` | Inicia el servidor de desarrollo en el puerto `5173` |
| `npm run build` | Compila la aplicación para producción con optimizaciones |
| `npm run watch` | Compilación incremental en modo desarrollo (útil con esbuild) |

### Configuración de Build de Producción

| Parámetro | Valor |
|---|---|
| Bundler | esbuild (vía Angular CLI 17) |
| Output path | `dist/pymeflowec-frontend/` |
| Optimización | Scripts y estilos minimizados |
| Code splitting | Por ruta (lazy loading) |
| Output hashing | Todos los artefactos |
| Presupuesto inicial | Warning: 500 KB / Error: 1 MB |
| CommonJS permitidos | `pdfmake`, `pdfmake/build/pdfmake`, `pdfmake/build/vfs_fonts` |

---

## 14. Rutas de la Aplicación

### Rutas Públicas

| Ruta | Componente | Descripción |
|---|---|---|
| `/` | `LandingComponent` | Página de presentación del producto |
| `/login` | `LoginComponent` | Inicio de sesión |
| `/register` | `RegisterComponent` | Registro de nueva empresa |
| `/forgot-password` | `ForgotPasswordComponent` | Recuperación de contraseña |

### Rutas Protegidas — Empresa

Requieren `authGuard`. Las rutas de administración adicionalmente requieren rol `STORE_ADMIN`.

| Ruta | Descripción | Admin Only |
|---|---|:---:|
| `/dashboard` | Panel principal con métricas | |
| `/customers` | Listado de clientes | |
| `/customers/new` | Crear cliente | |
| `/customers/:id/edit` | Editar cliente | |
| `/products` | Catálogo de productos | ✓ |
| `/products/new` | Crear producto | ✓ |
| `/products/:id/edit` | Editar producto | ✓ |
| `/suppliers` | Listado de proveedores | ✓ |
| `/suppliers/new` | Crear proveedor | ✓ |
| `/suppliers/:id/edit` | Editar proveedor | ✓ |
| `/invoices` | Historial de facturas | |
| `/invoices/new` | Emitir factura | |
| `/invoices/:id` | Detalle de factura | |
| `/tax-rates` | Tasas impositivas | ✓ |
| `/tax-rates/new` | Crear tasa | ✓ |
| `/tax-rates/:id/edit` | Editar tasa | ✓ |
| `/users` | Gestión de usuarios | ✓ |
| `/users/new` | Crear usuario | ✓ |
| `/users/:id/edit` | Editar usuario | ✓ |
| `/module-requests` | Solicitudes de módulos | ✓ |

### Rutas Protegidas — Plataforma

Requieren `authGuard` + `permissionGuard` con alcance `platform`.

| Ruta | Descripción | Solo PLATFORM_ADMIN |
|---|---|:---:|
| `/companies` | Listado de empresas suscritas | |
| `/companies/:id` | Detalle y gestión de empresa | |
| `/platform/modules` | Catálogo de módulos del sistema | |
| `/platform/support-users` | Usuarios de soporte | ✓ |
| `/platform/audit-logs` | Registros de auditoría | |

---

## 15. Patrones y Decisiones de Diseño

### Standalone Components (sin NgModules)

Desde Angular 14, los componentes pueden declararse sin pertenecer a un `NgModule`. Este proyecto adopta íntegramente este paradigma en la versión 17, simplificando el grafo de dependencias y habilitando carga diferida a nivel de componente individual.

### Lazy Loading por Ruta

Cada ruta utiliza `loadComponent()` en lugar de `loadChildren()`, logrando un *bundle* separado por componente. Esto minimiza el tiempo de carga inicial (*Time to Interactive*) y mejora la experiencia del usuario en conexiones lentas.

### Guards y Interceptores Funcionales

Angular 15+ introduce `CanActivateFn` e `HttpInterceptorFn` como alternativas funcionales a las clases que implementan interfaces. Este proyecto usa exclusivamente el enfoque funcional, que es más conciso y permite el uso de `inject()` sin necesidad de inyección en constructor.

### Signals para Estado Global

En lugar de `BehaviorSubject` expuesto como `Observable`, el `AuthService` utiliza un `signal<AuthUser | null>` para representar el usuario activo. Los estados derivados (roles, permisos) se calculan con `computed()`, garantizando consistencia sin suscripciones manuales.

### Theming Híbrido (Material + Tailwind)

Angular Material provee los componentes interactivos (formularios, diálogos, tablas, snackbars). Tailwind CSS complementa con utilidades de espaciado, tipografía y color para el layout general. Para evitar conflictos, el `preflight` de Tailwind está deshabilitado, cediendo el reset de estilos base a Material.

### Localización en Español

La aplicación está completamente localizada al español (Ecuador):
- `MatPaginatorIntl` personalizado con textos en español
- Mensajes de error de la API traducidos por el interceptor de errores
- Etiquetas de interfaz, botones y títulos en español

---

## Autor

**Fernando Navas**  
Trabajo de Titulación — Ingeniería en Sistemas  
Ecuador, 2025

---

*Este proyecto forma parte de un trabajo de titulación académico. La plataforma PymeFlow EC fue diseñada, desarrollada y documentada como demostración de una solución SaaS real aplicable al contexto empresarial ecuatoriano.*
