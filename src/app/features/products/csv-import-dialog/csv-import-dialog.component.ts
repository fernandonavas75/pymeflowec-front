import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';
import { ProductsService, BulkCreateResult } from '../../../core/services/products.service';

interface ParsedRow {
  rowNum: number;
  name: string;
  unit_price: string;
  cost_price: string;
  stock: string;
  min_stock: string;
  sku: string;
  description: string;
  supplier_id: string;
  tax_rate_id: string;
  errors: string[];
}

type DialogStep = 'idle' | 'preview' | 'importing' | 'done';

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
              name, unit_price, cost_price, stock, min_stock, sku, description, supplier_id, tax_rate_id
            </div>
            <div class="d" style="margin-top:6px">
              La primera fila debe ser el encabezado. Máximo 300 filas. Los campos opcionales pueden dejarse en blanco.
            </div>
          </div>
        </div>

        <button class="btn ghost sm" type="button" style="margin-top:12px" (click)="downloadTemplate()">
          <app-icon name="download" [size]="13"/>Descargar plantilla CSV
        </button>
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
                <th>Prov. ID</th>
                <th>IVA ID</th>
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
                  <td style="color:var(--text-subtle)">{{ row.supplier_id || '—' }}</td>
                  <td style="color:var(--text-subtle)">{{ row.tax_rate_id || '—' }}</td>
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
              Pasa el cursor sobre la fila roja para ver el detalle. Corrige el CSV y vuelve a subirlo si quieres incluirlas.
            </div>
          </div>
        }
        @if (validRows().length === 0) {
          <div class="ds-alert" style="margin-top:8px;border-color:var(--danger);background:var(--danger-soft)">
            <app-icon name="alert_circle" [size]="16" style="color:var(--danger);flex-shrink:0;margin-top:1px"/>
            <div class="d">No hay filas válidas para importar. Revisa el formato del CSV.</div>
          </div>
        }
      } @else if (step() === 'importing') {
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 24px;gap:16px">
          <span class="btn-spinner" style="width:28px;height:28px;border-width:3px"></span>
          <p style="font-size:13px;color:var(--text-muted-ds)">
            Importando {{ validRows().length }} productos…
          </p>
        </div>
      } @else if (step() === 'done') {
        @if (result(); as r) {
          <!-- Banner de éxito -->
          <div style="display:flex;align-items:center;gap:14px;background:var(--success-soft);border:1px solid var(--success);border-radius:var(--radius-ds);padding:16px 18px;margin-bottom:16px">
            <app-icon name="check_circle" [size]="24" style="color:var(--success);flex-shrink:0"/>
            <div>
              <div style="font-weight:700;font-size:15px;color:var(--success)">
                {{ r.created_count }} producto{{ r.created_count !== 1 ? 's' : '' }} importado{{ r.created_count !== 1 ? 's' : '' }}
              </div>
              @if (allFailed().length > 0) {
                <div style="font-size:12px;color:var(--text-muted-ds);margin-top:2px">
                  {{ allFailed().length }} fila{{ allFailed().length !== 1 ? 's' : '' }} no se pudo{{ allFailed().length !== 1 ? 'ron' : '' }} importar
                </div>
              }
            </div>
          </div>

          <!-- Lista de errores -->
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
      @if (step() === 'idle' || step() === 'preview') {
        <button class="btn ghost" type="button" (click)="ref.close()">Cancelar</button>
      }
      @if (step() === 'preview') {
        <button class="btn primary" type="button"
                [disabled]="validRows().length === 0"
                (click)="doImport()">
          <app-icon name="upload" [size]="14"/>
          Importar {{ validRows().length }} producto{{ validRows().length !== 1 ? 's' : '' }}
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
  ref = inject(MatDialogRef<CsvImportDialogComponent>);
  private svc = inject(ProductsService);
  private snackBar = inject(MatSnackBar);

  step     = signal<DialogStep>('idle');
  rows     = signal<ParsedRow[]>([]);
  dragOver = signal(false);
  result   = signal<BulkCreateResult | null>(null);

  // Filas con errores de pre-validación excluidas de la petición al backend
  private preInvalid = signal<{ row: number; name: string; errors: string[] }[]>([]);
  // Mapa: índice en el array enviado al backend → rowNum del CSV
  private backendIdxToRow: number[] = [];

  validRows   = computed(() => this.rows().filter(r => r.errors.length === 0));
  invalidRows = computed(() => this.rows().filter(r => r.errors.length > 0));

  // Combina errores de pre-validación y del backend, ordenados por fila
  allFailed = computed(() => {
    const r = this.result();
    const pre = this.preInvalid();
    const backFailed = r?.failed ?? [];
    return [...pre, ...backFailed].sort((a, b) => a.row - b.row);
  });

  headerSub = computed(() => {
    switch (this.step()) {
      case 'idle':      return 'Sube un archivo CSV con tus productos';
      case 'preview':   return `${this.rows().length} filas · ${this.validRows().length} válidas`;
      case 'importing': return 'Procesando...';
      case 'done':      return 'Importación completada';
    }
  });

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
      const text = ev.target?.result as string;
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
      name:        idx('name', 'nombre'),
      unit_price:  idx('unit_price', 'precio_venta', 'precio venta', 'sale_price'),
      cost_price:  idx('cost_price', 'precio_costo', 'precio costo', 'purchase_price'),
      stock:       idx('stock'),
      min_stock:   idx('min_stock', 'stock_minimo', 'stock mínimo'),
      sku:         idx('sku'),
      description: idx('description', 'descripcion', 'descripción'),
      supplier_id: idx('supplier_id', 'proveedor_id'),
      tax_rate_id: idx('tax_rate_id', 'iva_id'),
    };

    const get = (parts: string[], i: number) =>
      i >= 0 ? (parts[i] ?? '').trim() : '';

    const rows: ParsedRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const parts  = this.splitLine(lines[i]);
      const name   = get(parts, col.name);
      const uprice = get(parts, col.unit_price);
      const errors: string[] = [];

      if (!name)           errors.push('Nombre requerido');
      else if (name.length < 2) errors.push('Nombre muy corto (mín. 2 caracteres)');

      if (uprice === '')                         errors.push('Precio de venta requerido');
      else if (isNaN(+uprice) || +uprice < 0)   errors.push(`Precio de venta inválido: "${uprice}"`);

      rows.push({
        rowNum:      i,
        name,
        unit_price:  uprice,
        cost_price:  get(parts, col.cost_price),
        stock:       get(parts, col.stock),
        min_stock:   get(parts, col.min_stock),
        sku:         get(parts, col.sku),
        description: get(parts, col.description),
        supplier_id: get(parts, col.supplier_id),
        tax_rate_id: get(parts, col.tax_rate_id),
        errors,
      });
    }
    return rows;
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

  doImport(): void {
    const valid = this.validRows();
    if (!valid.length) return;

    // Guarda el mapa índice-backend → rowNum del CSV para reasignar números de fila
    this.backendIdxToRow = valid.map(r => r.rowNum);
    this.step.set('importing');

    const products = valid.map(r => ({
      name:        r.name,
      unit_price:  +r.unit_price,
      cost_price:  r.cost_price ? +r.cost_price : undefined,
      stock:       r.stock      ? parseInt(r.stock, 10) : 0,
      min_stock:   r.min_stock  ? parseInt(r.min_stock, 10) : 0,
      sku:         r.sku        || undefined,
      description: r.description || undefined,
      supplier_id: r.supplier_id ? parseInt(r.supplier_id, 10) : undefined,
      tax_rate_id: r.tax_rate_id ? parseInt(r.tax_rate_id, 10) : undefined,
    }));

    this.svc.bulkCreate(products).subscribe({
      next: (res) => {
        // El backend devuelve el índice en el array enviado; lo remapeamos al rowNum del CSV
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
        this.snackBar.open(err?.error?.message || 'Error al importar', 'OK', { duration: 4000 });
        this.step.set('preview');
      },
    });
  }

  downloadTemplate(): void {
    const header = 'name,unit_price,cost_price,stock,min_stock,sku,description,supplier_id,tax_rate_id';
    const sample = '"Producto ejemplo",10.50,8.00,100,10,SKU-001,"Descripción opcional",,';
    const blob   = new Blob([header + '\n' + sample], { type: 'text/csv;charset=utf-8;' });
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement('a');
    a.href = url; a.download = 'plantilla_productos.csv'; a.click();
    URL.revokeObjectURL(url);
  }
}
