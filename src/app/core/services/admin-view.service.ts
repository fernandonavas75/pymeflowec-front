import { Injectable, inject, signal, computed } from '@angular/core';
import { CompanyModulesService } from './company-modules.service';

export interface ViewedCompany {
  id: number;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class AdminViewService {
  private modulesSvc = inject(CompanyModulesService);

  viewedCompany = signal<ViewedCompany | null>(null);
  isClientViewMode = computed(() => !!this.viewedCompany());
  loading = signal(false);

  enterClientView(company: ViewedCompany): void {
    this.modulesSvc.reset();
    this.viewedCompany.set(company);
    this.loading.set(true);
    this.modulesSvc.loadCatalogForCompany(company.id).subscribe({
      next: () => this.loading.set(false),
      error: () => this.loading.set(false),
    });
  }

  exitClientView(): void {
    this.viewedCompany.set(null);
    this.loading.set(false);
    this.modulesSvc.reset();
  }
}
