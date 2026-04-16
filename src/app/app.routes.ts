import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent),
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
  },
  {
    path: '',
    loadComponent: () => import('./layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [

      // Dashboard
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },

      // Clientes
      {
        path: 'customers',
        loadComponent: () => import('./features/clients/clients-list/clients-list.component').then(m => m.ClientsListComponent),
      },
      {
        path: 'customers/new',
        loadComponent: () => import('./features/clients/client-form/client-form.component').then(m => m.ClientFormComponent),
      },
      {
        path: 'customers/:id/edit',
        loadComponent: () => import('./features/clients/client-form/client-form.component').then(m => m.ClientFormComponent),
      },

      // Productos
      {
        path: 'products',
        loadComponent: () => import('./features/products/products-list/products-list.component').then(m => m.ProductsListComponent),
      },
      {
        path: 'products/new',
        loadComponent: () => import('./features/products/product-form/product-form.component').then(m => m.ProductFormComponent),
        canActivate: [permissionGuard],
        data: { adminOnly: true },
      },
      {
        path: 'products/:id/edit',
        loadComponent: () => import('./features/products/product-form/product-form.component').then(m => m.ProductFormComponent),
        canActivate: [permissionGuard],
        data: { adminOnly: true },
      },

      // Proveedores
      {
        path: 'suppliers',
        loadComponent: () => import('./features/suppliers/suppliers-list/suppliers-list.component').then(m => m.SuppliersListComponent),
      },
      {
        path: 'suppliers/new',
        loadComponent: () => import('./features/suppliers/supplier-form/supplier-form.component').then(m => m.SupplierFormComponent),
        canActivate: [permissionGuard],
        data: { adminOnly: true },
      },
      {
        path: 'suppliers/:id/edit',
        loadComponent: () => import('./features/suppliers/supplier-form/supplier-form.component').then(m => m.SupplierFormComponent),
        canActivate: [permissionGuard],
        data: { adminOnly: true },
      },

      // Facturas
      {
        path: 'invoices',
        loadComponent: () => import('./features/invoices/invoices-list/invoices-list.component').then(m => m.InvoicesListComponent),
      },
      {
        path: 'invoices/new',
        loadComponent: () => import('./features/invoices/invoice-create/invoice-create.component').then(m => m.InvoiceCreateComponent),
      },
      {
        path: 'invoices/:id',
        loadComponent: () => import('./features/invoices/invoice-detail/invoice-detail.component').then(m => m.InvoiceDetailComponent),
      },

      // Tasas de impuesto
      {
        path: 'tax-rates',
        loadComponent: () => import('./features/tax-rates/tax-rates-list/tax-rates-list.component').then(m => m.TaxRatesListComponent),
        canActivate: [permissionGuard],
        data: { adminOnly: true },
      },
      {
        path: 'tax-rates/new',
        loadComponent: () => import('./features/tax-rates/tax-rate-form/tax-rate-form.component').then(m => m.TaxRateFormComponent),
        canActivate: [permissionGuard],
        data: { adminOnly: true },
      },
      {
        path: 'tax-rates/:id/edit',
        loadComponent: () => import('./features/tax-rates/tax-rate-form/tax-rate-form.component').then(m => m.TaxRateFormComponent),
        canActivate: [permissionGuard],
        data: { adminOnly: true },
      },

      // Usuarios
      {
        path: 'users',
        loadComponent: () => import('./features/users/users-list/users-list.component').then(m => m.UsersListComponent),
        canActivate: [permissionGuard],
        data: { adminOnly: true },
      },
      {
        path: 'users/new',
        loadComponent: () => import('./features/users/user-form/user-form.component').then(m => m.UserFormComponent),
        canActivate: [permissionGuard],
        data: { adminOnly: true },
      },
      {
        path: 'users/:id/edit',
        loadComponent: () => import('./features/users/user-form/user-form.component').then(m => m.UserFormComponent),
        canActivate: [permissionGuard],
        data: { adminOnly: true },
      },

      // Solicitudes de módulos
      {
        path: 'module-requests',
        loadComponent: () => import('./features/module-requests/module-requests-list/module-requests-list.component').then(m => m.ModuleRequestsListComponent),
        canActivate: [permissionGuard],
        data: { adminOnly: true },
      },

      // Empresas — solo plataforma
      {
        path: 'companies',
        loadComponent: () => import('./features/companies/companies-list/companies-list.component').then(m => m.CompaniesListComponent),
        canActivate: [permissionGuard],
        data: { platform: true },
      },
      {
        path: 'companies/:id',
        loadComponent: () => import('./features/companies/company-detail/company-detail.component').then(m => m.CompanyDetailComponent),
        canActivate: [permissionGuard],
        data: { platform: true },
      },

      // Módulos de plataforma
      {
        path: 'platform/modules',
        loadComponent: () => import('./shared/components/coming-soon/coming-soon.component').then(m => m.ComingSoonComponent),
        canActivate: [permissionGuard],
        data: { platform: true, title: 'Módulos de plataforma' },
      },

      // Usuarios de soporte — solo plataforma
      {
        path: 'platform/support-users',
        loadComponent: () => import('./features/platform/support-users/support-users-list.component').then(m => m.SupportUsersListComponent),
        canActivate: [permissionGuard],
        data: { platform: true },
      },

      // Registros de auditoría — solo plataforma
      {
        path: 'platform/audit-logs',
        loadComponent: () => import('./features/platform/audit-logs/audit-logs.component').then(m => m.AuditLogsComponent),
        canActivate: [permissionGuard],
        data: { platform: true },
      },
    ],
  },
  { path: '**', redirectTo: '/' },
];
