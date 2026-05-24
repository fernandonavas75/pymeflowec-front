import { Component, inject, OnInit, signal, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ModuleRequestRegisterService } from '../../core/services/module-request-register.service';
import { PlatformModule } from '../../core/models/module-request.model';

interface Feature {
  icon: string;
  title: string;
  description: string;
  color: string;
}

interface Step {
  number: string;
  title: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
})
export class LandingComponent implements OnInit {
  private moduleService = inject(ModuleRequestRegisterService);

  modules = signal<PlatformModule[]>([]);

  features: Feature[] = [
    {
      icon: 'receipt_long',
      title: 'Facturación y Cobros',
      description: 'Emite facturas, registra cobros parciales y lleva el estado automático de cada venta: Pendiente, Parcial o Cobrada.',
      color: 'blue',
    },
    {
      icon: 'inventory_2',
      title: 'Inventario de Productos',
      description: 'Control de stock en tiempo real con movimientos de entrada, salida y ajuste. Importación masiva por CSV.',
      color: 'purple',
    },
    {
      icon: 'account_balance_wallet',
      title: 'Módulo Financiero',
      description: 'Caja chica, egresos operacionales, presupuestos por categoría y plantillas de gastos recurrentes integrados.',
      color: 'green',
    },
    {
      icon: 'local_shipping',
      title: 'Proveedores',
      description: 'Directorio de proveedores con RUC y datos de contacto. Vinculación directa con egresos y compras registradas.',
      color: 'teal',
    },
    {
      icon: 'people',
      title: 'Cartera de Clientes',
      description: 'Base de datos de clientes con historial de facturas y validación automática de cédula ecuatoriana, RUC y pasaporte.',
      color: 'indigo',
    },
    {
      icon: 'bar_chart',
      title: 'Reportes y KPIs',
      description: 'Métricas de ventas, rentabilidad estimada, actividad del sistema y estado de cuentas por cobrar y pagar.',
      color: 'amber',
    },
    {
      icon: 'percent',
      title: 'Impuestos (SRI)',
      description: 'Tasas de IVA configurables por producto. Compatible con la normativa tributaria del Servicio de Rentas Internas del Ecuador.',
      color: 'purple',
    },
    {
      icon: 'manage_accounts',
      title: 'Usuarios y Roles',
      description: 'Administrador, Vendedor y Bodeguero con permisos granulares para cada área. Control de acceso por URL y acción.',
      color: 'blue',
    },
    {
      icon: 'admin_panel_settings',
      title: 'Plataforma Multi-empresa',
      description: 'Cada PYME opera en un entorno completamente aislado. Módulos aprobados por administradores certificados de plataforma.',
      color: 'teal',
    },
  ];

  financeFeatures = [
    {
      icon: 'account_balance_wallet',
      title: 'Caja Chica',
      description: 'Abre sesiones de caja, registra movimientos de gasto o reposición y cierra con cuadre automático de saldo.',
    },
    {
      icon: 'trending_down',
      title: 'Egresos Operacionales',
      description: 'Gastos con comprobante (factura, nota de venta, recibo) y registro de pagos parciales o totales por egreso.',
    },
    {
      icon: 'tune',
      title: 'Presupuestos',
      description: 'Presupuestos mensuales o anuales por categoría para controlar el gasto y detectar desviaciones a tiempo.',
    },
    {
      icon: 'repeat',
      title: 'Gastos Recurrentes',
      description: 'Plantillas de egresos recurrentes (arriendo, sueldos, servicios básicos) con día de generación configurable.',
    },
    {
      icon: 'query_stats',
      title: 'KPIs Financieros',
      description: 'Saldo de caja, cuentas por cobrar, egresos pendientes y balance neto estimado en tiempo real.',
    },
  ];

  roles = [
    {
      name: 'STORE_ADMIN',
      label: 'Administrador',
      icon: 'shield',
      color: 'indigo',
      description: 'Control total de la empresa.',
      permissions: [
        'CRUD de productos, clientes y proveedores',
        'Emitir, anular y cobrar facturas',
        'Abrir, cerrar y gestionar caja chica',
        'Registrar y anular egresos y pagos',
        'Gestionar usuarios, módulos y reportes',
      ],
    },
    {
      name: 'STORE_SELLER',
      label: 'Vendedor',
      icon: 'storefront',
      color: 'blue',
      description: 'Operación diaria de ventas.',
      permissions: [
        'Crear facturas y registrar cobros',
        'Consultar clientes y catálogo',
        'Agregar movimientos de caja chica',
        'Ver reportes de ventas propias',
      ],
    },
    {
      name: 'STORE_WAREHOUSE',
      label: 'Bodeguero',
      icon: 'warehouse',
      color: 'amber',
      description: 'Gestión de inventario y stock.',
      permissions: [
        'Ajustar stock de productos',
        'Registrar entradas y salidas',
        'Ver catálogo de productos',
      ],
    },
  ];

  steps: Step[] = [
    {
      number: '01',
      icon: 'app_registration',
      title: 'Regístrate',
      description: 'Crea tu empresa en minutos. Solo necesitas tu RUC y datos básicos de contacto.',
    },
    {
      number: '02',
      icon: 'pending_actions',
      title: 'Solicita módulos',
      description: 'Elige los módulos que necesitas. Un administrador de plataforma los revisará y activará para tu empresa.',
    },
    {
      number: '03',
      icon: 'rocket_launch',
      title: '¡Empieza a gestionar!',
      description: 'Accede a tu panel personalizado y digitaliza las operaciones de tu empresa desde el primer día.',
    },
  ];

  currentYear = new Date().getFullYear();

  moduleIcons: Record<string, string> = {
    inventory:  'inventory_2',
    sales:      'point_of_sale',
    invoicing:  'receipt_long',
    purchases:  'local_shipping',
    accounting: 'account_balance',
    expenses:   'payments',
    reports:    'bar_chart',
    crm:        'people',
    cash:       'account_balance_wallet',
  };

  constructor() {
    afterNextRender(() => this.setupScrollAnimations());
  }

  ngOnInit(): void {
    this.moduleService.getPublicModules().subscribe({
      next: mods => this.modules.set(mods.filter(m => m.is_active)),
      error: () => {},
    });
  }

  getModuleIcon(code: string): string {
    return this.moduleIcons[code.toLowerCase()] ?? 'extension';
  }

  private setupScrollAnimations(): void {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    );
    document.querySelectorAll('.anim').forEach(el => observer.observe(el));
  }
}
