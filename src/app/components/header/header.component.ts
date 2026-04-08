import { AfterViewInit, Component, ElementRef, inject, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements AfterViewInit, OnDestroy {
  private readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);
  readonly authService = inject(AuthService);

  @ViewChild('headerBar') headerBar!: ElementRef<HTMLElement>;

  mobileMenuOpen = false;
  compact = false;
  private resizeObserver: ResizeObserver | null = null;

  ngAfterViewInit(): void {
    this.resizeObserver = new ResizeObserver(() => {
      this.zone.run(() => this.checkOverflow());
    });
    this.resizeObserver.observe(this.headerBar.nativeElement);
    // Initial check
    setTimeout(() => this.checkOverflow());
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  private checkOverflow(): void {
    const el = this.headerBar.nativeElement;
    this.compact = el.scrollWidth > el.clientWidth;
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }

  logout() {
    this.authService.logout();
    this.mobileMenuOpen = false;
    this.router.navigate(['/']);
  }
}
