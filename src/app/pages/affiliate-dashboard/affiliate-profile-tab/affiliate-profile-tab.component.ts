import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-affiliate-profile-tab',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './affiliate-profile-tab.component.html'
})
export class AffiliateProfileTabComponent implements OnInit {
  profile: any = null;
  isProfileSaving = false;
  profileSuccessMessage = '';
  profileErrorMessage = '';

  isPasswordSaving = false;
  passwordSuccessMessage = '';
  passwordErrorMessage = '';

  readonly basicDetailsForm = this.formBuilder.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    phone_number: ['', [Validators.required, Validators.pattern(/^(?:\+94|0)?(?:7\d{8}|\d{9})$/)]]
  });

  readonly passwordForm = this.formBuilder.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]]
  });

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly formBuilder: FormBuilder
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  private loadProfile(): void {
    this.authService.getProfile().subscribe({
      next: (res: any) => {
        this.profile = res;
        this.basicDetailsForm.patchValue({
          name: res?.name || '',
          phone_number: res?.phone_number || res?.phone || ''
        });
      },
      error: () => {
        this.profile = null;
      }
    });
  }

  saveBasicDetails(): void {
    this.profileSuccessMessage = '';
    this.profileErrorMessage = '';

    if (this.basicDetailsForm.invalid) {
      this.basicDetailsForm.markAllAsTouched();
      return;
    }

    const value = this.basicDetailsForm.getRawValue();
    const payload = {
      name: value.name?.trim() || '',
      phone_number: value.phone_number?.trim() || '',
      phone: value.phone_number?.trim() || ''
    };

    this.isProfileSaving = true;
    this.authService.updateCustomerProfile(payload).subscribe({
      next: () => {
        this.isProfileSaving = false;
        this.profileSuccessMessage = 'Basic details updated successfully.';
        this.loadProfile();
      },
      error: (err) => {
        this.isProfileSaving = false;
        this.profileErrorMessage = err?.error?.message || 'Failed to update basic details. Please try again.';
      }
    });
  }

  updatePassword(): void {
    this.passwordSuccessMessage = '';
    this.passwordErrorMessage = '';

    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const value = this.passwordForm.getRawValue();
    if ((value.newPassword || '') !== (value.confirmPassword || '')) {
      this.passwordErrorMessage = 'Passwords do not match.';
      return;
    }

    this.isPasswordSaving = true;
    this.authService.changePassword(value.currentPassword || '', value.newPassword || '').subscribe({
      next: () => {
        this.isPasswordSaving = false;
        this.passwordSuccessMessage = 'Password changed successfully.';
        this.passwordForm.reset();
      },
      error: (err) => {
        this.isPasswordSaving = false;
        this.passwordErrorMessage = err?.error?.message || 'Failed to change password. Please try again.';
      }
    });
  }

  hasBasicError(controlName: string, errorKey: string): boolean {
    const control = this.basicDetailsForm.get(controlName);
    return !!control && control.touched && control.hasError(errorKey);
  }

  hasPasswordError(controlName: string, errorKey: string): boolean {
    const control = this.passwordForm.get(controlName);
    return !!control && control.touched && control.hasError(errorKey);
  }

  get confirmPasswordControl(): AbstractControl | null {
    return this.passwordForm.get('confirmPassword');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/affiliate/login']);
  }
}
