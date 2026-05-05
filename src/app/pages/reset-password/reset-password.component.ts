import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent {
  form: FormGroup;
  token: string | null = null;
  message: string = '';
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]]
    });
    this.token = this.route.snapshot.queryParamMap.get('token');
  }

  submit() {
    if (this.form.invalid || !this.token) return;
    this.loading = true;
    this.authService.resetPassword(this.token, this.form.value.newPassword)
      .subscribe({
        next: () => {
          this.message = 'Password reset successful. Redirecting to login...';
          this.loading = false;
          setTimeout(() => this.router.navigate(['/login']), 2000);
        },
        error: err => {
          this.message = err.error?.message || 'Reset failed';
          this.loading = false;
        }
      });
  }
}
