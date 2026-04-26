import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AppIconComponent],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  private fb   = inject(FormBuilder);
  private auth = inject(AuthService);

  loading = signal(false);
  success = signal(false);
  error   = signal('');

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');
    this.auth.forgotPassword(this.form.value.email!).subscribe({
      next:  () => { this.loading.set(false); this.success.set(true); },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'No se pudo enviar el correo. Intenta de nuevo.');
      },
    });
  }
}
