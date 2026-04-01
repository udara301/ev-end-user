import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject, NgZone } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService, SignupPayload } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

declare const google: any;

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  if (!password || !confirmPassword) {
    return null;
  }

  return password === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent implements AfterViewInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);

  readonly signupForm = this.formBuilder.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^(?:\+94|0)?(?:7\d{8}|\d{9})$/)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
    acceptTerms: [false, [Validators.requiredTrue]]
  }, { validators: passwordMatchValidator });

  isSubmitting = false;
  apiError = '';
  isGoogleLoading = false;

  ngAfterViewInit(): void {
    if (typeof google !== 'undefined') {
      this.initializeGoogle();
    } else {
      const interval = setInterval(() => {
        if (typeof google !== 'undefined') {
          clearInterval(interval);
          this.initializeGoogle();
        }
      }, 100);
    }
  }

  private initializeGoogle(): void {
    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: any) => this.handleGoogleSignup(response),
    });
    google.accounts.id.renderButton(
      document.getElementById('google-signup-btn'),
      { theme: 'outline', size: 'large', width: '100%', text: 'signup_with', shape: 'pill' }
    );
  }

  handleGoogleSignup(response: any): void {
    this.ngZone.run(() => {
      this.isGoogleLoading = true;
      this.apiError = '';

      this.authService.googleLogin(response.credential)
        .pipe(finalize(() => this.isGoogleLoading = false))
        .subscribe({
          next: (res) => {
            this.authService.setToken(res.token, false);
            this.router.navigateByUrl('/dashboard');
          },
          error: (error) => {
            this.apiError = this.extractErrorMessage(error);
          }
        });
    });
  }

  get fullNameControl(): AbstractControl | null {
    return this.signupForm.get('fullName');
  }

  get emailControl(): AbstractControl | null {
    return this.signupForm.get('email');
  }

  get phoneControl(): AbstractControl | null {
    return this.signupForm.get('phone');
  }

  get passwordControl(): AbstractControl | null {
    return this.signupForm.get('password');
  }

  get confirmPasswordControl(): AbstractControl | null {
    return this.signupForm.get('confirmPassword');
  }

  onSubmit(): void {
    this.apiError = '';

    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    const rawValue = this.signupForm.getRawValue();
    const payload: SignupPayload = {
      name: rawValue.fullName?.trim() ?? '',
      email: rawValue.email?.trim() ?? '',
      phone: rawValue.phone?.trim() ?? '',
      password: rawValue.password ?? ''
    };

    this.isSubmitting = true;

    this.authService.signup(payload)
      .pipe(finalize(() => {
        this.isSubmitting = false;
      }))
      .subscribe({
        next: () => {
          this.signupForm.reset({ acceptTerms: false });
          this.router.navigate(['/login'], { queryParams: { registered: 'true' } });
        },
        error: (error) => {
          this.apiError = this.extractErrorMessage(error);
        }
      });
  }

  hasControlError(controlName: string, errorKey: string): boolean {
    const control = this.signupForm.get(controlName);
    return !!control && control.touched && control.hasError(errorKey);
  }

  private extractErrorMessage(error: unknown): string {
    const defaultMessage = 'Unable to create your account right now. Please try again.';

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
