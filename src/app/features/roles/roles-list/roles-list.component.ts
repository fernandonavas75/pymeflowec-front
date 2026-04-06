import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { RolesService } from '../../../core/services/roles.service';
import { Role } from '../../../core/models/role.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-roles-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatTableModule, MatButtonModule,
    MatIconModule, MatTooltipModule, MatDialogModule, MatChipsModule,
  ],
  templateUrl: './roles-list.component.html',
})
export class RolesListComponent implements OnInit {
  private svc = inject(RolesService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  roles = signal<Role[]>([]);
  loading = signal(true);
  displayedColumns = ['name', 'description', 'permissions', 'users', 'actions'];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.listAll().subscribe({
      next: roles => { this.roles.set(roles); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  delete(role: Role): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar rol',
        message: `¿Eliminar el rol "${role.name}"? Los usuarios asignados perderán este rol.`,
        confirmText: 'Eliminar',
        danger: true,
      },
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      this.svc.remove(role.id).subscribe({
        next: () => { this.snackBar.open('Rol eliminado', 'OK', { duration: 3000 }); this.load(); },
        error: () => this.snackBar.open('No se pudo eliminar el rol', 'OK', { duration: 3000 }),
      });
    });
  }
}
