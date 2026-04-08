import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { EditProfileComponent } from '../edit-profile/edit-profile.component';

@Component({
  selector: 'app-profile-tab',
  standalone: true,
  imports: [CommonModule, EditProfileComponent],
  templateUrl: './profile-tab.component.html'
})
export class ProfileTabComponent implements OnInit {
  user: any = null;
  showEditProfile = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  private loadProfile(): void {
    this.authService.getProfile().subscribe({
      next: (data: any) => {
        this.user = data || null;
      },
      error: (err) => {
        console.error('Error fetching profile:', err);
      }
    });
  }

  openEditProfile(): void {
    this.showEditProfile = true;
  }

  closeEditProfile(): void {
    this.showEditProfile = false;
  }

  onProfileUpdated(): void {
    this.loadProfile();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
