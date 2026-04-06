import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { OrganizationsService } from '../../../core/services/organizations.service';
import { Organization } from '../../../core/models/organization.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-organizations-list',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatButtonModule, MatIconModule,
    MatPaginatorModule, MatTooltipModule, MatProgressSpinnerModule, MatDialogModule,
  ],
  templateUrl: './organizations-list.component.html',
})
export class OrganizationsListComponent implements OnInit {
  private svc = inject(OrganizationsService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  orgs = signal<Organization[]>([]);
  loading = signal(true);
  total = signal(0);
  page = signal(1);
  limit = signal(20);
  displayedColumns = ['name', 'ruc', 'email', 'status', 'created', 'actions'];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.list({ page: this.page(), limit: this.limit() }).subscribe({
      next: res => { this.orgs.set(res.data); this.total.set(res.total); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onPageChange(e: PageEvent): void { this.page.set(e.pageIndex + 1); this.limit.set(e.pageSize); this.load(); }

  toggleStatus(org: Organization): void {
    const isActive = org.status === 'active';
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: isActive ? 'Desactivar organización' : 'Activar organización',
        message: `¿${isActive ? 'Desactivar' : 'Activar'} la organización "${org.name}"?`,
        confirmText: isActive ? 'Desactivar' : 'Activar',
        danger: isActive,
      },
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      const obs = isActive ? this.svc.deactivate(org.id) : this.svc.activate(org.id);
      obs.subscribe({
        next: () => { this.snackBar.open(`Organización ${isActive ? 'desactivada' : 'activada'}`, 'OK', { duration: 3000 }); this.load(); },
        error: (err) => this.snackBar.open(err?.error?.message || 'Error', 'OK', { duration: 4000 }),
      });
    });
  }

  statusClass(s: string): string {
    return s === 'active' ? 'bg-green-50 text-green-700' : s === 'suspended' ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-600';
  }

  statusLabel(s: string): string {
    return s === 'active' ? 'Activa' : s === 'suspended' ? 'Suspendida' : 'Inactiva';
  }
}
