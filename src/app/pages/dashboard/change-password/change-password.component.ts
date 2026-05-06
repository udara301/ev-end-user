import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./change-password.component.scss']
})
export class ChangePasswordComponent {
  @Output() back = new EventEmitter<void>();
  @Output() passwordChanged = new EventEmitter<void>();

  isSaving = false;
  successMessage = '';
  errorMessage = '';

  form = {
    current_password: '',
    new_password: '',
    confirm_password: ''
  };

  constructor(private authService: AuthService) {}

  goBack() {
    this.back.emit();
  }

  onSubmit() {
    this.successMessage = '';
    this.errorMessage = '';
    if (this.form.new_password !== this.form.confirm_password) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }
    if (this.form.new_password.length < 6) {
      this.errorMessage = 'New password must be at least 6 characters.';
      return;
    }
    this.isSaving = true;
    this.authService.changePassword(this.form.current_password, this.form.new_password).subscribe({
      next: () => {
        this.successMessage = 'Password changed successfully!';
        this.isSaving = false;
        this.passwordChanged.emit();
        this.form.current_password = '';
        this.form.new_password = '';
        this.form.confirm_password = '';
      },
      error: (err) => {
        this.isSaving = false;
        if (err?.error?.message) {
          this.errorMessage = err.error.message;
        } else if (err?.status === 400) {
          this.errorMessage = 'Invalid input or current password incorrect.';
        } else if (err?.status === 401) {
          this.errorMessage = 'Unauthorized. Please log in again.';
        } else {
          this.errorMessage = 'Failed to change password.';
        }
      }
    });
  }
}
