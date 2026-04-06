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

      // Productos
      {
        path: 'products',
        loadComponent: () => import('./features/products/products-list/products-list.component').then(m => m.ProductsListComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['products.view'] },
      },
      {
        path: 'products/new',
        loadComponent: () => import('./features/products/product-form/product-form.component').then(m => m.ProductFormComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['products.create'] },
      },
      {
        path: 'products/:id/edit',
        loadComponent: () => import('./features/products/product-form/product-form.component').then(m => m.ProductFormComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['products.edit'] },
      },

      // Categorías
      {
        path: 'categories',
        loadComponent: () => import('./shared/components/coming-soon/coming-soon.component').then(m => m.ComingSoonComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['products.view'], title: 'Categorías' },
      },
      {
        path: 'categories/new',
        loadComponent: () => import('./shared/components/coming-soon/coming-soon.component').then(m => m.ComingSoonComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['products.create'], title: 'Nueva categoría' },
      },
      {
        path: 'categories/:id/edit',
        loadComponent: () => import('./shared/components/coming-soon/coming-soon.component').then(m => m.ComingSoonComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['products.edit'], title: 'Editar categoría' },
      },

      // Clientes
      {
        path: 'clients',
        loadComponent: () => import('./features/clients/clients-list/clients-list.component').then(m => m.ClientsListComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['clients.view'] },
      },
      {
        path: 'clients/new',
        loadComponent: () => import('./features/clients/client-form/client-form.component').then(m => m.ClientFormComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['clients.create'] },
      },
      {
        path: 'clients/:id/edit',
        loadComponent: () => import('./features/clients/client-form/client-form.component').then(m => m.ClientFormComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['clients.edit'] },
      },

      // Proveedores
      {
        path: 'suppliers',
        loadComponent: () => import('./features/suppliers/suppliers-list/suppliers-list.component').then(m => m.SuppliersListComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['suppliers.view'] },
      },
      {
        path: 'suppliers/new',
        loadComponent: () => import('./features/suppliers/supplier-form/supplier-form.component').then(m => m.SupplierFormComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['suppliers.manage'] },
      },
      {
        path: 'suppliers/:id/edit',
        loadComponent: () => import('./features/suppliers/supplier-form/supplier-form.component').then(m => m.SupplierFormComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['suppliers.manage'] },
      },

      // Pedidos
      {
        path: 'orders',
        loadComponent: () => import('./features/orders/orders-list/orders-list.component').then(m => m.OrdersListComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['orders.view'] },
      },
      {
        path: 'orders/new',
        loadComponent: () => import('./features/orders/order-create/order-create.component').then(m => m.OrderCreateComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['orders.create'] },
      },
      {
        path: 'orders/:id',
        loadComponent: () => import('./features/orders/order-detail/order-detail.component').then(m => m.OrderDetailComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['orders.view'] },
      },

      // Facturas
      {
        path: 'invoices',
        loadComponent: () => import('./features/invoices/invoices-list/invoices-list.component').then(m => m.InvoicesListComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['invoices.view'] },
      },
      {
        path: 'invoices/:id',
        loadComponent: () => import('./features/invoices/invoice-detail/invoice-detail.component').then(m => m.InvoiceDetailComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['invoices.view'] },
      },

      // Pagos
      {
        path: 'payments',
        loadComponent: () => import('./shared/components/coming-soon/coming-soon.component').then(m => m.ComingSoonComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['payments.view'], title: 'Pagos' },
      },
      {
        path: 'payments/new',
        loadComponent: () => import('./shared/components/coming-soon/coming-soon.component').then(m => m.ComingSoonComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['payments.create'], title: 'Nuevo pago' },
      },

      // Notas de crédito
      {
        path: 'credit-notes',
        loadComponent: () => import('./shared/components/coming-soon/coming-soon.component').then(m => m.ComingSoonComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['credit_notes.manage'], title: 'Notas de crédito' },
      },
      {
        path: 'credit-notes/new',
        loadComponent: () => import('./shared/components/coming-soon/coming-soon.component').then(m => m.ComingSoonComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['credit_notes.manage'], title: 'Nueva nota de crédito' },
      },
      {
        path: 'credit-notes/:id',
        loadComponent: () => import('./shared/components/coming-soon/coming-soon.component').then(m => m.ComingSoonComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['credit_notes.manage'], title: 'Detalle nota de crédito' },
      },

      // Órdenes de compra
      {
        path: 'purchase-orders',
        loadComponent: () => import('./shared/components/coming-soon/coming-soon.component').then(m => m.ComingSoonComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['purchases.view'], title: 'Órdenes de compra' },
      },
      {
        path: 'purchase-orders/new',
        loadComponent: () => import('./shared/components/coming-soon/coming-soon.component').then(m => m.ComingSoonComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['purchases.manage'], title: 'Nueva orden de compra' },
      },
      {
        path: 'purchase-orders/:id',
        loadComponent: () => import('./shared/components/coming-soon/coming-soon.component').then(m => m.ComingSoonComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['purchases.view'], title: 'Detalle orden de compra' },
      },

      // Caja
      {
        path: 'cash-registers',
        loadComponent: () => import('./shared/components/coming-soon/coming-soon.component').then(m => m.ComingSoonComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['cash_register.operate'], title: 'Caja' },
      },
      {
        path: 'cash-registers/:id',
        loadComponent: () => import('./shared/components/coming-soon/coming-soon.component').then(m => m.ComingSoonComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['cash_register.operate'], title: 'Detalle de caja' },
      },

      // Gastos
      {
        path: 'expenses',
        loadComponent: () => import('./shared/components/coming-soon/coming-soon.component').then(m => m.ComingSoonComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['expenses.view'], title: 'Gastos' },
      },
      {
        path: 'expenses/new',
        loadComponent: () => import('./shared/components/coming-soon/coming-soon.component').then(m => m.ComingSoonComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['expenses.create'], title: 'Nuevo gasto' },
      },
      {
        path: 'expenses/categories',
        loadComponent: () => import('./shared/components/coming-soon/coming-soon.component').then(m => m.ComingSoonComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['expenses.manage'], title: 'Categorías de gastos' },
      },

      // Usuarios
      {
        path: 'users',
        loadComponent: () => import('./features/users/users-list/users-list.component').then(m => m.UsersListComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['users.view'] },
      },
      {
        path: 'users/new',
        loadComponent: () => import('./features/users/user-form/user-form.component').then(m => m.UserFormComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['users.manage'] },
      },
      {
        path: 'users/:id/edit',
        loadComponent: () => import('./features/users/user-form/user-form.component').then(m => m.UserFormComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['users.manage'] },
      },

      // Roles
      {
        path: 'roles',
        loadComponent: () => import('./shared/components/coming-soon/coming-soon.component').then(m => m.ComingSoonComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['roles.manage'], title: 'Roles' },
      },
      {
        path: 'roles/new',
        loadComponent: () => import('./shared/components/coming-soon/coming-soon.component').then(m => m.ComingSoonComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['roles.manage'], title: 'Nuevo rol' },
      },
      {
        path: 'roles/:id/edit',
        loadComponent: () => import('./shared/components/coming-soon/coming-soon.component').then(m => m.ComingSoonComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['roles.manage'], title: 'Editar rol' },
      },

      // Solicitudes de módulos
      {
        path: 'module-requests',
        loadComponent: () => import('./shared/components/coming-soon/coming-soon.component').then(m => m.ComingSoonComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['modules.view', 'modules.request'], title: 'Solicitudes de módulos' },
      },

      // Organizaciones (solo superadmin / platform staff)
      {
        path: 'organizations',
        loadComponent: () => import('./shared/components/coming-soon/coming-soon.component').then(m => m.ComingSoonComponent),
        canActivate: [permissionGuard],
        data: { platformStaff: true, title: 'Organizaciones' },
      },

      // Plataforma (solo platform staff)
      {
        path: 'platform/modules',
        loadComponent: () => import('./shared/components/coming-soon/coming-soon.component').then(m => m.ComingSoonComponent),
        canActivate: [permissionGuard],
        data: { platformStaff: true, title: 'Módulos de plataforma' },
      },
      {
        path: 'platform/staff',
        loadComponent: () => import('./shared/components/coming-soon/coming-soon.component').then(m => m.ComingSoonComponent),
        canActivate: [permissionGuard],
        data: { platformStaff: true, title: 'Staff de plataforma' },
      },
    ],
  },
  { path: '**', redirectTo: '/' },
];
