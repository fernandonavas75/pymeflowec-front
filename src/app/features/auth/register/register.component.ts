import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ModuleRequestRegisterService } from '../../../core/services/module-request-register.service';
import { PlatformModule } from '../../../core/models/module-request.model';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirm  = control.get('confirm_password');
  if (!password || !confirm) return null;
  return password.value !== confirm.value ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AppIconComponent],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {
  private fb            = inject(FormBuilder);
  private authService   = inject(AuthService);
  private moduleService = inject(ModuleRequestRegisterService);
  private router        = inject(Router);

  step             = signal(1);
  loading          = signal(false);
  error            = signal('');
  showPassword     = signal(false);
  showConfirm      = signal(false);
  availableModules = signal<PlatformModule[]>([]);
  selectedModules  = signal<Set<number>>(new Set());

  orgForm = this.fb.group({
    company_name:  ['', [Validators.required, Validators.minLength(2)]],
    company_ruc:   ['', [Validators.required, Validators.pattern(/^\d{13}$/)]],
    company_email: ['', [Validators.email]],
    company_phone: [''],
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
      error: (err) => console.error('[Register] Error cargando módulos públicos:', err),
    });
  }

  goStep(n: number): void {
    if (n === 2 && this.orgForm.invalid)  { this.orgForm.markAllAsTouched(); return; }
    if (n === 3 && this.userForm.invalid) { this.userForm.markAllAsTouched(); return; }
    this.error.set('');
    this.step.set(n);
  }

  toggleModule(id: number): void {
    const s = new Set(this.selectedModules());
    s.has(id) ? s.delete(id) : s.add(id);
    this.selectedModules.set(s);
  }

  isModuleSelected(id: number): boolean { return this.selectedModules().has(id); }

  get pwLen(): number { return this.userForm.get('password')?.value?.length ?? 0; }
  get pwStrength(): 'weak' | 'ok' | 'good' {
    return this.pwLen < 6 ? 'weak' : this.pwLen < 10 ? 'ok' : 'good';
  }

  get passwordMismatch(): boolean {
    return !!this.userForm.errors?.['passwordMismatch'] && !!this.userForm.get('confirm_password')?.touched;
  }

  onSubmit(): void {
    if (this.orgForm.invalid || this.userForm.invalid) return;
    this.loading.set(true);
    this.error.set('');
    const orgV  = this.orgForm.value;
    const userV = this.userForm.value;
    this.authService.register({
      company_name:  orgV.company_name!,
      company_ruc:   orgV.company_ruc!,
      company_email: orgV.company_email || undefined,
      company_phone: orgV.company_phone || undefined,
      full_name:  userV.full_name!,
      email:      userV.email!,
      password:   userV.password!,
      module_ids: this.selectedModules().size > 0 ? [...this.selectedModules()].map(Number) : undefined,
    }).subscribe({
      next:  () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.loading.set(false);
        const detail = err?.error?.errors?.map((e: { field: string; message: string }) => e.message).join(', ');
        this.error.set(detail || err?.error?.message || 'Error al registrar. Intenta de nuevo.');
        this.step.set(1);
      },
    });
  }

  getOrgError(field: string): string {
    const c = this.orgForm.get(field);
    if (!c?.touched) return '';
    if (c.hasError('required'))  return 'Este campo es requerido';
    if (c.hasError('minlength')) return 'Mínimo 2 caracteres';
    if (c.hasError('pattern'))   return 'El RUC debe tener exactamente 13 dígitos';
    if (c.hasError('email'))     return 'Email inválido';
    return '';
  }

  getUserError(field: string): string {
    const c = this.userForm.get(field);
    if (!c?.touched) return '';
    if (c.hasError('required'))  return 'Este campo es requerido';
    if (c.hasError('minlength')) return field === 'password' ? 'Mínimo 8 caracteres' : 'Mínimo 2 caracteres';
    if (c.hasError('email'))     return 'Email inválido';
    return '';
  }
}
