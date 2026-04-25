import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UsersService } from '../../../core/services/users.service';
import { RolesService, StoreRole } from '../../../core/services/roles.service';
import { AuthService } from '../../../core/services/auth.service';
import { CompaniesService } from '../../../core/services/companies.service';
import { Company } from '../../../core/models/company.model';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AppIconComponent],
  templateUrl: './user-form.component.html',
})
export class UserFormComponent implements OnInit {
  private fb           = inject(FormBuilder);
  private route        = inject(ActivatedRoute);
  private router       = inject(Router);
  private usersService = inject(UsersService);
  private rolesService = inject(RolesService);
  private snackBar     = inject(MatSnackBar);
  authService          = inject(AuthService);
  private companiesSvc = inject(CompaniesService);

  loading      = signal(false);
  saving       = signal(false);
  userId       = signal<string | null>(null);
  showPassword = signal(false);
  roles        = signal<StoreRole[]>([]);
  companies    = signal<Company[]>([]);

  form = this.fb.group({
    full_name:  ['', [Validators.required, Validators.minLength(3)]],
    email:      ['', [Validators.required, Validators.email]],
    password:   ['', [Validators.minLength(6)]],
    role_id:    [null as number | null, [Validators.required]],
    company_id: [null as number | null],
  });

  get isEdit(): boolean { return !!this.userId(); }

  get isPlatformCreating(): boolean {
    return this.authService.isSystemUser() && !this.isEdit;
  }

  ngOnInit(): void {
    this.rolesService.listStoreRoles().subscribe({ next: roles => this.roles.set(roles) });

    if (this.isPlatformCreating) {
      this.form.get('company_id')!.addValidators(Validators.required);
      this.form.get('company_id')!.updateValueAndValidity();
      this.companiesSvc.list({ limit: 200 }).subscribe({
        next: res => this.companies.set(res.data.filter((c: any) => c.status === 'ACTIVE')),
      });
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.userId.set(id);
      this.loading.set(true);
      this.usersService.getById(id).subscribe({
        next: user => {
          this.form.patchValue({ full_name: user.full_name, email: user.email, role_id: user.role_id });
          this.form.get('password')?.clearValidators();
          this.form.get('password')?.updateValueAndValidity();
          this.loading.set(false);
        },
        error: () => { this.loading.set(false); this.router.navigate(['/users']); },
      });
    } else {
      this.form.get('password')?.addValidators(Validators.required);
      this.form.get('password')?.updateValueAndValidity();
    }
  }

  togglePassword(): void { this.showPassword.update(v => !v); }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const { full_name, email, password, role_id, company_id } = this.form.value;

    if (this.isEdit) {
      this.usersService.update(this.userId()!, { full_name: full_name!, email: email!, role_id: role_id! })
        .pipe(finalize(() => this.saving.set(false)))
        .subscribe({
          next: () => this.router.navigate(['/users']).then(() =>
            this.snackBar.open('Usuario actualizado', 'OK', { duration: 3000 })
          ),
          error: () => {},
        });
    } else {
      this.usersService.create({ full_name: full_name!, email: email!, password: password!, role_id: role_id!, company_id: company_id ?? undefined })
        .pipe(finalize(() => this.saving.set(false)))
        .subscribe({
          next: () => this.router.navigate(['/users']).then(() =>
            this.snackBar.open('Usuario creado', 'OK', { duration: 3000 })
          ),
          error: () => {},
        });
    }
  }
}
