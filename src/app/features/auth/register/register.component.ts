import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AuthService } from '../../../core/services/auth.service';
import { ModuleRequestService } from '../../../core/services/module-request.service';
import { PlatformModule } from '../../../core/models/auth.model';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirm  = control.get('confirm_password');
  if (!password || !confirm) return null;
  return password.value !== confirm.value ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {
  private fb             = inject(FormBuilder);
  private authService    = inject(AuthService);
  private moduleService  = inject(ModuleRequestService);
  private router         = inject(Router);

  step            = signal(1);
  loading         = signal(false);
  error           = signal('');
  showPassword    = signal(false);
  showConfirm     = signal(false);
  availableModules = signal<PlatformModule[]>([]);
  selectedModules  = signal<Set<number>>(new Set());

  benefits = [
    'Facturación electrónica SRI integrada',
    'Control de inventario en tiempo real',
    'Reportes y dashboards automáticos',
    'Multi-usuario con roles y permisos',
    'Soporte técnico incluido',
  ];

  moduleIcons: Record<string, string> = {
    inventory:   'inventory_2',
    sales:       'point_of_sale',
    invoicing:   'receipt_long',
    purchases:   'local_shipping',
    accounting:  'account_balance',
    expenses:    'payments',
    reports:     'bar_chart',
    crm:         'people',
    cash:        'account_balance_wallet',
  };

  getModuleIcon(code: string): string {
    return this.moduleIcons[code] ?? 'extension';
  }

  toggleShowPassword(): void { this.showPassword.update(v => !v); }
  toggleShowConfirm(): void  { this.showConfirm.update(v => !v); }

  orgForm = this.fb.group({
    org_name:  ['', [Validators.required, Validators.minLength(2)]],
    org_ruc:   ['', [Validators.required, Validators.pattern(/^\d{13}$/)]],
    org_email: ['', [Validators.email]],
    org_phone: [''],
    org_city:  [''],
  });

  userForm = this.fb.group({
    full_name:        ['', [Validators.required, Validators.minLength(2)]],
    email:            ['', [Validators.required, Validators.email]],
    password:         ['', [Validators.required, Validators.minLength(8)]],
    confirm_password: ['', Validators.required],
  }, { validators: passwordMatchValidator });

  ngOnInit(): void {
    this.moduleService.getPublicModules().subscribe({
      next: mods => this.availableModules.set(mods),
      error: () => {},
    });
  }

  goStep(n: number): void {
    if (n === 2 && this.orgForm.invalid) {
      this.orgForm.markAllAsTouched();
      return;
    }
    if (n === 3 && this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }
    this.error.set('');
    this.step.set(n);
  }

  toggleModule(id: number): void {
    const s = new Set(this.selectedModules());
    s.has(id) ? s.delete(id) : s.add(id);
    this.selectedModules.set(s);
  }

  isModuleSelected(id: number): boolean {
    return this.selectedModules().has(id);
  }

  onSubmit(): void {
    if (this.orgForm.invalid || this.userForm.invalid) return;

    this.loading.set(true);
    this.error.set('');

    const orgV  = this.orgForm.value;
    const userV = this.userForm.value;

    this.authService.register({
      org_name:  orgV.org_name!,
      org_ruc:   orgV.org_ruc!,
      org_email: orgV.org_email || undefined,
      org_phone: orgV.org_phone || undefined,
      org_city:  orgV.org_city  || undefined,
      full_name: userV.full_name!,
      email:     userV.email!,
      password:  userV.password!,
    }).subscribe({
      next: () => {
        const selected = [...this.selectedModules()];
        if (selected.length === 0) {
          this.router.navigate(['/dashboard']);
          return;
        }
        // Request selected modules sequentially then redirect
        const requests = selected.map(id => this.moduleService.requestModule(id));
        let done = 0;
        requests.forEach(req => {
          req.subscribe({
            next:  () => { done++; if (done === selected.length) this.router.navigate(['/dashboard']); },
            error: () => { done++; if (done === selected.length) this.router.navigate(['/dashboard']); },
          });
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Error al registrar. Intenta de nuevo.');
        this.step.set(1);
      },
    });
  }

  // ── Helpers ──────────────────────────────────────────────────
  getOrgError(field: string): string {
    const c = this.orgForm.get(field);
    if (!c?.touched) return '';
    if (c.hasError('required'))   return 'Este campo es requerido';
    if (c.hasError('minlength'))  return 'Mínimo 2 caracteres';
    if (c.hasError('pattern'))    return 'El RUC debe tener exactamente 13 dígitos numéricos';
    if (c.hasError('email'))      return 'Email inválido';
    return '';
  }

  getUserError(field: string): string {
    const c = this.userForm.get(field);
    if (!c?.touched) return '';
    if (c.hasError('required'))          return 'Este campo es requerido';
    if (c.hasError('minlength'))         return field === 'password' ? 'Mínimo 8 caracteres' : 'Mínimo 2 caracteres';
    if (c.hasError('email'))             return 'Email inválido';
    if (c.hasError('passwordMismatch'))  return 'Las contraseñas no coinciden';
    return '';
  }

  get passwordMismatch(): boolean {
    return !!this.userForm.errors?.['passwordMismatch'] && !!this.userForm.get('confirm_password')?.touched;
  }
}
