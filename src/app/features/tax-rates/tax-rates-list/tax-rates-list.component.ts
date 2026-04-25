import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormControl, Validators } from '@angular/forms';
import { startWith, finalize } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TaxRatesService } from '../../../core/services/tax-rates.service';
import { TaxRate } from '../../../core/models/tax-rate.model';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';

@Component({
  selector: 'app-tax-rates-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppIconComponent],
  templateUrl: './tax-rates-list.component.html',
})
export class TaxRatesListComponent implements OnInit {
  private taxRatesService = inject(TaxRatesService);
  private snackBar        = inject(MatSnackBar);
  private fb              = inject(FormBuilder);

  private allRates = signal<TaxRate[]>([]);
  loading   = signal(true);
  tab       = signal<'all' | 'active' | 'inactive'>('all');
  modalOpen = signal(false);
  editing   = signal<TaxRate | null>(null);
  saving    = signal(false);

  searchCtrl = new FormControl('');
  private searchQuery = toSignal(
    this.searchCtrl.valueChanges.pipe(startWith('')),
    { initialValue: '' }
  );

  form = this.fb.group({
    tax_name:   ['', [Validators.required]],
    percentage: [15, [Validators.required, Validators.min(0), Validators.max(100)]],
    is_active:  [true],
    valid_from: [new Date().toISOString().split('T')[0]],
    valid_to:   [''],
  });

  get isNew(): boolean { return !this.editing(); }

  totalCount    = computed(() => this.allRates().length);
  activeCount   = computed(() => this.allRates().filter(r => r.is_active).length);
  inactiveCount = computed(() => this.allRates().filter(r => !r.is_active).length);

  filteredRates = computed(() => {
    let list = this.allRates();
    const t = this.tab();
    if (t === 'active')   list = list.filter(r => r.is_active);
    if (t === 'inactive') list = list.filter(r => !r.is_active);
    const q = (this.searchQuery() ?? '').toLowerCase();
    if (q) list = list.filter(r => r.tax_name.toLowerCase().includes(q));
    return list;
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.taxRatesService.list({ limit: 500 })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: res => this.allRates.set(res.data ?? []),
        error: ()  => this.allRates.set([]),
      });
  }

  openNew(): void {
    this.editing.set(null);
    this.form.reset({
      tax_name:   '',
      percentage: 15,
      is_active:  true,
      valid_from: new Date().toISOString().split('T')[0],
      valid_to:   '',
    });
    this.modalOpen.set(true);
  }

  openEdit(r: TaxRate): void {
    this.editing.set(r);
    this.form.patchValue({
      tax_name:   r.tax_name,
      percentage: r.percentage,
      is_active:  r.is_active,
      valid_from: r.valid_from ? r.valid_from.split('T')[0] : '',
      valid_to:   r.valid_to   ? r.valid_to.split('T')[0]   : '',
    });
    this.modalOpen.set(true);
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.value;
    const data = {
      tax_name:   v.tax_name!,
      percentage: v.percentage!,
      is_active:  v.is_active ?? true,
      valid_from: v.valid_from || undefined,
      valid_to:   v.valid_to   || undefined,
    };
    const obs = this.isNew
      ? this.taxRatesService.create(data)
      : this.taxRatesService.update(this.editing()!.id, data);
    obs.subscribe({
      next: () => {
        this.snackBar.open(this.isNew ? 'Tasa creada' : 'Tasa actualizada', 'OK', { duration: 3000 });
        this.modalOpen.set(false);
        this.saving.set(false);
        this.load();
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message || 'Error al guardar', 'OK', { duration: 4000 });
        this.saving.set(false);
      },
    });
  }

  formatDate(d: string | null | undefined): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
