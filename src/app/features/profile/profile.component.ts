import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';
import { RolesService, StoreRole } from '../../core/services/roles.service';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';

const ROLE_LABELS: Record<string, string> = {
  STORE_ADMIN:      'Administrador',
  STORE_SELLER:     'Vendedor',
  STORE_WAREHOUSE:  'Almacén',
  PLATFORM_ADMIN:   'Administrador de plataforma',
  PLATFORM_SUPPORT: 'Soporte de plataforma',
};

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppIconComponent],
  templateUrl: './profile.component.html',
})
export class ProfileComponent implements OnInit {
  private fb           = inject(FormBuilder);
  private rolesService = inject(RolesService);
  private snackBar     = inject(MatSnackBar);
  authService          = inject(AuthService);

  savingProfile  = signal(false);
  savingPassword = signal(false);
  showCurrent    = signal(false);
  showNew        = signal(false);
  roles          = signal<StoreRole[]>([]);
  passwordError  = signal<string | null>(null);

  /** Solo STORE_ADMIN puede cambiar su propio rol; el staff lo ve bloqueado */
  get canEditRole(): boolean { return this.authService.isStoreAdmin(); }

  profileForm = this.fb.group({
    full_name: ['', [Validators.required, Validators.minLength(3)]],
    email:     ['', [Validators.required, Validators.email]],
    role_id:   [null as number | null],
  });

  passwordForm = this.fb.group({
    current_password: ['', [Validators.required]],
    new_password:     ['', [Validators.required, Validators.minLength(8)]],
    confirm_password: ['', [Validators.required]],
  });

  get userInitials(): string {
    const name = this.authService.currentUser()?.full_name || '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  get roleLabel(): string {
    const role = this.authService.currentUser()?.role?.name || '';
    return ROLE_LABELS[role] ?? role;
  }

  roleLabelFor(name: string): string {
    return ROLE_LABELS[name] ?? name;
  }

  ngOnInit(): void {
    const user = this.authService.currentUser();
    this.profileForm.patchValue({
      full_name: user?.full_name ?? '',
      email:     user?.email ?? '',
      role_id:   user?.role?.id ?? null,
    });

    if (this.canEditRole) {
      this.rolesService.listStoreRoles().subscribe({ next: roles => this.roles.set(roles) });
    }
  }

  saveProfile(): void {
    if (this.profileForm.invalid) { this.profileForm.markAllAsTouched(); return; }
    const { full_name, email, role_id } = this.profileForm.value;

    this.savingProfile.set(true);
    this.authService.updateProfile({
      full_name: full_name!,
      email:     email!,
      ...(this.canEditRole && role_id ? { role_id: Number(role_id) } : {}),
    })
      .pipe(finalize(() => this.savingProfile.set(false)))
      .subscribe({
        next: () => this.snackBar.open('Perfil actualizado', 'OK', { duration: 3000 }),
        error: () => {},
      });
  }

  savePassword(): void {
    this.passwordError.set(null);
    if (this.passwordForm.invalid) { this.passwordForm.markAllAsTouched(); return; }

    const { current_password, new_password, confirm_password } = this.passwordForm.value;
    if (new_password !== confirm_password) {
      this.passwordError.set('Las contraseñas no coinciden.');
      return;
    }

    this.savingPassword.set(true);
    this.authService.changePassword(current_password!, new_password!)
      .pipe(finalize(() => this.savingPassword.set(false)))
      .subscribe({
        next: () => {
          this.passwordForm.reset();
          this.snackBar.open('Contraseña actualizada', 'OK', { duration: 3000 });
        },
        error: (err) => {
          this.passwordError.set(err?.error?.message || 'No se pudo cambiar la contraseña.');
        },
      });
  }
}
