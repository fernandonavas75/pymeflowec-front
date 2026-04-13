import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UsersService } from '../../../core/services/users.service';
import { RolesService, StoreRole } from '../../../core/services/roles.service';
import { AuthService } from '../../../core/services/auth.service';
import { CompaniesService } from '../../../core/services/companies.service';
import { Company } from '../../../core/models/company.model';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './user-form.component.html',
})
export class UserFormComponent implements OnInit {
  private fb             = inject(FormBuilder);
  private route          = inject(ActivatedRoute);
  private router         = inject(Router);
  private usersService   = inject(UsersService);
  private rolesService   = inject(RolesService);
  private snackBar       = inject(MatSnackBar);
  authService            = inject(AuthService);
  private companiesSvc   = inject(CompaniesService);

  loading       = signal(false);
  saving        = signal(false);
  userId        = signal<string | null>(null);
  showPassword  = signal(false);
  roles         = signal<StoreRole[]>([]);
  companies     = signal<Company[]>([]);

  form = this.fb.group({
    full_name:  ['', [Validators.required, Validators.minLength(3)]],
    email:      ['', [Validators.required, Validators.email]],
    password:   ['', [Validators.minLength(6)]],
    role_id:    [null as number | null, [Validators.required]],
    company_id: [null as number | null],   // solo se usa cuando el creador es plataforma
  });

  get isEdit(): boolean { return !!this.userId(); }

  /** true cuando el admin de plataforma crea usuarios para otra empresa */
  get isPlatformCreating(): boolean {
    return this.authService.isSystemUser() && !this.isEdit;
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  ngOnInit(): void {
    // Cargar roles de tienda
    this.rolesService.listStoreRoles().subscribe({
      next: roles => this.roles.set(roles),
    });

    // Si es admin de plataforma en modo creación: cargar lista de empresas y obligar company_id
    if (this.isPlatformCreating) {
      this.form.get('company_id')!.addValidators(Validators.required);
      this.form.get('company_id')!.updateValueAndValidity();
      this.companiesSvc.list({ limit: 200 }).subscribe({
        next: res => this.companies.set(res.data.filter(c => c.status === 'ACTIVE')),
      });
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.userId.set(id);
      this.loading.set(true);
      this.usersService.getById(id).subscribe({
        next: user => {
          this.form.patchValue({
            full_name: user.full_name,
            email:     user.email,
            role_id:   user.role_id,
          });
          this.form.get('password')?.clearValidators();
          this.form.get('password')?.updateValueAndValidity();
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.router.navigate(['/users']);
        },
      });
    } else {
      this.form.get('password')?.addValidators(Validators.required);
      this.form.get('password')?.updateValueAndValidity();
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const { full_name, email, password, role_id, company_id } = this.form.value;

    if (this.isEdit) {
      this.usersService.update(this.userId()!, {
        full_name: full_name!,
        email:     email!,
        role_id:   role_id!,
      }).pipe(
        finalize(() => this.saving.set(false))
      ).subscribe({
        next: () => {
          this.router.navigate(['/users']).then(() => {
            this.snackBar.open('Usuario actualizado', 'OK', { duration: 3000, panelClass: ['success-snackbar'] });
          });
        },
        error: () => {},
      });
    } else {
      this.usersService.create({
        full_name:  full_name!,
        email:      email!,
        password:   password!,
        role_id:    role_id!,
        company_id: company_id ?? undefined,  // solo si el admin de plataforma lo especificó
      }).pipe(
        finalize(() => this.saving.set(false))
      ).subscribe({
        next: () => {
          // Navegar primero y mostrar snackBar después evita que el overlay de
          // Material quede colgado al destruirse el componente.
          this.router.navigate(['/users']).then(() => {
            this.snackBar.open('Usuario creado', 'OK', { duration: 3000, panelClass: ['success-snackbar'] });
          });
        },
        error: () => {},
      });
    }
  }
}
