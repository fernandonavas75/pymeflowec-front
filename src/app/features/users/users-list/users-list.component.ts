import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormControl, Validators } from '@angular/forms';
import { startWith, finalize } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UsersService } from '../../../core/services/users.service';
import { RolesService, StoreRole } from '../../../core/services/roles.service';
import { AuthService } from '../../../core/services/auth.service';
import { CompaniesService } from '../../../core/services/companies.service';
import { User } from '../../../core/models/user.model';
import { Company } from '../../../core/models/company.model';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppIconComponent],
  templateUrl: './users-list.component.html',
})
export class UsersListComponent implements OnInit {
  private usersService = inject(UsersService);
  private rolesService = inject(RolesService);
  private companiesSvc = inject(CompaniesService);
  private dialog       = inject(MatDialog);
  private snackBar     = inject(MatSnackBar);
  private fb           = inject(FormBuilder);
  authService          = inject(AuthService);

  private allUsers = signal<User[]>([]);
  loading   = signal(true);
  tab       = signal<'all' | 'ACTIVE' | 'INACTIVE' | 'LOCKED'>('all');
  modalOpen = signal(false);
  editing   = signal<User | null>(null);
  saving    = signal(false);
  showPassword = signal(false);
  roles     = signal<StoreRole[]>([]);
  companies = signal<Company[]>([]);

  searchCtrl = new FormControl('');
  private searchQuery = toSignal(
    this.searchCtrl.valueChanges.pipe(startWith('')),
    { initialValue: '' }
  );

  form = this.fb.group({
    full_name:  ['', [Validators.required, Validators.minLength(3)]],
    email:      ['', [Validators.required, Validators.email]],
    password:   [''],
    role_id:    [null as number | null, [Validators.required]],
    company_id: [null as number | null],
  });

  get isNew(): boolean { return !this.editing(); }
  get isPlatformCreating(): boolean { return this.authService.isSystemUser() && this.isNew; }

  totalCount    = computed(() => this.allUsers().length);
  activeCount   = computed(() => this.allUsers().filter(u => u.status === 'ACTIVE').length);
  inactiveCount = computed(() => this.allUsers().filter(u => u.status === 'INACTIVE').length);
  lockedCount   = computed(() => this.allUsers().filter(u => u.status === 'LOCKED').length);

  filteredUsers = computed(() => {
    let list = this.allUsers();
    const t = this.tab();
    if (t !== 'all') list = list.filter(u => u.status === t);
    const q = (this.searchQuery() ?? '').toLowerCase();
    if (q) list = list.filter(u =>
      u.full_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
    return list;
  });

  ngOnInit(): void {
    this.load();
    this.rolesService.listStoreRoles().subscribe({ next: r => this.roles.set(r) });
  }

  load(): void {
    this.loading.set(true);
    this.usersService.list({ limit: 500 })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: res => this.allUsers.set(res.data ?? []),
        error: ()  => this.allUsers.set([]),
      });
  }

  openNew(): void {
    this.editing.set(null);
    this.form.reset({ full_name: '', email: '', password: '', role_id: null, company_id: null });
    this.form.get('password')!.setValidators([Validators.required, Validators.minLength(6)]);
    this.form.get('password')!.updateValueAndValidity();
    if (this.authService.isSystemUser()) {
      this.form.get('company_id')!.setValidators([Validators.required]);
      this.form.get('company_id')!.updateValueAndValidity();
      if (!this.companies().length) {
        this.companiesSvc.list({ limit: 200 }).subscribe({
          next: res => this.companies.set(res.data.filter((c: any) => c.status === 'ACTIVE')),
        });
      }
    }
    this.showPassword.set(false);
    this.modalOpen.set(true);
  }

  openEdit(u: User): void {
    this.editing.set(u);
    this.form.reset({ full_name: u.full_name, email: u.email, password: '', role_id: u.role_id, company_id: null });
    this.form.get('password')!.clearValidators();
    this.form.get('password')!.updateValueAndValidity();
    this.form.get('company_id')!.clearValidators();
    this.form.get('company_id')!.updateValueAndValidity();
    this.showPassword.set(false);
    this.modalOpen.set(true);
  }

  saveUser(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.value;
    const obs = this.isNew
      ? this.usersService.create({
          full_name:  v.full_name!,
          email:      v.email!,
          password:   v.password!,
          role_id:    v.role_id!,
          company_id: v.company_id ?? undefined,
        })
      : this.usersService.update(this.editing()!.id, {
          full_name: v.full_name!,
          email:     v.email!,
          role_id:   v.role_id!,
        });

    obs.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.snackBar.open(this.isNew ? 'Usuario creado' : 'Usuario actualizado', 'OK', { duration: 3000 });
        this.modalOpen.set(false);
        this.load();
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message || 'Error al guardar', 'OK', { duration: 4000 });
      },
    });
  }

  confirmToggle(u: User): void {
    const isActive = u.status === 'ACTIVE';
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title:       isActive ? 'Desactivar usuario' : 'Activar usuario',
        message:     `¿${isActive ? 'Desactivar' : 'Activar'} al usuario "${u.full_name}"?`,
        confirmText: isActive ? 'Desactivar' : 'Activar',
        danger:      isActive,
      },
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      const action = isActive ? this.usersService.deactivate(u.id) : this.usersService.activate(u.id);
      action.subscribe({
        next: () => {
          this.snackBar.open(isActive ? 'Usuario desactivado' : 'Usuario activado', 'OK', { duration: 3000 });
          this.load();
        },
        error: () => {},
      });
    });
  }

  deleteUser(u: User): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Eliminar usuario', message: `¿Eliminar a "${u.full_name}"?`, confirmText: 'Eliminar', danger: true },
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      this.usersService.remove(u.id).subscribe({
        next: () => {
          this.snackBar.open('Usuario eliminado', 'OK', { duration: 3000 });
          this.modalOpen.set(false);
          this.load();
        },
        error: () => {},
      });
    });
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  statusLabel(s: string): string {
    return s === 'ACTIVE' ? 'Activo' : s === 'INACTIVE' ? 'Inactivo' : 'Bloqueado';
  }

  roleLabel(name?: string): string {
    if (!name) return '—';
    if (name === 'STORE_ADMIN')      return 'Administrador';
    if (name === 'STORE_SELLER')     return 'Vendedor';
    if (name === 'STORE_WAREHOUSE')  return 'Almacén';
    return name;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  togglePassword(): void { this.showPassword.update(v => !v); }
}
