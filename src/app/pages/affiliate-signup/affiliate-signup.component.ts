import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AffiliateSignupPayload, AuthService } from '../../services/auth.service';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (!password || !confirmPassword) {
        return null;
    }

    return password === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
    selector: 'app-affiliate-signup',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './affiliate-signup.component.html',
    styleUrl: './affiliate-signup.component.scss'
})
export class AffiliateSignupComponent {
    isSubmitting = false;
    apiError = '';

    constructor(private readonly formBuilder: FormBuilder, private readonly authService: AuthService, private readonly router: Router) { }
    readonly affiliateSignupForm = this.formBuilder.group({
        fullName: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', [Validators.required, Validators.pattern(/^(?:\+94|0)?(?:7\d{8}|\d{9})$/)]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]],
        acceptTerms: [false, [Validators.requiredTrue]]
    }, { validators: passwordMatchValidator });


    get confirmPasswordControl(): AbstractControl | null {
        return this.affiliateSignupForm.get('confirmPassword');
    }

    onSubmit(): void {
        this.apiError = '';

        if (this.affiliateSignupForm.invalid) {
            this.affiliateSignupForm.markAllAsTouched();
            return;
        }

        const rawValue = this.affiliateSignupForm.getRawValue();
        const payload: AffiliateSignupPayload = {
            name: rawValue.fullName?.trim() ?? '',
            email: rawValue.email?.trim() ?? '',
            phone: rawValue.phone?.trim() ?? '',
            password: rawValue.password ?? '',
        };

        this.isSubmitting = true;

        this.authService.affiliateSignup(payload)
            .pipe(finalize(() => {
                this.isSubmitting = false;
            }))
            .subscribe({
                next: () => {
                    this.affiliateSignupForm.reset({ acceptTerms: false });
                    this.router.navigate(['/affiliate/login'], { queryParams: { registered: 'true' } });
                },
                error: (error) => {
                    this.apiError = this.extractErrorMessage(error);
                }
            });
    }

    hasControlError(controlName: string, errorKey: string): boolean {
        const control = this.affiliateSignupForm.get(controlName);
        return !!control && control.touched && control.hasError(errorKey);
    }

    private extractErrorMessage(error: unknown): string {
        const defaultMessage = 'Unable to create your affiliate account right now. Please try again.';

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
