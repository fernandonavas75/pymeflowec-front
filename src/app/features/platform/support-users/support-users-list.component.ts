import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormControl, Validators } from '@angular/forms';
import { startWith, finalize } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';
import { ApiListResponse } from '../../../core/models/pagination.model';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

interface PlatformRole { id: number; name: string; }

@Component({
  selector: 'app-support-users-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppIconComponent],
  templateUrl: './support-users-list.component.html',
})
export class SupportUsersListComponent implements OnInit {
  private api      = inject(ApiService);
  private dialog   = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private fb       = inject(FormBuilder);
  authService      = inject(AuthService);

  private allUsers = signal<User[]>([]);
  loading      = signal(true);
  saving       = signal(false);
  modalOpen    = signal(false);
  showPassword = signal(false);
  tab          = signal<'all' | 'ACTIVE' | 'INACTIVE' | 'LOCKED'>('all');
  roles        = signal<PlatformRole[]>([]);
  selectedUser = signal<User | null>(null);
  newRoleId    = signal<number | null>(null);

  searchCtrl = new FormControl('');
  private searchQuery = toSignal(
    this.searchCtrl.valueChanges.pipe(startWith('')),
    { initialValue: '' }
  );

  form = this.fb.group({
    full_name: ['', [Validators.required, Validators.minLength(3)]],
    email:     ['', [Validators.required, Validators.email]],
    password:  ['', [Validators.required, Validators.minLength(8)]],
    role_id:   [null as number | null, Validators.required],
  });

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
    if (this.authService.isPlatformAdmin()) {
      this.loadRoles();
    }
  }

  load(): void {
    this.loading.set(true);
    this.api.get<ApiListResponse<User>>('/platform/users', { limit: 500 })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: res => this.allUsers.set(res.data ?? []),
        error: ()  => this.allUsers.set([]),
      });
  }

  private loadRoles(): void {
    this.api.get<{ success: boolean; data: PlatformRole[] }>('/platform/roles').subscribe({
      next: res => this.roles.set(res.data ?? []),
    });
  }

  openNew(): void {
    this.form.reset({ full_name: '', email: '', password: '', role_id: null });
    this.showPassword.set(false);
    this.modalOpen.set(true);
  }

  submitCreate(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.api.post<{ success: boolean; data: User }>('/platform/users', this.form.value)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Usuario creado correctamente', 'OK', { duration: 3000 });
          this.modalOpen.set(false);
          this.load();
        },
        error: err => this.snackBar.open(err?.error?.message || 'Error al crear', 'OK', { duration: 4000 }),
      });
  }

  confirmToggle(user: User): void {
    const isActive = user.status === 'ACTIVE';
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title:       isActive ? 'Desactivar usuario' : 'Activar usuario',
        message:     `¿${isActive ? 'Desactivar' : 'Activar'} al usuario "${user.full_name}"?`,
        confirmText: isActive ? 'Desactivar' : 'Activar',
        danger:      isActive,
      },
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      const path = isActive
        ? `/platform/users/${user.id}/deactivate`
        : `/platform/users/${user.id}/activate`;
      this.api.patch<{ success: boolean; data: User }>(path).subscribe({
        next: () => {
          this.snackBar.open(isActive ? 'Usuario desactivado' : 'Usuario activado', 'OK', { duration: 3000 });
          this.load();
        },
        error: err => this.snackBar.open(err?.error?.message || 'Error', 'OK', { duration: 4000 }),
      });
    });
  }

  confirmLock(user: User): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title:       'Bloquear usuario',
        message:     `¿Bloquear la cuenta de "${user.full_name}"? No podrá iniciar sesión hasta que sea desbloqueado.`,
        confirmText: 'Bloquear',
        danger:      true,
      },
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      this.api.patch<{ success: boolean; data: User }>(`/platform/users/${user.id}/lock`).subscribe({
        next: () => { this.snackBar.open('Cuenta bloqueada', 'OK', { duration: 3000 }); this.load(); },
        error: err => this.snackBar.open(err?.error?.message || 'Error', 'OK', { duration: 4000 }),
      });
    });
  }

  getInitials(fullName: string): string {
    return fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  statusLabel(s: string): string {
    return s === 'ACTIVE' ? 'Activo' : s === 'INACTIVE' ? 'Inactivo' : 'Bloqueado';
  }

  roleLabel(name: string): string {
    const map: Record<string, string> = {
      PLATFORM_ADMIN: 'Admin plataforma',
      PLATFORM_STAFF: 'Staff soporte',
    };
    return map[name] ?? name;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  togglePassword(): void { this.showPassword.update(v => !v); }

  selectUser(u: User): void  { this.selectedUser.set(u); this.newRoleId.set(u.role?.id ?? null); }
  closeDrawer(): void        { this.selectedUser.set(null); this.newRoleId.set(null); }

  confirmChangeRole(user: User): void {
    const roleId = this.newRoleId();
    if (!roleId || roleId === user.role?.id) return;
    const label = this.roleLabel(this.roles().find(r => r.id === roleId)?.name ?? '');
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title:       'Cambiar rol',
        message:     `¿Cambiar el rol de "${user.full_name}" a "${label}"?`,
        confirmText: 'Confirmar',
        danger:      false,
      },
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      this.saving.set(true);
      this.api.put<{ success: boolean; data: User }>(`/platform/users/${user.id}`, { role_id: roleId })
        .pipe(finalize(() => this.saving.set(false)))
        .subscribe({
          next: () => {
            this.snackBar.open('Rol actualizado correctamente', 'OK', { duration: 3000 });
            this.closeDrawer();
            this.load();
          },
          error: err => this.snackBar.open(err?.error?.message || 'Error al cambiar rol', 'OK', { duration: 4000 }),
        });
    });
  }
}
