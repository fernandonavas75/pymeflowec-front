import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UsersService } from '../../../core/services/users.service';
import { User } from '../../../core/models/user.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatDialogModule,
    StatusBadgeComponent,
  ],
  templateUrl: './users-list.component.html',
})
export class UsersListComponent implements OnInit {
  private usersService = inject(UsersService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  users = signal<User[]>([]);
  loading = signal(true);
  total = signal(0);
  page = signal(1);
  limit = signal(20);

  searchCtrl = new FormControl('');

  displayedColumns = ['full_name', 'email', 'role', 'status', 'actions'];

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
      page: this.page(),
      limit: this.limit(),
    };
    if (this.searchCtrl.value) params['search'] = this.searchCtrl.value;

    this.usersService.list(params).subscribe({
      next: res => {
        this.users.set(res.data);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex + 1);
    this.limit.set(event.pageSize);
    this.loadUsers();
  }

  toggleStatus(user: User): void {
    const action = user.status === 'ACTIVE'
      ? this.usersService.deactivate(user.id)
      : this.usersService.activate(user.id);

    action.subscribe({
      next: () => {
        this.snackBar.open(
          user.status === 'ACTIVE' ? 'Usuario desactivado' : 'Usuario activado',
          'OK',
          { duration: 3000, panelClass: ['success-snackbar'] }
        );
        this.loadUsers();
      },
    });
  }

  confirmToggle(user: User): void {
    const isActive = user.status === 'ACTIVE';
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: isActive ? 'Desactivar usuario' : 'Activar usuario',
        message: `¿${isActive ? 'Desactivar' : 'Activar'} al usuario "${user.full_name}"?`,
        confirmText: isActive ? 'Desactivar' : 'Activar',
        danger: isActive,
      },
    });
    ref.afterClosed().subscribe(result => {
      if (result) this.toggleStatus(user);
    });
  }
}
