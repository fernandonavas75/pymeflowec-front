import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ModuleRequestService } from '../../core/services/module-request.service';
import { PlatformModule } from '../../core/models/auth.model';

interface Feature {
  icon: string;
  title: string;
  description: string;
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
  private moduleService = inject(ModuleRequestService);

  modules = signal<PlatformModule[]>([]);

  features: Feature[] = [
    { icon: 'inventory_2',      title: 'Inventario',        description: 'Control de stock en tiempo real con alertas de bajo inventario y movimientos automáticos.' },
    { icon: 'receipt_long',     title: 'Facturación SRI',   description: 'Emisión de facturas electrónicas integradas al SRI con firma digital y validación automática.' },
    { icon: 'bar_chart',        title: 'Reportes',          description: 'Dashboards interactivos con indicadores clave: ventas, gastos, rentabilidad y flujo de caja.' },
    { icon: 'people',           title: 'Clientes y CRM',    description: 'Gestiona tu cartera de clientes, historial de compras y comunicaciones centralizadas.' },
    { icon: 'local_shipping',   title: 'Compras',           description: 'Órdenes de compra, seguimiento de proveedores y control de costos automatizado.' },
    { icon: 'account_balance',  title: 'Contabilidad',      description: 'Cierre contable, balance general, estado de resultados y conciliaciones bancarias.' },
  ];

  steps: Step[] = [
    { number: '01', icon: 'app_registration',  title: 'Regístrate',          description: 'Crea tu organización en minutos. Solo necesitas tu RUC y datos básicos de la empresa.' },
    { number: '02', icon: 'extension',          title: 'Selecciona módulos',  description: 'Elige los módulos que necesitas. El superadmin aprobará tu solicitud en 24 horas.' },
    { number: '03', icon: 'rocket_launch',      title: '¡Empieza a gestionar!', description: 'Accede a tu panel personalizado y comienza a digitalizar tu negocio hoy mismo.' },
  ];

  currentYear = new Date().getFullYear();

  moduleIcons: Record<string, string> = {
    inventory:    'inventory_2',
    sales:        'point_of_sale',
    invoicing:    'receipt_long',
    purchases:    'local_shipping',
    accounting:   'account_balance',
    expenses:     'payments',
    reports:      'bar_chart',
    crm:          'people',
    cash:         'account_balance_wallet',
  };

  ngOnInit(): void {
    this.moduleService.getPublicModules().subscribe({
      next: mods => this.modules.set(mods),
      error: () => {},
    });
  }

  getModuleIcon(code: string): string {
    return this.moduleIcons[code] ?? 'extension';
  }
}
