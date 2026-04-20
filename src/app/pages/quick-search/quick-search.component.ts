import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-quick-search',
  standalone: true,
  template: `<div class="flex items-center justify-center min-h-screen">
    <span class="material-icons animate-spin text-4xl text-primary">sync</span>
  </div>`
})
export class QuickSearchComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    const ocppId = this.route.snapshot.paramMap.get('ocppId');
    if (ocppId) {
      localStorage.setItem('ev_pending_charger', ocppId);
    }

    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/dashboard'], { queryParams: { tab: 'charger' } });
    } else {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/dashboard?tab=charger' } });
    }
  }
}
