import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { AffiliateCode, AffiliateRewardsService } from '../../../services/affiliate-rewards.service';

@Component({
  selector: 'app-affiliate-code-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './code-tab.component.html'
})
export class CodeTabComponent implements OnInit {
  private readonly codesSubject = new BehaviorSubject<AffiliateCode[]>([]);
  readonly codes$ = this.codesSubject.asObservable();

  newCodeLabel = '';
  createdMessage = '';
  isLoading = false;

  constructor(private readonly rewardsService: AffiliateRewardsService) {}

  ngOnInit(): void {
    this.loadCodes();
  }

  private loadCodes(): void {
    this.rewardsService.getCodes().subscribe({
      next: (codes) => {
        this.codesSubject.next(codes);
      },
      error: (error) => {
        console.error('Error loading codes:', error);
        this.createdMessage = 'Error loading codes. Please refresh and try again.';
      }
    });
  }

  createCode(): void {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.rewardsService.addCode(this.newCodeLabel).subscribe({
      next: (response) => {
        const created = response.coupon;
        this.codesSubject.next([created, ...this.codesSubject.value]);
        this.createdMessage = `New code ${created.code} is ready.`;
        this.newCodeLabel = '';

        // Clear message after 5 seconds
        setTimeout(() => {
          this.createdMessage = '';
        }, 5000);

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error creating code:', error);
        this.createdMessage = 'Error creating code. Please try again.';
        this.isLoading = false;
      }
    });
  }

  async copyCode(code: string): Promise<void> {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(code);
        this.createdMessage = `Copied ${code} to clipboard.`;
        
        // Clear message after 3 seconds
        setTimeout(() => {
          this.createdMessage = '';
        }, 3000);
      }
    } catch {
      this.createdMessage = 'Could not copy automatically. Please copy manually.';
    }
  }

  trackByCode(_: number, item: AffiliateCode): number {
    return item.id;
  }
}
