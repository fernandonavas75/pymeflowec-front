import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
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
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
        data: { roles: ['superadmin', 'admin', 'manager', 'seller', 'viewer'] },
        canActivate: [roleGuard],
      },
      {
        path: 'products',
        loadComponent: () => import('./features/products/products-list/products-list.component').then(m => m.ProductsListComponent),
      },
      {
        path: 'products/new',
        loadComponent: () => import('./features/products/product-form/product-form.component').then(m => m.ProductFormComponent),
        data: { roles: ['superadmin', 'admin', 'manager'] },
        canActivate: [roleGuard],
      },
      {
        path: 'products/:id/edit',
        loadComponent: () => import('./features/products/product-form/product-form.component').then(m => m.ProductFormComponent),
        data: { roles: ['superadmin', 'admin', 'manager'] },
        canActivate: [roleGuard],
      },
      {
        path: 'clients',
        loadComponent: () => import('./features/clients/clients-list/clients-list.component').then(m => m.ClientsListComponent),
      },
      {
        path: 'clients/new',
        loadComponent: () => import('./features/clients/client-form/client-form.component').then(m => m.ClientFormComponent),
      },
      {
        path: 'clients/:id/edit',
        loadComponent: () => import('./features/clients/client-form/client-form.component').then(m => m.ClientFormComponent),
      },
      {
        path: 'suppliers',
        loadComponent: () => import('./features/suppliers/suppliers-list/suppliers-list.component').then(m => m.SuppliersListComponent),
        data: { roles: ['superadmin', 'admin', 'manager'] },
        canActivate: [roleGuard],
      },
      {
        path: 'suppliers/new',
        loadComponent: () => import('./features/suppliers/supplier-form/supplier-form.component').then(m => m.SupplierFormComponent),
        data: { roles: ['superadmin', 'admin', 'manager'] },
        canActivate: [roleGuard],
      },
      {
        path: 'suppliers/:id/edit',
        loadComponent: () => import('./features/suppliers/supplier-form/supplier-form.component').then(m => m.SupplierFormComponent),
        data: { roles: ['superadmin', 'admin', 'manager'] },
        canActivate: [roleGuard],
      },
      {
        path: 'orders',
        loadComponent: () => import('./features/orders/orders-list/orders-list.component').then(m => m.OrdersListComponent),
      },
      {
        path: 'orders/new',
        loadComponent: () => import('./features/orders/order-create/order-create.component').then(m => m.OrderCreateComponent),
      },
      {
        path: 'orders/:id',
        loadComponent: () => import('./features/orders/order-detail/order-detail.component').then(m => m.OrderDetailComponent),
      },
      {
        path: 'invoices',
        loadComponent: () => import('./features/invoices/invoices-list/invoices-list.component').then(m => m.InvoicesListComponent),
      },
      {
        path: 'invoices/:id',
        loadComponent: () => import('./features/invoices/invoice-detail/invoice-detail.component').then(m => m.InvoiceDetailComponent),
      },
      {
        path: 'users',
        loadComponent: () => import('./features/users/users-list/users-list.component').then(m => m.UsersListComponent),
        data: { roles: ['superadmin', 'admin'] },
        canActivate: [roleGuard],
      },
      {
        path: 'users/new',
        loadComponent: () => import('./features/users/user-form/user-form.component').then(m => m.UserFormComponent),
        data: { roles: ['superadmin', 'admin'] },
        canActivate: [roleGuard],
      },
      {
        path: 'users/:id/edit',
        loadComponent: () => import('./features/users/user-form/user-form.component').then(m => m.UserFormComponent),
        data: { roles: ['superadmin', 'admin'] },
        canActivate: [roleGuard],
      },
    ],
  },
  { path: '**', redirectTo: '/dashboard' },
];
