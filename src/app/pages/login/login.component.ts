import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../services/auth.service';

export interface LoginPayload {
  email: string;
  password: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly registrationSuccessful = this.route.snapshot.queryParamMap.get('registered') === 'true';
  readonly sessionExpired = this.route.snapshot.queryParamMap.get('expired') === 'true';
  private readonly returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');

  readonly loginForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    rememberMe: [false]
  });

  isSubmitting = false;
  apiError = '';

  get emailControl(): AbstractControl | null {
    return this.loginForm.get('email');
  }

  get passwordControl(): AbstractControl | null {
    return this.loginForm.get('password');
  }

  onSubmit(): void {
    this.apiError = '';

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const rawValue = this.loginForm.getRawValue();
    const payload: LoginPayload = {
      email: rawValue.email?.trim() ?? '',
      password: rawValue.password ?? ''
    };

    this.isSubmitting = true;

    this.authService.login(payload)
      .pipe(finalize(() => {
        this.isSubmitting = false;
      }))
      .subscribe({
        next: (response) => {
          const rememberMe = this.loginForm.get('rememberMe')?.value ?? false;
          this.authService.setToken(response.token, rememberMe);
          this.loginForm.reset({ rememberMe: false });
          this.router.navigateByUrl(this.returnUrl ?? '/dashboard');
        },
        error: (error) => {
          this.apiError = this.extractErrorMessage(error);
        }
      });
  }

  hasControlError(controlName: string, errorKey: string): boolean {
    const control = this.loginForm.get(controlName);
    return !!control && control.touched && control.hasError(errorKey);
  }

  private extractErrorMessage(error: unknown): string {
    const defaultMessage = 'Unable to log in. Please check your credentials and try again.';

    if (!error || typeof error !== 'object') {
      return defaultMessage;
    }

    const httpError = error as {
      error?: {
        message?: string | string[];
        error?: string;
      };
      message?: string;
    };

    const message = httpError.error?.message ?? httpError.error?.error ?? httpError.message;

    if (Array.isArray(message)) {
      return message.join(' ');
    }

    if (typeof message === 'string' && message.trim()) {
      return message;
    }

    return defaultMessage;
  }
}
