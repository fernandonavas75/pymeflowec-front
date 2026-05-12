# PymeFlow EC — Frontend

> **Sistema ERP Multi-Tenant para PyMEs Ecuatorianas**  
> Aplicación web cliente desarrollada con Angular 17 (Standalone Components)  
> Trabajo de Titulación — Ingeniería en Sistemas / Computación  
> **Autor:** Fernando Navas · Ecuador, 2026

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
15. [Módulo Financiero](#15-módulo-financiero)
16. [Generación de PDF Client-Side](#16-generación-de-pdf-client-side)
17. [Sistema de Estilos y Theming](#17-sistema-de-estilos-y-theming)
18. [Configuración de Entornos y Build](#18-configuración-de-entornos-y-build)
19. [Instalación y Ejecución](#19-instalación-y-ejecución)
20. [Patrones y Decisiones de Diseño](#20-patrones-y-decisiones-de-diseño)

---

## 1. Contexto y Problemática

Las pequeñas y medianas empresas (PyMEs) en Ecuador representan más del 90 % del tejido empresarial del país, sin embargo, la mayoría carece de herramientas digitales integradas para gestionar sus operaciones. Las soluciones ERP tradicionales presentan barreras de adopción significativas: costos de licenciamiento elevados, infraestructura local compleja y falta de adaptación al contexto fiscal ecuatoriano (RUC, CEDULA, IVA, emisión de facturas SRI).

**PymeFlow EC** propone una solución SaaS (*Software as a Service*) multi-tenant que democratiza el acceso a un ERP mediante un modelo de suscripción por módulos, donde varias empresas comparten la misma infraestructura con aislamiento total de datos. Este repositorio contiene el **cliente frontend** de la plataforma: una SPA (*Single Page Application*) desarrollada con Angular 17 que consume la API REST del backend (Node.js + Express + Sequelize + PostgreSQL).

### Alcance funcional

- **Gestión comercial:** clientes, proveedores, productos con inventario, facturación con cobros parciales
- **Módulo financiero completo:** caja chica, egresos operacionales, pagos, presupuestos, plantillas recurrentes y dashboard analítico
- **Configuración fiscal:** tasas de impuesto (IVA) con períodos de vigencia
- **Administración de usuarios** por empresa con roles diferenciados
- **Reportes y analítica:** KPIs de ventas, egresos, cuentas por cobrar/pagar, ingresos líquidos y resumen mensual de impuestos
- **Capa de administración SaaS:** empresas suscritas, módulos, auditoría, soporte

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
│               ┌────────────────┼──────────────────────────────┐             │
│               │         FEATURE MODULES (Lazy)                │             │
│               │                                               │             │
│  ┌──────────┐ ┌─────────┐ ┌──────────┐ ┌────────────┐        │             │
│  │customers │ │products │ │suppliers │ │  invoices  │        │             │
│  └──────────┘ └─────────┘ └──────────┘ └────────────┘        │             │
│  ┌──────────┐ ┌─────────┐ ┌──────────────────────────────┐   │             │
│  │tax-rates │ │  users  │ │       finance/               │   │             │
│  └──────────┘ └─────────┘ │  petty-cash · expenses       │   │             │
│  ┌──────────┐ ┌─────────┐ │  categories · budgets        │   │             │
│  │dashboard │ │reports  │ │  recurring · dashboard       │   │             │
│  └──────────┘ └─────────┘ └──────────────────────────────┘   │             │
│               └──────────────────────────────────────────────┘             │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         CORE LAYER                                  │    │
│  │  Guards · Interceptors · Services · Models                          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                       SHARED LAYER                                  │    │
│  │   AppIcon · ConfirmDialog · StatCard · StatusBadge · ComingSoon     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                │  HTTPS / REST · Bearer JWT · JSON
                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│              BACKEND API — Node.js + Express · Puerto 8080                  │
│  /api/auth   /api/customers   /api/products   /api/invoices                 │
│  /api/invoice-payments   /api/expenses   /api/expense-payments              │
│  /api/expense-categories   /api/expense-budgets   /api/expense-recurring    │
│  /api/petty-cash   /api/suppliers   /api/tax-rates   /api/users             │
│  /api/companies   /api/platform   /api/audit-logs   /api/module-requests    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Principios Arquitectónicos

| Principio | Implementación concreta |
|---|---|
| Separación de responsabilidades | Cuatro capas independientes: Core, Features, Layout, Shared |
| Carga diferida | Todas las rutas usan `loadComponent()` — un chunk de JS por componente |
| Sin NgModules | Arquitectura 100% Standalone Components (Angular 17) |
| Estado reactivo sin librerías externas | Angular Signals + `computed()` en AuthService y todos los componentes de features |
| Centralización de cross-cutting concerns | Interceptores HTTP funcionales encadenados |
| RBAC jerárquico | `permissionGuard` con evaluación de scope + rol + adminOnly + module gating |
| Tipado fuerte | TypeScript strict mode; todos los contratos de API tipados con interfaces genéricas |

### 2.3 Flujo de datos end-to-end

```
Usuario interactúa con componente
            │
            ▼
Componente llama a un Service (CustomersService, ExpensesService…)
            │
            ▼
Service llama a ApiService.get/post/put/delete()
            │
    ┌───────┴────────────────────────────────────┐
    │         PIPELINE DE INTERCEPTORES           │
    │  1. tokenInterceptor  → añade Bearer token  │
    │  2. clientViewInterceptor → inyecta company_id (impersonación) │
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
  Observable emite → Componente actualiza signals → Vista se re-renderiza
```

---

## 3. Stack Tecnológico y Justificación

### 3.1 Framework y Lenguaje

| Tecnología | Versión | Rol | Justificación |
|---|---|---|---|
| **Angular** | 17.3 | Framework SPA | Standalone Components, Signals nativos, lazy loading por componente; ecosistema maduro para aplicaciones empresariales |
| **TypeScript** | 5.4 | Lenguaje | Strict mode habilitado; interfaces tipadas para todos los contratos de API; mejora la mantenibilidad |
| **RxJS** | 7.8 | Streams / HTTP | Composición de operadores para refresh de token, manejo de errores y flujos asíncronos complejos |
| **Zone.js** | 0.14 | Change detection | Integración con el ciclo de detección de cambios de Angular |

### 3.2 UI y Sistema de Estilos

| Tecnología | Versión | Rol | Justificación |
|---|---|---|---|
| **Angular Material** | 17.3 | Componentes base | Diálogos, snackbars, paginador, select — componentes interactivos probados en producción |
| **Angular CDK** | 17.3 | Primitivos | Overlays y scrolling virtual |
| **Tailwind CSS** | 3.4 | Utilidades CSS | Diseño utility-first; integración con Material deshabilitando preflight |
| **SCSS** | — | Preprocesador | Design system propio: tokens CSS, clases `ds-*`, dark mode, density, accent |

> Angular Material está en proceso de retirada gradual. Los componentes nuevos usan exclusivamente el design system propio (`ds-table`, `ds-tabs`, `.mfield`, `.drawer`, etc.).

### 3.3 Librerías de Dominio

| Librería | Versión | Uso |
|---|---|---|
| **pdfmake** | 0.3.7 | Generación de documentos PDF en el browser para facturas |

> **ApexCharts fue descartado.** Todas las visualizaciones (barras, donut, sparklines) se implementan con SVG inline generado en el componente, evitando congelamientos del navegador causados por la re-evaluación del binding de opciones.

### 3.4 Herramientas de Build

| Herramienta | Versión | Rol |
|---|---|---|
| **Angular CLI** | 17.3 | Scaffolding, build, serve |
| **esbuild** | (interno Angular CLI 17) | Bundler de producción; orden de magnitud más rápido que webpack |

---

## 4. Estructura del Proyecto

```
pymeflowec-front/
│
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── guards/
│   │   │   │   ├── auth.guard.ts              # Valida JWT + /auth/me
│   │   │   │   ├── permission.guard.ts        # RBAC: platform/store/adminOnly/roles
│   │   │   │   └── role.guard.ts              # Validación de rol puntual
│   │   │   │
│   │   │   ├── interceptors/
│   │   │   │   ├── token.interceptor.ts       # Bearer JWT + refresh automático
│   │   │   │   ├── client-view.interceptor.ts # Inyección de company_id (impersonación)
│   │   │   │   └── error.interceptor.ts       # Captura HTTP errors → MatSnackBar
│   │   │   │
│   │   │   ├── models/
│   │   │   │   ├── auth.model.ts
│   │   │   │   ├── company.model.ts
│   │   │   │   ├── customer.model.ts
│   │   │   │   ├── invoice.model.ts           # Incluye InvoicePayStatusAgg, amount_paid/pending
│   │   │   │   ├── invoice-payment.model.ts   # PaymentMethod, PAYMENT_METHOD_LABELS
│   │   │   │   ├── product.model.ts
│   │   │   │   ├── supplier.model.ts
│   │   │   │   ├── user.model.ts
│   │   │   │   ├── tax-rate.model.ts
│   │   │   │   ├── pagination.model.ts        # ApiResponse<T>, ApiListResponse<T>
│   │   │   │   ├── audit-log.model.ts
│   │   │   │   ├── module-request.model.ts
│   │   │   │   ├── petty-cash.model.ts        # PettyCash, PettyCashMovement, DTOs
│   │   │   │   ├── expense.model.ts           # Expense, VoucherType, DTOs
│   │   │   │   ├── expense-category.model.ts  # ExpenseCategory, CategoryType
│   │   │   │   ├── expense-payment.model.ts   # ExpensePayment, re-export PaymentMethod
│   │   │   │   ├── expense-budget.model.ts    # ExpenseBudget, BudgetPeriodType, MONTHS
│   │   │   │   └── expense-recurring.model.ts # ExpenseRecurring, DTOs
│   │   │   │
│   │   │   └── services/
│   │   │       ├── api.service.ts             # Wrapper genérico de HttpClient
│   │   │       ├── auth.service.ts            # Signal currentUser + JWT + refresh
│   │   │       ├── customers.service.ts
│   │   │       ├── products.service.ts
│   │   │       ├── suppliers.service.ts
│   │   │       ├── invoices.service.ts
│   │   │       ├── invoice-payments.service.ts
│   │   │       ├── invoice-pdf.service.ts     # Generación PDF con pdfmake
│   │   │       ├── users.service.ts
│   │   │       ├── companies.service.ts
│   │   │       ├── tax-rates.service.ts
│   │   │       ├── dashboard.service.ts       # KPIs: ventas reales + egresos reales
│   │   │       ├── audit-logs.service.ts
│   │   │       ├── module-request.service.ts  # Re-export de compatibilidad
│   │   │       ├── module-request-register.service.ts  # Flujo registro/landing
│   │   │       ├── module-requests.service.ts # Admin: listado + aprobación
│   │   │       ├── company-modules.service.ts
│   │   │       ├── admin-view.service.ts      # Estado de impersonación
│   │   │       ├── roles.service.ts
│   │   │       ├── theme.service.ts           # Dark/light mode
│   │   │       ├── petty-cash.service.ts
│   │   │       ├── expenses.service.ts
│   │   │       ├── expense-categories.service.ts
│   │   │       ├── expense-payments.service.ts
│   │   │       ├── expense-budgets.service.ts
│   │   │       └── expense-recurring.service.ts
│   │   │
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   ├── register/                  # 3 pasos: Empresa → Admin → Módulos
│   │   │   │   ├── forgot-password/
│   │   │   │   └── reset-password/
│   │   │   ├── landing/
│   │   │   ├── dashboard/                     # KPIs + SVG charts; usa ExpensesService
│   │   │   ├── clients/
│   │   │   │   ├── clients-list/
│   │   │   │   └── client-form/
│   │   │   ├── products/
│   │   │   │   ├── products-list/
│   │   │   │   ├── product-form/
│   │   │   │   ├── stock-adjust-dialog/
│   │   │   │   └── csv-import-dialog/
│   │   │   ├── suppliers/
│   │   │   │   ├── suppliers-list/
│   │   │   │   └── supplier-form/
│   │   │   ├── invoices/
│   │   │   │   ├── invoices-list/             # Cobros inline, drawer de pago
│   │   │   │   ├── invoice-create/            # POS: carrito + descuentos por línea
│   │   │   │   └── invoice-detail/
│   │   │   ├── tax-rates/
│   │   │   │   ├── tax-rates-list/
│   │   │   │   └── tax-rate-form/
│   │   │   ├── users/
│   │   │   │   ├── users-list/
│   │   │   │   └── user-form/
│   │   │   ├── finance/
│   │   │   │   ├── petty-cash/               # Caja chica con KPIs + historial
│   │   │   │   ├── expenses/                 # Egresos + pagos inline
│   │   │   │   ├── expense-categories/
│   │   │   │   ├── expense-budgets/
│   │   │   │   ├── expense-recurring/
│   │   │   │   └── finance-dashboard/        # Dashboard 7 tabs + SVG charts
│   │   │   ├── reports/                      # Reportes: analytics / actividad / finanzas
│   │   │   ├── module-requests/
│   │   │   │   └── module-requests-list/
│   │   │   ├── companies/
│   │   │   │   ├── companies-list/
│   │   │   │   └── company-detail/
│   │   │   └── platform/
│   │   │       ├── audit-logs/
│   │   │       └── support-users/
│   │   │
│   │   ├── layout/
│   │   │   ├── main-layout/
│   │   │   ├── sidebar/                      # Module gating + visibilidad por rol
│   │   │   └── topbar/
│   │   │
│   │   ├── shared/components/
│   │   │   ├── app-icon/                     # ~70 SVGs Lucide inline
│   │   │   ├── confirm-dialog/
│   │   │   ├── stat-card/
│   │   │   ├── status-badge/
│   │   │   └── coming-soon/
│   │   │
│   │   ├── app.routes.ts
│   │   ├── app.config.ts
│   │   └── app.component.ts
│   │
│   ├── environments/
│   │   ├── environment.ts                    # apiUrl → localhost:8080
│   │   └── environment.prod.ts               # apiUrl → producción
│   │
│   ├── styles.scss                           # Design system: tokens, ds-*, dark mode
│   ├── main.ts
│   └── index.html
│
├── angular.json
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 5. Bootstrap y Configuración de la Aplicación

Angular 17 utiliza `bootstrapApplication()` en lugar de `AppModule`. Toda la configuración de providers se centraliza en `app.config.ts`:

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([tokenInterceptor, clientViewInterceptor, errorInterceptor])
    ),
    provideAnimationsAsync(),
    importProvidersFrom(MatSnackBarModule, MatDialogModule),
    { provide: MatPaginatorIntl, useFactory: spanishPaginatorIntl },
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { subscriptSizing: 'dynamic' } },
    { provide: MAT_SELECT_CONFIG, useValue: { disableOptionCentering: true } },
  ],
};
```

---

## 6. Sistema de Enrutamiento

### 6.1 Tabla completa de rutas

#### Rutas Públicas

| Ruta | Componente |
|---|---|
| `/` | `LandingComponent` |
| `/login` | `LoginComponent` |
| `/register` | `RegisterComponent` |
| `/forgot-password` | `ForgotPasswordComponent` |
| `/reset-password` | `ResetPasswordComponent` |

#### Rutas de Empresa (requieren `authGuard`)

| Ruta | Guard adicional | Condición |
|---|---|---|
| `/dashboard` | — | Cualquier usuario autenticado |
| `/customers` · `/customers/new` · `/customers/:id/edit` | `permissionGuard` en new/edit | `adminOnly` |
| `/products` · `/products/new` · `/products/:id/edit` | `permissionGuard` en new/edit | `adminOnly` |
| `/suppliers` · `/suppliers/new` · `/suppliers/:id/edit` | `permissionGuard` en new/edit | `adminOnly` |
| `/invoices` · `/invoices/new` · `/invoices/:id` | — | Cualquier usuario |
| `/tax-rates` · `/tax-rates/new` · `/tax-rates/:id/edit` | `permissionGuard` | `adminOnly` |
| `/users` · `/users/new` · `/users/:id/edit` | `permissionGuard` | `adminOnly` |
| `/module-requests` | `permissionGuard` | `adminOnly` |
| `/finance/petty-cash` | `permissionGuard` | `roles: [STORE_ADMIN, STORE_SELLER]` |
| `/finance/expenses` | `permissionGuard` | `adminOnly` |
| `/finance/expense-categories` | `permissionGuard` | `adminOnly` |
| `/finance/expense-budgets` | `permissionGuard` | `adminOnly` |
| `/finance/expense-recurring` | `permissionGuard` | `adminOnly` |
| `/finance/dashboard` | `permissionGuard` | `roles: [STORE_ADMIN, STORE_SELLER]` |
| `/reports` | — | Cualquier usuario (tabs filtradas por rol) |

#### Rutas de Plataforma (requieren `authGuard` + `permissionGuard`)

| Ruta | Condición |
|---|---|
| `/companies` · `/companies/:id` | `platform: true` |
| `/platform/audit-logs` | `platform: true` |
| `/platform/support-users` | `platformAdmin: true` |

### 6.2 Metadatos de ruta soportados

| Clave `data` | Efecto |
|---|---|
| `platform: true` | Solo scope PLATFORM (admin o staff) |
| `platformAdmin: true` | Exclusivo `PLATFORM_ADMIN` |
| `adminOnly: true` | Alias para `roles: ['STORE_ADMIN']` |
| `roles: string[]` | Array de roles válidos (OR lógico) |

---

## 7. Capa Core: Modelos de Dominio

Los modelos TypeScript en `src/app/core/models/` actúan como contratos explícitos entre el frontend y la API REST. Son interfaces puras que reflejan la estructura JSON del backend.

### 7.1 Contratos de respuesta paginada (`pagination.model.ts`)

```typescript
export interface ApiResponse<T> {
  success: boolean;
  data:    T;
}

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

// FinanceListResponse<T> es alias de ApiListResponse<T>
export type FinanceListResponse<T> = ApiListResponse<T>;
```

### 7.2 Modelo de Factura (`invoice.model.ts`)

```typescript
export type InvoiceStatus       = 'ISSUED' | 'CANCELLED';
export type InvoicePayStatusAgg = 'PENDIENTE' | 'PARCIAL' | 'COBRADO';

export interface Invoice {
  id:             number;
  invoice_number: string;
  issue_date:     string;
  subtotal:       number;
  tax_amount:     number;
  total:          number;
  status:         InvoiceStatus;
  payment_status?: InvoicePayStatusAgg;
  amount_paid?:   number;
  amount_pending?: number;
  customer?:      Customer | null;
  details?:       InvoiceDetail[];
}
```

### 7.3 Modelo de Egreso (`expense.model.ts`)

```typescript
export type ExpensePaymentStatus = 'PENDIENTE' | 'PARCIAL' | 'PAGADO' | 'ANULADO';
export type VoucherType = 'FACTURA' | 'NOTA_VENTA' | 'RECIBO' | 'LIQUIDACION' | 'SIN_COMPROBANTE' | 'OTRO';

export interface Expense {
  id:               number;
  category_id:      number;
  description:      string;
  amount:           number;
  expense_date:     string;
  payment_status:   ExpensePaymentStatus;
  voucher_type?:    VoucherType;
  voucher_number?:  string;
  supplier_id?:     number | null;
  supplier_name_free?: string | null;
  category?:        ExpenseCategory;
  payments?:        ExpensePayment[];
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
  private baseUrl = environment.apiUrl;

  get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Observable<T>
  post<T>(path: string, body: unknown): Observable<T>
  put<T>(path: string, body: unknown): Observable<T>
  patch<T>(path: string, body?: unknown): Observable<T>
  delete<T>(path: string): Observable<T>
}
```

### 8.2 Patrón de servicio de dominio

Todos los servicios de dominio inyectan `ApiService`, tipan sus respuestas con genéricos y exponen `Observable<T>`. Ejemplo:

```typescript
@Injectable({ providedIn: 'root' })
export class ExpensesService {
  private api = inject(ApiService);

  list(params?: PaginationParams): Observable<ApiListResponse<Expense>> {
    return this.api.get<ApiListResponse<Expense>>('/expenses', params);
  }

  create(dto: CreateExpenseDto): Observable<ApiResponse<Expense>> {
    return this.api.post<ApiResponse<Expense>>('/expenses', dto);
  }

  annul(id: number): Observable<ApiResponse<Expense>> {
    return this.api.patch<ApiResponse<Expense>>(`/expenses/${id}/annul`);
  }
}
```

---

## 9. Autenticación y Gestión de Sesión

### 9.1 AuthService — Signal-based

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  currentUser      = signal<AuthUser | null>(null);

  isAuthenticated  = computed(() => !!this.currentUser());
  role             = computed(() => this.currentUser()?.role?.name);
  isPlatformAdmin  = computed(() => this.currentUser()?.role?.name === 'PLATFORM_ADMIN');
  isStoreAdmin     = computed(() => this.currentUser()?.role?.name === 'STORE_ADMIN');
  isStoreWarehouse = computed(() => this.currentUser()?.role?.name === 'STORE_WAREHOUSE');
  isPlatformUser   = computed(() => this.currentUser()?.role?.scope === 'PLATFORM');
  isSystemUser     = computed(() => !this.currentUser()?.company);
}
```

### 9.2 Estrategia de tokens

| Clave localStorage | Contenido | Uso |
|---|---|---|
| `pf_token` | JWT de acceso (corta duración) | Adjuntado en cada petición HTTP por `tokenInterceptor` |
| `pf_refresh` | Token de renovación (larga duración) | Enviado a `/auth/refresh` cuando el JWT expira (401) |
| `pf_user` | `AuthUser` serializado (JSON) | Hidratación del signal en el reload de página |

### 9.3 Renovación automática de token

```
Request normal → tokenInterceptor → Backend
                                         │
                             Si 401 y no es /auth/refresh:
                                         ▼
                           POST /api/auth/refresh { refresh_token }
                                         │
                             Si OK: actualiza pf_token, reintenta request original
                             Si falla: logout() → /login
```

---

## 10. Control de Acceso Basado en Roles (RBAC)

### 10.1 Jerarquía de roles

| Rol | Scope | Permisos |
|---|---|---|
| `PLATFORM_ADMIN` | PLATFORM | Acceso total; gestiona empresas, módulos, usuarios platform |
| `PLATFORM_STAFF` | PLATFORM | Solo lectura en modo soporte |
| `STORE_ADMIN` | STORE | CRUD completo, abrir/cerrar caja, anular cobros/egresos |
| `STORE_SELLER` | STORE | Crear facturas, registrar cobros, movimientos de caja |
| `STORE_WAREHOUSE` | STORE | Ajustar stock únicamente |

### 10.2 Lógica de visibilidad del Sidebar

| Propiedad NavItem | Efecto |
|---|---|
| `moduleCode` | STORE_ADMIN: visible si APPROVED o PENDING. STORE_SELLER: solo APPROVED |
| `adminOnly` | Solo STORE_ADMIN |
| `warehouseHidden` | Oculto para STORE_WAREHOUSE |
| `platformOnly` | Solo usuarios de plataforma (company_id = null) |
| `platformAdminOnly` | Solo PLATFORM_ADMIN |

---

## 11. Pipeline de Interceptores HTTP

Los tres interceptores se registran en `app.config.ts` y se ejecutan en el orden declarado:

### tokenInterceptor
- Adjunta `Authorization: Bearer <token>` a todas las peticiones salientes
- Implementa refresh automático del JWT ante respuesta 401
- Evita el loop infinito excluyendo `/auth/refresh` y `/auth/login`

### clientViewInterceptor
Cuando un administrador de plataforma impersona una empresa, inyecta `?company_id=X` en cada petición de store, habilitando la vista del tenant seleccionado sin necesidad de una nueva sesión.

### errorInterceptor
Intercepta errores HTTP y muestra notificaciones contextuales en español mediante `MatSnackBar`. Los 401 no generan snackbar (los maneja `tokenInterceptor`).

---

## 12. Arquitectura Multi-Tenant

PymeFlow EC implementa **shared database, shared schema** con discriminación por `company_id` en cada tabla del backend. El frontend refuerza el aislamiento mediante tres mecanismos:

1. **Scoping por JWT** — el token del usuario contiene `company_id`; el backend filtra automáticamente
2. **Impersonación vía `clientViewInterceptor`** — PLATFORM_ADMIN selecciona una empresa → `AdminViewService` guarda un `Signal<Company>` → el interceptor inyecta `?company_id=X` en todas las peticiones
3. **Module Gating en Sidebar** — `CompanyModulesService` consulta los módulos habilitados y el sidebar filtra la navegación por estado APPROVED/PENDING

### Estados de empresa

| Estado | Descripción |
|---|---|
| `PENDING` | Registro recibido, pendiente de activación |
| `ACTIVE` | Empresa operativa |
| `INACTIVE` | Suscripción expirada |
| `SUSPENDED` | Suspendida por incumplimiento |

---

## 13. Gestión de Estado Reactivo

El frontend no incorpora librerías de gestión de estado externas. Angular 17 provee primitivos suficientes:

| Capa | Mecanismo | Justificación |
|---|---|---|
| **Sesión global** | `signal<AuthUser \| null>` en `AuthService` | Acceso síncrono; auto-recálculo de estados derivados |
| **Estados derivados de rol** | `computed(() => ...)` | Dependencia automática del signal |
| **Datos asíncronos** | `Observable<T>` desde servicios de dominio | RxJS: cancelación, composición, manejo de errores |
| **Impersonación** | `signal<Company \| null>` en `AdminViewService` | Leído en cada request por el interceptor |
| **Filtros client-side** | `signal<T[]>` + `computed()` | Carga única (`limit: 500`) + filtrado reactivo sin re-fetching |

### Patrón de carga client-side

Todos los listados con tabs + búsqueda siguen el mismo patrón: carga única y filtrado reactivo con signals:

```typescript
private allItems    = signal<Expense[]>([]);
readonly searchCtrl = new FormControl('');
private searchQ     = toSignal(this.searchCtrl.valueChanges.pipe(startWith('')), { initialValue: '' });

filteredItems = computed(() => {
  const q = this.searchQ()?.toLowerCase() ?? '';
  return this.allItems().filter(e =>
    e.description.toLowerCase().includes(q) || e.category?.name.toLowerCase().includes(q)
  );
});
```

---

## 14. Módulos Funcionales del ERP

### Clientes

Soporta los tres tipos de identificación fiscal vigentes en Ecuador: `CEDULA` (10 dígitos), `RUC` (13 dígitos) y `FINAL_CONSUMER`. El formulario valida checksum para cédula y RUC antes del envío.

### Productos e Inventario

Los productos registran `purchase_price` y `sale_price` de forma independiente. El control de stock se gestiona mediante movimientos tipados (`IN` / `OUT` / `ADJUSTMENT`) que generan un historial trazable.

### Facturación y Cobros

El flujo de emisión de factura opera como un POS inline:

```
Seleccionar cliente → Agregar líneas (producto + cantidad + descuento)
        → Cálculo automático de subtotal/IVA/total
        → POST /api/invoices
        → Cobros parciales desde el drawer de la lista de facturas
```

Cada cobro recalcula el `payment_status` de la factura (`PENDIENTE` / `PARCIAL` / `COBRADO`) automáticamente en el backend.

### Proveedores y Tasas de Impuesto

CRUD estándar. Las tasas de impuesto soportan `valid_from` / `valid_to` para reflejar cambios históricos del IVA.

### Reportes

`/reports` con tres vistas via `?view=`:

| Tab | Acceso | Contenido |
|---|---|---|
| `analytics` | Todos | KPIs de ventas, productos top, clientes frecuentes |
| `activity` | STORE_ADMIN | Logs de auditoría de la empresa (`/api/audit-logs/my-company`) |
| `finance` | MOD_FINANCE | KPIs financieros: caja chica, por cobrar, por pagar, balance neto |

### Administración de la Plataforma SaaS

| Vista | Funcionalidad |
|---|---|
| `CompaniesListComponent` | Lista paginada de empresas con filtro por estado |
| `CompanyDetailComponent` | Detalle de empresa: módulos activos, usuarios, cambio de estado |
| `AuditLogsComponent` | Visor de logs con filtros por empresa, acción y fecha |
| `SupportUsersListComponent` | CRUD de usuarios `PLATFORM_STAFF` (solo `PLATFORM_ADMIN`) |
| `ModuleRequestsListComponent` | Cola de solicitudes de módulos: aprobar / rechazar / revocar |

---

## 15. Módulo Financiero

El módulo financiero (`MOD_FINANCE`) es el desarrollo principal de la Fase 4 del proyecto. Agrupa seis sub-módulos en la ruta `/finance/*` y un dashboard analítico unificado.

### 15.1 Caja Chica (`/finance/petty-cash`)

- **KPI de saldo** con barra de progreso que cambia de verde a naranja a rojo según el porcentaje consumido del fondo inicial
- **Tabla de movimientos** con monto coloreado (entrada/salida) y saldo tras cada movimiento
- **Formulario inline** para registrar movimientos (EXPENSE / REPLENISH / ADJUSTMENT) con segmented control
- **Apertura y cierre** de sesiones; historial de sesiones cerradas expandible
- Una sola sesión `OPEN` por empresa; el backend valida saldo suficiente en cada EXPENSE

### 15.2 Egresos Operacionales (`/finance/expenses`)

- Tabs por `payment_status`: Todos / Pendiente / Parcial / Pagado / Anulado
- Filtros por categoría, rango de fechas y búsqueda de texto
- **Drawer de detalle** con KPIs (monto total / pagado / pendiente), campos completos y sección de pagos inline
- **Pagos de egresos** con soporte de múltiples métodos: efectivo, transferencia (referencia), tarjeta (contrapartida), cheque (número)
- Anular egreso o pago con confirmación (solo STORE_ADMIN)

### 15.3 Categorías de Egreso (`/finance/expense-categories`)

CRUD de categorías con tipos: `ADMINISTRATIVO | OPERATIVO | VENTAS | FINANCIERO | TRIBUTARIO | RECURSOS_HUMANOS | INVENTARIO | IMPREVISTO`. Soporte de activar/desactivar categorías.

### 15.4 Presupuestos (`/finance/expense-budgets`)

- Selector de año con flechas de navegación
- Tabs Todos / Mensual / Anual con filtro por categoría
- Modal crear (categoría, tipo de período, año, mes si mensual, monto, notas)
- Modal editar solo permite modificar monto y notas (no la categoría ni el período)

### 15.5 Egresos Recurrentes (`/finance/expense-recurring`)

Plantillas para egresos que se repiten mensualmente. Cada plantilla define: categoría, descripción, monto, día del mes (1–28), proveedor, tipo de comprobante, método de pago por defecto y fechas de vigencia.

### 15.6 Dashboard Financiero (`/finance/dashboard`)

Componente independiente con 7 tabs de navegación interna. Cada tab carga sus datos al activarse (carga lazy por tab):

| Tab | Contenido principal |
|---|---|
| **Ingresos** | Facturas emitidas, cobros por método, cuentas por cobrar; gráfico de barras SVG de ventas diarias |
| **Egresos y Gastos** | Tabla de egresos con filtros; KPIs por categoría; gráfico de barras horizontales SVG |
| **Compras** | Egresos con comprobante FACTURA asociado a proveedor; desglose de IVA (crédito tributario) |
| **Ventas** | Detalle a nivel ítem de facturas; filtros por cliente, producto y forma de pago |
| **Cuentas por Cobrar** | Facturas `PENDIENTE/PARCIAL`; botón de cobro inline reutilizando lógica de `invoices-list` |
| **Cuentas por Pagar** | Egresos `PENDIENTE/PARCIAL`; botón de pago inline reutilizando lógica de `expenses-list` |
| **Reportes** | Dos sub-tabs: Resumen General e Ingresos Líquidos (ver detalle abajo) |

#### Sub-tab Resumen General
Ventas sin/con IVA · Total gastos · Ganancia / Pérdida · IVA Neto SRI · Top 10 productos y clientes · Deudas pendientes · Stock bajo · Movimientos de caja · Resumen mensual de impuestos · Gráfico de barras agrupadas SVG (ventas vs gastos 6 meses) · Donut SVG de margen · Exportar CSV

#### Sub-tab Ingresos Líquidos
Ganancia bruta y ganancia real (solo cobros efectivos) · Variación % vs mes anterior · Top productos del mes · Comparación anual (si hay ≥ 2 años) · Distribución por método de pago

---

## 16. Generación de PDF Client-Side

`InvoicePdfService` utiliza **pdfmake** para construir y descargar facturas en PDF directamente en el navegador, sin requerir ningún endpoint de servidor dedicado.

### Estructura del documento generado

```
┌─────────────────────────────────────────────────────┐
│  LOGO / NOMBRE EMPRESA          FACTURA              │
│  Dirección · RUC · Email        Nº: FAC-000001       │
│                                 Fecha: 2026-05-10    │
├─────────────────────────────────────────────────────┤
│  CLIENTE                                             │
│  Nombre · Tipo doc · Número                          │
├──────────────────────┬──────┬───────┬───────┬───────┤
│  Descripción         │ Cant │ P.U.  │  IVA  │ Total │
├──────────────────────┴──────┴───────┴───────┴───────┤
│  Descuentos · Subtotal · IVA (15%) · TOTAL           │
└─────────────────────────────────────────────────────┘
```

---

## 17. Sistema de Estilos y Theming

### 17.1 Design System propio

El proyecto utiliza un sistema de diseño basado en tokens CSS definidos en `styles.scss`. Angular Material se usa únicamente para diálogos y snackbars; todos los demás componentes UI usan el sistema propio.

### 17.2 Tokens CSS

```scss
// Superficies
--bg, --surface, --surface-2, --surface-3

// Bordes
--border-ds, --border-strong-ds   /* alias: --border, --border-strong */

// Tipografía
--text-ds, --text-muted-ds, --text-subtle   /* alias: --text, --text-muted */

// Colores semánticos
--accent, --accent-hover, --accent-soft, --accent-soft-strong, --on-accent
--success, --success-soft, --warn, --warn-soft, --danger, --danger-soft

// Geometría
--radius-ds (10px), --radius-sm-ds (6px), --radius-lg-ds (14px)
--shadow-sm-ds, --shadow-ds, --shadow-lg-ds

// Tipografías
--font-ui, --font-display, --font-mono

// Layout
--sidebar-w (248px), --sidebar-w-collapsed (64px), --topbar-h (60px)

// Densidad
--density-row, --density-gap, --density-pad
```

### 17.3 Modos

| Modo | Activación |
|---|---|
| **Dark mode** | `[data-theme="dark"]` en `<html>` via `ThemeService` |
| **Density compact** | `[data-density="compact"]` en `<html>` |
| **Accent alternativo** | `[data-accent="emerald"]` o `[data-accent="amber"]` en `<html>` |

### 17.4 Clases del Design System

| Clase | Descripción |
|---|---|
| `.ds-table` | Tabla con estilos unificados |
| `.ds-tabs` / `.ds-tab` | Sistema de tabs con contador `<span class="count">` |
| `.ds-sidebar` / `.ds-topbar` | Shell de la aplicación |
| `.drawer` / `.drawer-backdrop` | Paneles laterales inline |
| `.modal-backdrop` / `.modal-box` | Modales inline (sin Dialog de Material) |
| `.mfield` / `.m-input` | Campos de formulario propios |
| `.seg` / `.seg-btn` | Segmented controls |
| `.btn`, `.card`, `.kpi`, `.badge` | Componentes base |

---

## 18. Configuración de Entornos y Build

### 18.1 Entornos

```typescript
// environment.ts (desarrollo)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'
};

// environment.prod.ts (producción)
export const environment = {
  production: true,
  apiUrl: 'https://api.tesisfernandonavaspuce.es/api'
};
```

### 18.2 TypeScript strict mode

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "strict": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true
  },
  "angularCompilerOptions": {
    "strictTemplates": true
  }
}
```

### 18.3 Optimizaciones de producción

| Técnica | Efecto |
|---|---|
| Tree-shaking (esbuild) | Elimina código no referenciado |
| Code splitting por ruta | Un chunk JS por componente lazy |
| Minificación JS + CSS | Reducción de tamaño de transferencia |
| Hashing de artefactos | Cache busting automático |

---

## 19. Instalación y Ejecución

### Pre-requisitos

| Herramienta | Versión mínima |
|---|---|
| Node.js | 18.x LTS |
| npm | 9.x |
| Angular CLI | 17.x (`npm i -g @angular/cli@17`) |

### Pasos de instalación

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd pymeflowec-front

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
ng serve
# → http://localhost:4200
# → Conecta con el backend en http://localhost:8080/api

# 4. Compilar para producción
ng build
# → Artefactos en dist/pymeflowec-frontend/
```

### Scripts disponibles

| Script | Descripción |
|---|---|
| `ng serve` | Servidor de desarrollo con HMR en localhost:4200 |
| `ng build` | Build de producción optimizado |
| `ng build --configuration development` | Build de desarrollo (más rápido, sin minificación) |
| `npx tsc --noEmit` | Verificación de tipos sin compilar |

> El servidor backend (Node.js + Express) debe estar ejecutándose en `http://localhost:8080` para el modo desarrollo.

---

## 20. Patrones y Decisiones de Diseño

### Standalone Components (eliminación de NgModules)

Angular 17 consolida el modelo standalone introducido en Angular 14. Cada componente declara sus propias dependencias en `imports`, permitiendo lazy loading a nivel de componente y tree-shaking más eficiente.

### Functional Guards e Interceptors

El proyecto usa exclusivamente el enfoque funcional (`CanActivateFn`, `HttpInterceptorFn`) disponible desde Angular 15+, reduciendo boilerplate y habilitando `inject()` directamente sin constructor.

### Signals como primitivo de estado

El `AuthService` abandona el patrón `BehaviorSubject` en favor de Signals nativos:

| Patrón anterior (RxJS) | Patrón actual (Signals) |
|---|---|
| `private _user$ = new BehaviorSubject<AuthUser\|null>(null)` | `currentUser = signal<AuthUser\|null>(null)` |
| `isAdmin$ = this.user$.pipe(map(u => u?.role === 'ADMIN'))` | `isAdmin = computed(() => currentUser()?.role === 'ADMIN')` |
| `ngOnDestroy + unsubscribe` | No necesario |

### SVG Inline en lugar de librerías de gráficas

ApexCharts fue descartado tras detectar que los bindings de opciones en getters provocan re-evaluaciones infinitas que congelan el navegador. Todos los gráficos (barras verticales/horizontales, donut, sparklines) se generan como SVG inline calculado en una propiedad del componente y actualizado solo cuando llegan nuevos datos.

### Formulario único para creación y edición

`ClientFormComponent`, `ProductFormComponent`, `SupplierFormComponent` y similares sirven tanto para crear como para editar. La diferenciación se realiza leyendo el parámetro `:id` de la ruta activa en `ngOnInit`.

### Localización al español (Ecuador)

La aplicación está completamente localizada sin `@angular/localize`:

- `MatPaginatorIntl` personalizado con textos en español
- `errorInterceptor` mapea todos los códigos HTTP a mensajes en español
- IVA Ecuador: 15 % fijo
- RUC: 13 dígitos · Cédula: 10 dígitos con checksum módulo 10
- Formatos de fecha: `dd/MM/yyyy`

---

## Autor

**Fernando Navas**  
Trabajo de Titulación — Ingeniería en Sistemas / Computación  
Ecuador, 2026

---

*PymeFlow EC es un sistema ERP multi-tenant SaaS desarrollado como trabajo de titulación, aplicado al contexto fiscal y operativo de las PyMEs ecuatorianas. El proyecto abarca diseño de arquitectura, implementación del frontend con Angular 17, integración con una API REST bajo principios de multi-tenencia, seguridad basada en roles y módulos financieros completos incluyendo caja chica, egresos, presupuestos y analítica.*
