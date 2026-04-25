import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tax-rate-form',
  standalone: true,
  template: '',
})
export class TaxRateFormComponent implements OnInit {
  private router = inject(Router);
  ngOnInit(): void { this.router.navigate(['/tax-rates']); }
}
