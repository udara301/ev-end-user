import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Toast, ToastService } from '../../services/toast.service';

interface ToastItem extends Toast {
  id: number;
  removing: boolean;
}

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <div *ngFor="let toast of toasts; trackBy: trackById"
        class="pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm transition-all duration-300"
        [class.translate-x-0]="!toast.removing"
        [class.opacity-100]="!toast.removing"
        [class.translate-x-full]="toast.removing"
        [class.opacity-0]="toast.removing"
        [ngClass]="getToastClasses(toast.type)">
        <span class="material-icons text-lg mt-0.5 shrink-0">{{ getIcon(toast.type) }}</span>
        <p class="text-sm font-medium flex-1">{{ toast.message }}</p>
        <button (click)="dismiss(toast)" class="shrink-0 opacity-60 hover:opacity-100 transition">
          <span class="material-icons text-base">close</span>
        </button>
      </div>
    </div>
  `
})
export class ToastComponent implements OnInit, OnDestroy {
  toasts: ToastItem[] = [];
  private sub!: Subscription;
  private counter = 0;

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.sub = this.toastService.toast$.subscribe(toast => {
      const item: ToastItem = { ...toast, id: ++this.counter, removing: false };
      this.toasts.push(item);

      setTimeout(() => this.dismiss(item), toast.duration || 3000);
    });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  dismiss(toast: ToastItem): void {
    toast.removing = true;
    setTimeout(() => {
      this.toasts = this.toasts.filter(t => t.id !== toast.id);
    }, 300);
  }

  trackById(_: number, item: ToastItem): number {
    return item.id;
  }

  getToastClasses(type: string): string {
    switch (type) {
      case 'success': return 'bg-emerald-50/95 border-emerald-200 text-emerald-800';
      case 'error': return 'bg-red-50/95 border-red-200 text-red-800';
      case 'warning': return 'bg-amber-50/95 border-amber-200 text-amber-800';
      case 'info': return 'bg-sky-50/95 border-sky-200 text-sky-800';
      default: return 'bg-slate-50/95 border-slate-200 text-slate-800';
    }
  }

  getIcon(type: string): string {
    switch (type) {
      case 'success': return 'check_circle';
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'info';
    }
  }
}
