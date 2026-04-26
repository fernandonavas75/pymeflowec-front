import { Component, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const pw  = group.get('new_password')?.value;
  const cpw = group.get('confirm_password')?.value;
  return pw && cpw && pw !== cpw ? { mismatch: true } : null;
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AppIconComponent],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent implements OnInit {
  private fb    = inject(FormBuilder);
  private auth  = inject(AuthService);
  private route = inject(ActivatedRoute);

  token         = signal('');
  loading       = signal(false);
  success       = signal(false);
  error         = signal('');
  showPassword  = signal(false);

  form = this.fb.group({
    new_password:     ['', [Validators.required, Validators.minLength(8)]],
    confirm_password: ['', Validators.required],
  }, { validators: passwordsMatch });

  ngOnInit(): void {
    const t = this.route.snapshot.queryParamMap.get('token') ?? '';
    this.token.set(t);
    if (!t) this.error.set('El enlace es inválido o ha expirado. Solicita uno nuevo.');
  }

  get pwError(): string {
    const ctrl = this.form.get('new_password');
    if (!ctrl?.touched || ctrl.valid) return '';
    if (ctrl.hasError('required'))   return 'La contraseña es obligatoria.';
    if (ctrl.hasError('minlength'))  return 'Mínimo 8 caracteres.';
    return '';
  }

  onSubmit(): void {
    if (this.form.invalid || !this.token()) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');
    this.auth.resetPassword(this.token(), this.form.value.new_password!).subscribe({
      next:  () => { this.loading.set(false); this.success.set(true); },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'El enlace expiró o es inválido. Solicita uno nuevo.');
      },
    });
  }
}
