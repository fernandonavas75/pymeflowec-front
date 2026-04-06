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
import { CategoriesService } from '../../../core/services/categories.service';
import { Category } from '../../../core/models/category.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-categories-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatTableModule, MatButtonModule,
    MatIconModule, MatTooltipModule, MatDialogModule, MatChipsModule,
  ],
  templateUrl: './categories-list.component.html',
})
export class CategoriesListComponent implements OnInit {
  private svc = inject(CategoriesService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  categories = signal<Category[]>([]);
  loading = signal(true);
  displayedColumns = ['name', 'parent', 'status', 'actions'];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.list({ limit: 100 }).subscribe({
      next: res => { this.categories.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  delete(cat: Category): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Eliminar categoría', message: `¿Eliminar "${cat.name}"?`, confirmText: 'Eliminar', danger: true },
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      this.svc.remove(cat.id).subscribe({ next: () => { this.snackBar.open('Categoría eliminada', 'OK', { duration: 3000 }); this.load(); } });
    });
  }
}
