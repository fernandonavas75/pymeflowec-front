import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ClientsService } from '../../../core/services/clients.service';
import { Client } from '../../../core/models/client.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-clients-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatDialogModule,
    StatusBadgeComponent,
  ],
  templateUrl: './clients-list.component.html',
})
export class ClientsListComponent implements OnInit {
  private clientsService = inject(ClientsService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  clients = signal<Client[]>([]);
  loading = signal(true);
  total = signal(0);
  page = signal(1);
  limit = signal(20);

  searchCtrl = new FormControl('');
  statusCtrl = new FormControl('');

  displayedColumns = ['full_name', 'identification', 'email', 'phone', 'status', 'actions'];

  ngOnInit(): void {
    this.loadClients();
    this.searchCtrl.valueChanges.pipe(debounceTime(400), distinctUntilChanged()).subscribe(() => {
      this.page.set(1);
      this.loadClients();
    });
    this.statusCtrl.valueChanges.subscribe(() => {
      this.page.set(1);
      this.loadClients();
    });
  }

  loadClients(): void {
    this.loading.set(true);
    const params: Record<string, string | number | boolean | undefined> = {
      page: this.page(),
      limit: this.limit(),
    };
    if (this.searchCtrl.value) params['search'] = this.searchCtrl.value;
    if (this.statusCtrl.value) params['status'] = this.statusCtrl.value;

    this.clientsService.list(params).subscribe({
      next: res => {
        this.clients.set(res.data);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex + 1);
    this.limit.set(event.pageSize);
    this.loadClients();
  }

  toggleStatus(client: Client): void {
    const action = client.status === 'active'
      ? this.clientsService.deactivate(client.id)
      : this.clientsService.activate(client.id);

    action.subscribe({
      next: () => {
        this.snackBar.open(
          client.status === 'active' ? 'Cliente desactivado' : 'Cliente activado',
          'OK',
          { duration: 3000, panelClass: ['success-snackbar'] }
        );
        this.loadClients();
      },
    });
  }

  deleteClient(client: Client): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar cliente',
        message: `¿Estás seguro de eliminar a "${client.full_name}"?`,
        confirmText: 'Eliminar',
        danger: true,
      },
    });

    ref.afterClosed().subscribe(result => {
      if (result) {
        this.clientsService.remove(client.id).subscribe({
          next: () => {
            this.snackBar.open('Cliente eliminado', 'OK', { duration: 3000, panelClass: ['success-snackbar'] });
            this.loadClients();
          },
        });
      }
    });
  }
}
