import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UsersService } from '../../../core/services/users.service';
import { RolesService, StoreRole } from '../../../core/services/roles.service';

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
export class UserFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private usersService = inject(UsersService);
  private rolesService = inject(RolesService);
  private snackBar = inject(MatSnackBar);
  private document = inject(DOCUMENT);

  loading = signal(false);
  saving = signal(false);
  userId = signal<string | null>(null);
  showPassword = signal(false);
  roles = signal<StoreRole[]>([]);

  form = this.fb.group({
    full_name: ['', [Validators.required, Validators.minLength(3)]],
    email:     ['', [Validators.required, Validators.email]],
    password:  ['', [Validators.minLength(6)]],
    role_id:   [null as number | null, [Validators.required]],
  });

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  get isEdit(): boolean {
    return !!this.userId();
  }

  ngOnInit(): void {
    this.rolesService.listStoreRoles().subscribe({
      next: roles => this.roles.set(roles),
    });

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

  ngOnDestroy(): void {
    this.cleanupStaleOverlays();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const { full_name, email, password, role_id } = this.form.value;

    if (this.isEdit) {
      this.usersService.update(this.userId()!, {
        full_name: full_name!,
        email:     email!,
        role_id:   role_id!,
      }).subscribe({
        next: () => {
          this.cleanupStaleOverlays();
          this.snackBar.open('Usuario actualizado', 'OK', { duration: 3000, panelClass: ['success-snackbar'] });
          this.router.navigate(['/users']);
        },
        error: () => this.saving.set(false),
      });
    } else {
      this.usersService.create({
        full_name: full_name!,
        email:     email!,
        password:  password!,
        role_id:   role_id!,
      }).subscribe({
        next: () => {
          this.cleanupStaleOverlays();
          this.snackBar.open('Usuario creado', 'OK', { duration: 3000, panelClass: ['success-snackbar'] });
          this.router.navigate(['/users']);
        },
        error: () => this.saving.set(false),
      });
    }
  }

  private cleanupStaleOverlays(): void {
    this.document.querySelectorAll('.cdk-overlay-backdrop').forEach(backdrop => backdrop.remove());
    this.document.body.classList.remove('cdk-global-scrollblock');
  }
}
