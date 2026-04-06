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
        loadComponent: () => import('./features/categories/categories-list/categories-list.component').then(m => m.CategoriesListComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['products.view'] },
      },
      {
        path: 'categories/new',
        loadComponent: () => import('./features/categories/category-form/category-form.component').then(m => m.CategoryFormComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['products.create'] },
      },
      {
        path: 'categories/:id/edit',
        loadComponent: () => import('./features/categories/category-form/category-form.component').then(m => m.CategoryFormComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['products.edit'] },
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
        loadComponent: () => import('./features/payments/payments-list/payments-list.component').then(m => m.PaymentsListComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['payments.view'] },
      },
      {
        path: 'payments/new',
        loadComponent: () => import('./features/payments/payment-create/payment-create.component').then(m => m.PaymentCreateComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['payments.create'] },
      },

      // Notas de crédito
      {
        path: 'credit-notes',
        loadComponent: () => import('./features/credit-notes/credit-notes-list/credit-notes-list.component').then(m => m.CreditNotesListComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['credit_notes.manage'] },
      },
      {
        path: 'credit-notes/new',
        loadComponent: () => import('./features/credit-notes/credit-note-create/credit-note-create.component').then(m => m.CreditNoteCreateComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['credit_notes.manage'] },
      },
      {
        path: 'credit-notes/:id',
        loadComponent: () => import('./features/credit-notes/credit-note-detail/credit-note-detail.component').then(m => m.CreditNoteDetailComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['credit_notes.manage'] },
      },

      // Órdenes de compra
      {
        path: 'purchase-orders',
        loadComponent: () => import('./features/purchase-orders/purchase-orders-list/purchase-orders-list.component').then(m => m.PurchaseOrdersListComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['purchases.view'] },
      },
      {
        path: 'purchase-orders/new',
        loadComponent: () => import('./features/purchase-orders/purchase-order-create/purchase-order-create.component').then(m => m.PurchaseOrderCreateComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['purchases.manage'] },
      },
      {
        path: 'purchase-orders/:id',
        loadComponent: () => import('./features/purchase-orders/purchase-order-detail/purchase-order-detail.component').then(m => m.PurchaseOrderDetailComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['purchases.view'] },
      },

      // Caja
      {
        path: 'cash-registers',
        loadComponent: () => import('./features/cash-registers/cash-registers-list/cash-registers-list.component').then(m => m.CashRegistersListComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['cash_register.operate'] },
      },
      {
        path: 'cash-registers/:id',
        loadComponent: () => import('./features/cash-registers/cash-register-detail/cash-register-detail.component').then(m => m.CashRegisterDetailComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['cash_register.operate'] },
      },

      // Gastos
      {
        path: 'expenses',
        loadComponent: () => import('./features/expenses/expenses-list/expenses-list.component').then(m => m.ExpensesListComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['expenses.view'] },
      },
      {
        path: 'expenses/new',
        loadComponent: () => import('./features/expenses/expense-create/expense-create.component').then(m => m.ExpenseCreateComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['expenses.create'] },
      },
      {
        path: 'expenses/categories',
        loadComponent: () => import('./features/expenses/expense-categories/expense-categories.component').then(m => m.ExpenseCategoriesComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['expenses.manage'] },
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
        loadComponent: () => import('./features/roles/roles-list/roles-list.component').then(m => m.RolesListComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['roles.manage'] },
      },
      {
        path: 'roles/new',
        loadComponent: () => import('./features/roles/role-form/role-form.component').then(m => m.RoleFormComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['roles.manage'] },
      },
      {
        path: 'roles/:id/edit',
        loadComponent: () => import('./features/roles/role-form/role-form.component').then(m => m.RoleFormComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['roles.manage'] },
      },

      // Solicitudes de módulos — accesible para cualquier usuario de org, backend enforcea por endpoint
      {
        path: 'module-requests',
        loadComponent: () => import('./features/module-requests/module-requests-list/module-requests-list.component').then(m => m.ModuleRequestsListComponent),
      },

      // Organizaciones (solo superadmin / platform staff)
      {
        path: 'organizations',
        loadComponent: () => import('./features/organizations/organizations-list/organizations-list.component').then(m => m.OrganizationsListComponent),
        canActivate: [permissionGuard],
        data: { platformStaff: true },
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
        loadComponent: () => import('./features/platform-staff/platform-staff-list/platform-staff-list.component').then(m => m.PlatformStaffListComponent),
        canActivate: [permissionGuard],
        data: { platformStaff: true },
      },
    ],
  },
  { path: '**', redirectTo: '/' },
];
