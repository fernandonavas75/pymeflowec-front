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
      icon: 'inventory_2',
      title: 'Inventario y Catálogo',
      description: 'Gestiona productos, stock y precios en tiempo real con control total de tu catálogo comercial.',
      color: 'purple',
    },
    {
      icon: 'receipt_long',
      title: 'Facturación',
      description: 'Genera y administra facturas de forma organizada. Historial completo de ventas por cliente.',
      color: 'blue',
    },
    {
      icon: 'local_shipping',
      title: 'Proveedores y Compras',
      description: 'Registra proveedores, gestiona órdenes de compra y controla los costos de adquisición.',
      color: 'teal',
    },
    {
      icon: 'people',
      title: 'Cartera de Clientes',
      description: 'Organiza tu base de clientes con historial de facturas y datos siempre actualizados.',
      color: 'green',
    },
    {
      icon: 'percent',
      title: 'Impuestos Configurables',
      description: 'Define tasas de impuesto personalizadas adaptadas a los productos y servicios de tu empresa.',
      color: 'amber',
    },
    {
      icon: 'support_agent',
      title: 'Soporte de Plataforma',
      description: 'Administradores dedicados aprueban módulos, gestionan empresas y supervisan operaciones.',
      color: 'indigo',
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
