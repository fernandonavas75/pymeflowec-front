import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';
import { ProductsService, BulkCreateResult } from '../../../core/services/products.service';
import { SuppliersService } from '../../../core/services/suppliers.service';
import { TaxRatesService } from '../../../core/services/tax-rates.service';
import { Supplier } from '../../../core/models/supplier.model';
import { TaxRate } from '../../../core/models/tax-rate.model';

interface ParsedRow {
  rowNum: number;
  name: string;
  unit_price: string;
  cost_price: string;
  stock: string;
  min_stock: string;
  sku: string;
  description: string;
  supplier_name: string;
  errors: string[];
}

type DialogStep = 'idle' | 'preview' | 'resolving' | 'resolve' | 'importing' | 'done';

@Component({
  selector: 'app-csv-import-dialog',
  standalone: true,
  imports: [CommonModule, AppIconComponent],
  styles: [`
    :host { display: flex; flex-direction: column; overflow: hidden; max-height: 90vh; }
    .drop-zone {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      border: 2px dashed var(--border-ds); border-radius: var(--radius-ds);
      padding: 48px 24px; cursor: pointer; transition: border-color .2s, background .2s;
      text-align: center;
    }
    .drop-zone:hover, .drop-zone.drag-over {
      border-color: var(--accent); background: var(--accent-soft);
    }
    .sup-card {
      display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
      background: var(--surface-2); border: 1px solid var(--border-ds);
      border-radius: var(--radius-ds); padding: 12px 14px;
    }
    .summary-row {
      display: flex; justify-content: space-between; align-items: center;
      font-size: 13px; padding: 6px 0;
      border-bottom: 1px solid var(--border-ds);
    }
    .summary-row:last-child { border-bottom: none; }
  `],
  template: `
    <!-- Header -->
    <div class="ds-modal-head">
      <div>
        <div class="t">Importar productos</div>
        <div class="d">{{ headerSub() }}</div>
      </div>
      <button class="topbar-btn" type="button" (click)="ref.close()">
        <app-icon name="x" [size]="16"/>
      </button>
    </div>

    <!-- Body -->
    <div class="ds-modal-body" style="overflow-y:auto;flex:1">

      <!-- ── idle: drop zone ───────────────────────────────────────── -->
      @if (step() === 'idle') {
        <div class="drop-zone"
             [class.drag-over]="dragOver()"
             (click)="fileInput.click()"
             (dragover)="$event.preventDefault(); dragOver.set(true)"
             (dragleave)="dragOver.set(false)"
             (drop)="onDrop($event)">
          <app-icon name="upload" [size]="32" style="color:var(--accent);margin-bottom:12px"/>
          <p style="font-weight:600;font-size:14px;margin-bottom:4px">
            Arrastra tu archivo CSV aquí
          </p>
          <p style="font-size:12px;color:var(--text-subtle)">o haz clic para seleccionar</p>
        </div>
        <input #fileInput type="file" accept=".csv,text/csv" style="display:none"
               (change)="onFileChange($event)">

        <div class="ds-alert" style="margin-top:16px">
          <app-icon name="info" [size]="16" style="color:var(--accent);flex-shrink:0;margin-top:1px"/>
          <div>
            <div class="t">Formato esperado del CSV</div>
            <div class="d" style="font-family:var(--font-mono);font-size:11px;margin-top:4px;word-break:break-all">
              name, unit_price, cost_price, stock, min_stock, sku, description, supplier_name
            </div>
            <div class="d" style="margin-top:6px">
              La primera fila debe ser el encabezado. Máximo 300 filas. Los campos opcionales pueden dejarse en blanco.
              En <strong>supplier_name</strong> escribe el nombre del proveedor (se vincula automáticamente si existe).
              El <strong>IVA</strong> se asigna automáticamente con la tasa activa de tu empresa.
            </div>
          </div>
        </div>

        <button class="btn ghost sm" type="button" style="margin-top:12px" (click)="downloadTemplate()">
          <app-icon name="download" [size]="13"/>Descargar plantilla CSV
        </button>

      <!-- ── preview ───────────────────────────────────────────────── -->
      } @else if (step() === 'preview') {
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px">
          <div style="font-size:13px">
            <strong>{{ rows().length }}</strong> filas ·
            <span [style.color]="validRows().length > 0 ? 'var(--success)' : 'var(--text-subtle)'">
              <strong>{{ validRows().length }}</strong> válidas
            </span>
            @if (invalidRows().length > 0) {
              · <span style="color:var(--danger)"><strong>{{ invalidRows().length }}</strong> con error</span>
            }
          </div>
          <button class="btn ghost sm" type="button" (click)="step.set('idle')">
            <app-icon name="upload" [size]="12"/>Cambiar archivo
          </button>
        </div>

        <div style="overflow-x:auto;border:1px solid var(--border-ds);border-radius:var(--radius-ds)">
          <table class="ds-table" style="font-size:12px">
            <thead>
              <tr>
                <th style="width:36px">#</th>
                <th>Nombre</th>
                <th class="num">P. venta</th>
                <th class="num">P. costo</th>
                <th class="num">Stock</th>
                <th>SKU</th>
                <th>Proveedor</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (row of rows(); track row.rowNum) {
                <tr [style.background]="row.errors.length > 0 ? 'var(--danger-soft)' : ''"
                    [title]="row.errors.join(' · ')">
                  <td style="color:var(--text-subtle);font-size:11px">{{ row.rowNum }}</td>
                  <td>{{ row.name || '—' }}</td>
                  <td class="num mono">{{ row.unit_price || '—' }}</td>
                  <td class="num mono">{{ row.cost_price || '—' }}</td>
                  <td class="num mono">{{ row.stock || '0' }}</td>
                  <td style="color:var(--text-subtle)">{{ row.sku || '—' }}</td>
                  <td style="color:var(--text-muted-ds)">{{ row.supplier_name || '—' }}</td>
                  <td>
                    @if (row.errors.length > 0) {
                      <span class="badge danger" style="font-size:10px;white-space:nowrap">
                        <app-icon name="x" [size]="10"/>Error
                      </span>
                    } @else {
                      <span class="badge success" style="font-size:10px">OK</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (invalidRows().length > 0) {
          <div class="ds-alert warn" style="margin-top:12px">
            <app-icon name="alert_triangle" [size]="16" style="flex-shrink:0;margin-top:1px"/>
            <div class="d">
              Las <strong>{{ invalidRows().length }} filas con error no se importarán</strong>.
              Pasa el cursor sobre la fila roja para ver el detalle.
            </div>
          </div>
        }
        @if (validRows().length === 0) {
          <div class="ds-alert" style="margin-top:8px;border-color:var(--danger);background:var(--danger-soft)">
            <app-icon name="alert_circle" [size]="16" style="color:var(--danger);flex-shrink:0;margin-top:1px"/>
            <div class="d">No hay filas válidas para importar. Revisa el formato del CSV.</div>
          </div>
        }

      <!-- ── resolving (cargando proveedores) ─────────────────────── -->
      } @else if (step() === 'resolving') {
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 24px;gap:16px">
          <span class="btn-spinner" style="width:24px;height:24px;border-width:3px"></span>
          <p style="font-size:13px;color:var(--text-muted-ds)">Verificando proveedores…</p>
        </div>

      <!-- ── resolve / confirm ─────────────────────────────────────── -->
      } @else if (step() === 'resolve') {

        <!-- Bloqueo: sin tasa de IVA activa -->
        @if (!activeTaxRate()) {
          <div class="ds-alert" style="border-color:var(--danger);background:var(--danger-soft);margin-bottom:16px">
            <app-icon name="alert_circle" [size]="16" style="color:var(--danger);flex-shrink:0;margin-top:1px"/>
            <div>
              <div class="t" style="color:var(--danger)">No hay tasa de IVA activa</div>
              <div class="d" style="margin-top:4px">
                Para importar productos necesitas al menos una tasa de IVA activa.
                Ve al módulo <strong>Tasas de IVA</strong>, crea una y luego vuelve a importar.
              </div>
            </div>
          </div>
        }

        <!-- Proveedores no encontrados -->
        @if (unresolvedSuppliers().length > 0) {
          <div class="ds-alert warn" style="margin-bottom:16px">
            <app-icon name="alert_triangle" [size]="16" style="flex-shrink:0;margin-top:1px"/>
            <div class="d">
              <strong>{{ unresolvedSuppliers().length }} proveedor{{ unresolvedSuppliers().length !== 1 ? 'es' : '' }}</strong>
              del CSV no {{ unresolvedSuppliers().length !== 1 ? 'están registrados' : 'está registrado' }}.
              Elige si quieres crearlos o ignorarlos.
            </div>
          </div>

          <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px">
            @for (name of unresolvedSuppliers(); track name) {
              <div class="sup-card">
                <app-icon name="truck" [size]="16" style="color:var(--text-subtle);flex-shrink:0"/>
                <div style="flex:1;min-width:0">
                  <div style="font-weight:600;font-size:13px">{{ name }}</div>
                  <div style="font-size:11.5px;color:var(--text-subtle)">No encontrado en proveedores</div>
                </div>
                <div class="seg" style="flex-shrink:0">
                  <button class="seg-btn" type="button"
                          [class.active]="getAction(name) === 'create'"
                          (click)="setAction(name, 'create')">
                    <app-icon name="plus" [size]="12"/>Crear
                  </button>
                  <button class="seg-btn" type="button"
                          [class.active]="getAction(name) === 'skip'"
                          (click)="setAction(name, 'skip')">
                    Ignorar
                  </button>
                </div>
              </div>
            }
          </div>
        }

        <!-- Resumen de importación -->
        <div style="background:var(--surface-2);border:1px solid var(--border-ds);border-radius:var(--radius-ds);padding:16px">
          <div style="font-size:10.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text-subtle);margin-bottom:12px">
            Resumen de importación
          </div>
          <div class="summary-row">
            <span>Productos a importar</span>
            <strong>{{ validRows().length }}</strong>
          </div>
          <div class="summary-row">
            <span>IVA aplicado</span>
            @if (activeTaxRate(); as t) {
              <span style="color:var(--success)">{{ t.tax_name }} ({{ t.percentage }}%)</span>
            } @else {
              <span style="color:var(--danger);font-weight:600">Sin tasa activa</span>
            }
          </div>
          <div class="summary-row">
            <span>Con proveedor asignado</span>
            <span style="color:var(--success)">{{ rowsWithSupplier() }}</span>
          </div>
          @if (suppliersToCreate().length > 0) {
            <div class="summary-row">
              <span>Proveedores nuevos a crear</span>
              <strong style="color:var(--accent)">{{ suppliersToCreate().length }}</strong>
            </div>
          }
          @if (suppliersToSkip().length > 0) {
            <div class="summary-row">
              <span style="color:var(--text-subtle)">Sin proveedor (ignorados)</span>
              <span style="color:var(--text-subtle)">{{ suppliersToSkip().length }} nombre{{ suppliersToSkip().length !== 1 ? 's' : '' }}</span>
            </div>
          }
          @if (invalidRows().length > 0) {
            <div class="summary-row">
              <span style="color:var(--danger)">Filas con error (no se importan)</span>
              <span style="color:var(--danger)">{{ invalidRows().length }}</span>
            </div>
          }
        </div>

      <!-- ── importing ─────────────────────────────────────────────── -->
      } @else if (step() === 'importing') {
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 24px;gap:16px">
          <span class="btn-spinner" style="width:28px;height:28px;border-width:3px"></span>
          <p style="font-size:13px;color:var(--text-muted-ds)">
            @if (suppliersToCreate().length > 0) {
              Creando {{ suppliersToCreate().length }} proveedor{{ suppliersToCreate().length !== 1 ? 'es' : '' }} e importando productos…
            } @else {
              Importando {{ validRows().length }} productos…
            }
          </p>
        </div>

      <!-- ── done ──────────────────────────────────────────────────── -->
      } @else if (step() === 'done') {
        @if (result(); as r) {
          <div style="display:flex;align-items:center;gap:14px;background:var(--success-soft);border:1px solid var(--success);border-radius:var(--radius-ds);padding:16px 18px;margin-bottom:16px">
            <app-icon name="check_circle" [size]="24" style="color:var(--success);flex-shrink:0"/>
            <div>
              <div style="font-weight:700;font-size:15px;color:var(--success)">
                {{ r.created_count }} producto{{ r.created_count !== 1 ? 's' : '' }} importado{{ r.created_count !== 1 ? 's' : '' }}
              </div>
              @if (createdSuppliersCount() > 0) {
                <div style="font-size:12px;color:var(--text-muted-ds);margin-top:2px">
                  + {{ createdSuppliersCount() }} proveedor{{ createdSuppliersCount() !== 1 ? 'es' : '' }} creado{{ createdSuppliersCount() !== 1 ? 's' : '' }}
                </div>
              }
              @if (allFailed().length > 0) {
                <div style="font-size:12px;color:var(--text-muted-ds);margin-top:2px">
                  {{ allFailed().length }} fila{{ allFailed().length !== 1 ? 's' : '' }} no se pudo{{ allFailed().length !== 1 ? 'ron' : '' }} importar
                </div>
              }
            </div>
          </div>

          @if (allFailed().length > 0) {
            <div style="font-size:10.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text-subtle);margin-bottom:10px">
              Filas con error
            </div>
            <div style="display:flex;flex-direction:column;gap:6px">
              @for (f of allFailed(); track f.row) {
                <div style="display:flex;gap:10px;align-items:flex-start;background:var(--danger-soft);border-radius:var(--radius-sm-ds);padding:10px 12px">
                  <span style="font-size:11px;color:var(--text-subtle);min-width:48px;flex-shrink:0;margin-top:1px">
                    Fila {{ f.row }}
                  </span>
                  <div style="flex:1;min-width:0">
                    <div style="font-weight:600;font-size:12.5px">{{ f.name || '(sin nombre)' }}</div>
                    <div style="font-size:11.5px;color:var(--danger);margin-top:2px">{{ f.errors.join(' · ') }}</div>
                  </div>
                </div>
              }
            </div>
          }
        }
      }

    </div>

    <!-- Footer -->
    <div class="ds-modal-foot">
      @if (step() === 'idle' || step() === 'preview' || step() === 'resolve') {
        <button class="btn ghost" type="button" (click)="ref.close()">Cancelar</button>
      }
      @if (step() === 'preview') {
        <button class="btn primary" type="button"
                [disabled]="validRows().length === 0"
                (click)="continueToResolve()">
          Continuar
          <app-icon name="arrow_right" [size]="14"/>
        </button>
      }
      @if (step() === 'resolve') {
        <button class="btn primary" type="button" [disabled]="!activeTaxRate()" (click)="doImport()">
          <app-icon name="upload" [size]="14"/>
          Importar {{ validRows().length }} producto{{ validRows().length !== 1 ? 's' : '' }}
          @if (suppliersToCreate().length > 0) {
            + {{ suppliersToCreate().length }} proveedor{{ suppliersToCreate().length !== 1 ? 'es' : '' }}
          }
        </button>
      }
      @if (step() === 'done') {
        <button class="btn primary" type="button" (click)="ref.close(true)">
          <app-icon name="check" [size]="14"/>Cerrar
        </button>
      }
    </div>
  `,
})
export class CsvImportDialogComponent {
  ref              = inject(MatDialogRef<CsvImportDialogComponent>);
  private svc      = inject(ProductsService);
  private supSvc   = inject(SuppliersService);
  private taxSvc   = inject(TaxRatesService);
  private snack    = inject(MatSnackBar);

  step     = signal<DialogStep>('idle');
  rows     = signal<ParsedRow[]>([]);
  dragOver = signal(false);
  result   = signal<BulkCreateResult | null>(null);

  activeTaxRate              = signal<TaxRate | null>(null);
  private allSuppliers       = signal<Supplier[]>([]);
  unresolvedSuppliers        = signal<string[]>([]);
  private supplierActions    = signal<Map<string, 'create' | 'skip'>>(new Map());
  private createdSuppliers   = signal<Supplier[]>([]);

  private preInvalid       = signal<{ row: number; name: string; errors: string[] }[]>([]);
  private backendIdxToRow: number[] = [];

  validRows   = computed(() => this.rows().filter(r => r.errors.length === 0));
  invalidRows = computed(() => this.rows().filter(r => r.errors.length > 0));

  suppliersToCreate = computed(() =>
    this.unresolvedSuppliers().filter(n => (this.supplierActions().get(n) ?? 'create') === 'create')
  );
  suppliersToSkip = computed(() =>
    this.unresolvedSuppliers().filter(n => (this.supplierActions().get(n) ?? 'create') === 'skip')
  );

  rowsWithSupplier = computed(() => {
    const existingNames = new Set(this.allSuppliers().map(s => s.name.toLowerCase()));
    const willCreate    = new Set(this.suppliersToCreate().map(n => n.toLowerCase()));
    return this.validRows().filter(r => {
      const n = r.supplier_name.trim().toLowerCase();
      return n && (existingNames.has(n) || willCreate.has(n));
    }).length;
  });

  createdSuppliersCount = computed(() => this.createdSuppliers().length);

  allFailed = computed(() => {
    const r   = this.result();
    const pre = this.preInvalid();
    return [...pre, ...(r?.failed ?? [])].sort((a, b) => a.row - b.row);
  });

  headerSub = computed(() => {
    switch (this.step()) {
      case 'idle':       return 'Sube un archivo CSV con tus productos';
      case 'preview':    return `${this.rows().length} filas · ${this.validRows().length} válidas`;
      case 'resolving':  return 'Verificando proveedores…';
      case 'resolve':    return this.unresolvedSuppliers().length > 0
                           ? `${this.unresolvedSuppliers().length} proveedor(es) no encontrado(s)`
                           : 'Confirmar importación';
      case 'importing':  return 'Procesando…';
      case 'done':       return 'Importación completada';
    }
  });

  getAction(name: string): 'create' | 'skip' {
    return this.supplierActions().get(name) ?? 'create';
  }

  setAction(name: string, action: 'create' | 'skip'): void {
    const map = new Map(this.supplierActions());
    map.set(name, action);
    this.supplierActions.set(map);
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.dragOver.set(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) this.parseFile(file);
  }

  onFileChange(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this.parseFile(file);
  }

  private parseFile(file: File): void {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text   = ev.target?.result as string;
      const parsed = this.parseCsv(text);
      this.rows.set(parsed);
      this.preInvalid.set(
        parsed.filter(r => r.errors.length > 0)
              .map(r => ({ row: r.rowNum, name: r.name, errors: r.errors }))
      );
      this.step.set('preview');
    };
    reader.readAsText(file, 'utf-8');
  }

  private parseCsv(text: string): ParsedRow[] {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) return [];

    const headers = this.splitLine(lines[0]).map(h => h.toLowerCase().trim());
    const idx = (...names: string[]) => {
      for (const n of names) { const i = headers.indexOf(n); if (i >= 0) return i; }
      return -1;
    };

    const col = {
      name:          idx('name', 'nombre'),
      unit_price:    idx('unit_price', 'precio_venta', 'precio venta', 'sale_price'),
      cost_price:    idx('cost_price', 'precio_costo', 'precio costo', 'purchase_price'),
      stock:         idx('stock'),
      min_stock:     idx('min_stock', 'stock_minimo', 'stock mínimo'),
      sku:           idx('sku'),
      description:   idx('description', 'descripcion', 'descripción'),
      supplier_name: idx('supplier_name', 'proveedor', 'proveedor_nombre', 'supplier'),
    };

    const get = (parts: string[], i: number) =>
      i >= 0 ? (parts[i] ?? '').trim() : '';

    const rows: ParsedRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const parts  = this.splitLine(lines[i]);
      const name   = get(parts, col.name);
      const uprice = get(parts, col.unit_price);
      const errors: string[] = [];

      if (!name)                                  errors.push('Nombre requerido');
      else if (name.length < 2)                   errors.push('Nombre muy corto (mín. 2 caracteres)');

      if (uprice === '')                           errors.push('Precio de venta requerido');
      else if (isNaN(+uprice) || +uprice < 0)     errors.push(`Precio de venta inválido: "${uprice}"`);

      rows.push({
        rowNum:        i,
        name,
        unit_price:    uprice,
        cost_price:    get(parts, col.cost_price),
        stock:         get(parts, col.stock),
        min_stock:     get(parts, col.min_stock),
        sku:           get(parts, col.sku),
        description:   get(parts, col.description),
        supplier_name: get(parts, col.supplier_name),
        errors,
      });
    }
    return rows;
  }

  continueToResolve(): void {
    if (!this.validRows().length) return;
    this.step.set('resolving');

    forkJoin({
      suppliers: this.supSvc.list({ page: 1, limit: 500 }),
      taxRates:  this.taxSvc.list({ page: 1, limit: 100 }),
    }).subscribe({
      next: ({ suppliers, taxRates }) => {
        this.allSuppliers.set(suppliers.data);

        const active = taxRates.data.find(t => t.is_active) ?? null;
        this.activeTaxRate.set(active);

        const existingNames = new Set(suppliers.data.map((s: Supplier) => s.name.toLowerCase()));
        const csvNames      = [...new Set(
          this.validRows()
            .map(r => r.supplier_name.trim())
            .filter(n => n.length > 0)
        )];
        const unresolved    = csvNames.filter(n => !existingNames.has(n.toLowerCase()));

        this.unresolvedSuppliers.set(unresolved);

        const map = new Map<string, 'create' | 'skip'>();
        unresolved.forEach(n => map.set(n, 'create'));
        this.supplierActions.set(map);

        this.step.set('resolve');
      },
      error: () => {
        this.snack.open('Error al cargar datos de configuración', 'OK', { duration: 3000 });
        this.step.set('preview');
      },
    });
  }

  doImport(): void {
    const valid      = this.validRows();
    const taxRate    = this.activeTaxRate();
    if (!valid.length || !taxRate) return;

    this.backendIdxToRow = valid.map(r => r.rowNum);
    this.step.set('importing');

    const toCreate  = this.suppliersToCreate();
    const createObs = toCreate.length > 0
      ? forkJoin(toCreate.map(name => this.supSvc.create({ name })))
      : of([] as Supplier[]);

    createObs.pipe(
      switchMap(newSuppliers => {
        this.createdSuppliers.set(newSuppliers);

        const nameToId = new Map<string, number>();
        this.allSuppliers().forEach(s => nameToId.set(s.name.toLowerCase(), s.id));
        newSuppliers.forEach(s => nameToId.set(s.name.toLowerCase(), s.id));

        const products = valid.map(r => ({
          name:        r.name,
          unit_price:  +r.unit_price,
          cost_price:  r.cost_price  ? +r.cost_price             : undefined,
          stock:       r.stock       ? parseInt(r.stock,    10)  : 0,
          min_stock:   r.min_stock   ? parseInt(r.min_stock, 10) : 0,
          sku:         r.sku         || undefined,
          description: r.description || undefined,
          supplier_id: r.supplier_name
                         ? nameToId.get(r.supplier_name.trim().toLowerCase())
                         : undefined,
          tax_rate_id: taxRate.id,
        }));

        return this.svc.bulkCreate(products);
      })
    ).subscribe({
      next: (res) => {
        const remapped = {
          ...res,
          failed: res.failed.map(f => ({
            ...f,
            row: this.backendIdxToRow[f.row - 1] ?? f.row,
          })),
        };
        this.result.set(remapped);
        this.step.set('done');
      },
      error: (err) => {
        this.snack.open(err?.error?.message || 'Error al importar', 'OK', { duration: 4000 });
        this.step.set('resolve');
      },
    });
  }

  downloadTemplate(): void {
    const header = 'name,unit_price,cost_price,stock,min_stock,sku,description,supplier_name';
    const sample = '"Producto ejemplo",10.50,8.00,100,10,SKU-001,"Descripción opcional","Distribuidora XYZ"';
    const blob   = new Blob([header + '\n' + sample], { type: 'text/csv;charset=utf-8;' });
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement('a');
    a.href = url; a.download = 'plantilla_productos.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  private splitLine(line: string): string[] {
    const result: string[] = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (ch === ',' && !inQ) {
        result.push(cur); cur = '';
      } else {
        cur += ch;
      }
    }
    result.push(cur);
    return result;
  }
}
