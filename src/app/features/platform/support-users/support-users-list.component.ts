import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '../../../core/services/api.service';
import { User } from '../../../core/models/user.model';
import { PaginatedResponse, ApiListResponse } from '../../../core/models/pagination.model';
import { map } from 'rxjs';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-support-users-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    StatusBadgeComponent,
  ],
  templateUrl: './support-users-list.component.html',
})
export class SupportUsersListComponent implements OnInit {
  private api      = inject(ApiService);
  private dialog   = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  users            = signal<User[]>([]);
  loading          = signal(true);
  total            = signal(0);
  page             = signal(1);
  limit            = signal(20);
  displayedColumns = ['avatar', 'full_name', 'email', 'role', 'status', 'created', 'actions'];

  searchCtrl = new FormControl('');

  getInitials(fullName: string): string {
    return fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  ngOnInit(): void {
    this.loadUsers();
    this.searchCtrl.valueChanges.pipe(debounceTime(400), distinctUntilChanged()).subscribe(() => {
      this.page.set(1);
      this.loadUsers();
    });
  }

  loadUsers(): void {
    this.loading.set(true);
    const params: Record<string, string | number | boolean | undefined> = {
      page:  this.page(),
      limit: this.limit(),
    };
    if (this.searchCtrl.value) params['search'] = this.searchCtrl.value;

    this.api.get<ApiListResponse<User>>('/platform/users', params).pipe(
      map(res => ({
        data:       res.data ?? [],
        total:      res.pagination?.total ?? 0,
        page:       res.pagination?.current_page ?? 1,
        limit:      res.pagination?.per_page ?? 20,
        totalPages: res.pagination?.total_pages ?? 0,
      } as PaginatedResponse<User>)),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: res => { this.users.set(res.data); this.total.set(res.total); },
      error: ()  => this.users.set([]),
    });
  }

  onPageChange(e: PageEvent): void {
    this.page.set(e.pageIndex + 1);
    this.limit.set(e.pageSize);
    this.loadUsers();
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
          this.loadUsers();
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
        next: () => { this.snackBar.open('Cuenta bloqueada', 'OK', { duration: 3000 }); this.loadUsers(); },
        error: err => this.snackBar.open(err?.error?.message || 'Error', 'OK', { duration: 4000 }),
      });
    });
  }

  roleLabel(name: string): string {
    const map: Record<string, string> = {
      PLATFORM_ADMIN: 'Admin plataforma',
      PLATFORM_STAFF: 'Staff soporte',
    };
    return map[name] ?? name;
  }

  roleClass(name: string): string {
    return name === 'PLATFORM_ADMIN'
      ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
      : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300';
  }
}
