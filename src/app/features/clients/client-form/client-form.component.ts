import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ClientsService } from '../../../core/services/clients.service';

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './client-form.component.html',
})
export class ClientFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private clientsService = inject(ClientsService);
  private snackBar = inject(MatSnackBar);

  loading = signal(false);
  saving = signal(false);
  clientId = signal<string | null>(null);

  form = this.fb.group({
    full_name: ['', [Validators.required, Validators.minLength(3)]],
    identification: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(13)]],
    email: ['', [Validators.email]],
    phone: ['', [Validators.minLength(10), Validators.maxLength(10)]],
    address: [''],
  });

  get isEdit(): boolean {
    return !!this.clientId();
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.clientId.set(id);
      this.loading.set(true);
      this.clientsService.getById(id).subscribe({
        next: client => {
          this.form.patchValue(client);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.router.navigate(['/clients']);
        },
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const data = this.form.value as { full_name: string; identification: string; email?: string; phone?: string; address?: string };

    const obs = this.isEdit
      ? this.clientsService.update(this.clientId()!, data)
      : this.clientsService.create(data);

    obs.subscribe({
      next: () => {
        this.snackBar.open(
          this.isEdit ? 'Cliente actualizado' : 'Cliente creado',
          'OK',
          { duration: 3000, panelClass: ['success-snackbar'] }
        );
        this.router.navigate(['/clients']);
      },
      error: () => this.saving.set(false),
    });
  }
}
