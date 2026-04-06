import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { PlatformStaffService, PlatformStaffMember, PlatformRole } from '../../../core/services/platform-staff.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-platform-staff-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatTableModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule, MatInputModule, MatSelectModule,
    MatTooltipModule, MatDialogModule,
  ],
  templateUrl: './platform-staff-list.component.html',
})
export class PlatformStaffListComponent implements OnInit {
  private svc = inject(PlatformStaffService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);

  staff = signal<PlatformStaffMember[]>([]);
  roles = signal<PlatformRole[]>([]);
  loading = signal(true);
  saving = signal(false);
  showAssignForm = signal(false);
  displayedColumns = ['user', 'role', 'status', 'created', 'actions'];

  assignForm = this.fb.group({
    user_id: [null as number | null, Validators.required],
    platform_role_id: [null as number | null, Validators.required],
    notes: [''],
  });

  ngOnInit(): void {
    this.svc.listRoles().subscribe(r => this.roles.set(r));
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.svc.list().subscribe({
      next: s => { this.staff.set(s); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  assign(): void {
    if (this.assignForm.invalid) { this.assignForm.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.assignForm.value;
    this.svc.assign({ user_id: v.user_id!, platform_role_id: v.platform_role_id!, notes: v.notes || undefined }).subscribe({
      next: () => { this.snackBar.open('Staff asignado', 'OK', { duration: 3000 }); this.showAssignForm.set(false); this.assignForm.reset(); this.load(); this.saving.set(false); },
      error: (err) => { this.snackBar.open(err?.error?.message || 'Error', 'OK', { duration: 4000 }); this.saving.set(false); },
    });
  }

  revoke(member: PlatformStaffMember): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Revocar acceso', message: `¿Revocar el acceso de plataforma de "${member.user?.full_name}"?`, confirmText: 'Revocar', danger: true },
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      this.svc.revoke(member.id).subscribe({
        next: () => { this.snackBar.open('Acceso revocado', 'OK', { duration: 3000 }); this.load(); },
        error: (err) => this.snackBar.open(err?.error?.message || 'Error', 'OK', { duration: 4000 }),
      });
    });
  }
}
