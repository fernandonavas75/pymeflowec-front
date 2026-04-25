import { Component, inject, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { ThemeService } from './core/services/theme.service';

const PUBLIC_ROUTES = new Set(['/', '/login', '/register', '/forgot-password']);

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class AppComponent implements OnInit {
  private router = inject(Router);
  private theme = inject(ThemeService);

  ngOnInit(): void {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(e => {
        const url = e.urlAfterRedirects.split('?')[0];
        if (PUBLIC_ROUTES.has(url)) {
          this.theme.reset();
        }
      });
  }
}
