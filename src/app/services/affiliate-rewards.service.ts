import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface AffiliateCode {
  id: number;
  affiliate_id: number;
  code: string;
  label: string | null;
  discount_pct_per_charging: number;
  discount_pct_per_renting: number;
  max_uses_per_user: number;
  expiry_date: string;
  is_active: number;
  created_at: string;
}

export interface PointsActivity {
  id: string;
  description: string;
  points: number;
  date: string;
  type: 'earned' | 'redeemed';
}

export interface RedeemCard {
  id: string;
  title: string;
  valueLkr: number;
  pointsRequired: number;
  gradientClass: string;
}

@Injectable({ providedIn: 'root' })
export class AffiliateRewardsService {
  private readonly apiUrl = `${environment.apiUrl}/coupons`;
  private readonly pointsSubject = new BehaviorSubject<number>(450);
  private readonly activitySubject = new BehaviorSubject<PointsActivity[]>([
    {
      id: 'a1',
      description: 'Referral booking completed - TRV-8841',
      points: 1200,
      date: '2026-05-28T09:10:00Z',
      type: 'earned'
    },
    {
      id: 'a2',
      description: 'Referral booking completed - TRV-8831',
      points: 950,
      date: '2026-05-26T14:40:00Z',
      type: 'earned'
    },
    {
      id: 'a3',
      description: 'Redeemed card: Rs 2,500 card',
      points: -2500,
      date: '2026-05-22T11:00:00Z',
      type: 'redeemed'
    }
  ]);

  readonly redeemCards: RedeemCard[] = [
    { id: 'c1', title: 'Rs 1,000 Card', valueLkr: 1000, pointsRequired: 1000, gradientClass: 'from-sky-500 to-cyan-500' },
    { id: 'c2', title: 'Rs 2,500 Card', valueLkr: 2500, pointsRequired: 2500, gradientClass: 'from-emerald-500 to-green-500' },
    { id: 'c3', title: 'Rs 5,000 Card', valueLkr: 5000, pointsRequired: 5000, gradientClass: 'from-violet-500 to-fuchsia-500' },
    { id: 'c4', title: 'Rs 10,000 Card', valueLkr: 10000, pointsRequired: 10000, gradientClass: 'from-amber-500 to-orange-500' }
  ];

  readonly points$ = this.pointsSubject.asObservable();
  readonly activity$ = this.activitySubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  /**
   * Get all coupons for the logged-in affiliate from the API
   */
  getCodes(): Observable<AffiliateCode[]> {
    return this.http.get<AffiliateCode[]>(this.apiUrl).pipe(
      catchError((err) => {
        console.error('Error loading coupons:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Create a new coupon code
   */
  addCode(label?: string): Observable<{ message: string; coupon: AffiliateCode }> {
    const payload: any = {
      label: label?.trim() || null
    };

    return this.http.post<{ message: string; coupon: AffiliateCode }>(this.apiUrl, payload).pipe(
      catchError((err) => {
        console.error('Error creating coupon:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Deactivate a coupon
   */
  async deactivateCoupon(couponId: number): Promise<AffiliateCode> {
    const url = `${this.apiUrl}/${couponId}`;

    return new Promise((resolve, reject) => {
      this.http.patch<{ message: string; coupon: AffiliateCode }>(url, {})
        .pipe(
          catchError((err) => {
            console.error('Error deactivating coupon:', err);
            return throwError(() => err);
          })
        )
        .subscribe({
          next: (response) => resolve(response.coupon),
          error: (err) => reject(err)
        });
    });
  }

  redeem(card: RedeemCard): { success: boolean; message: string } {
    const points = this.pointsSubject.value;

    if (points < card.pointsRequired) {
      return {
        success: false,
        message: `Not enough points. You need ${card.pointsRequired - points} more points.`
      };
    }

    this.pointsSubject.next(points - card.pointsRequired);

    const tx: PointsActivity = {
      id: `r-${Date.now()}`,
      description: `Redeemed card: ${card.title}`,
      points: -card.pointsRequired,
      date: new Date().toISOString(),
      type: 'redeemed'
    };

    this.activitySubject.next([tx, ...this.activitySubject.value]);

    return {
      success: true,
      message: `${card.title} redeemed successfully.`
    };
  }
}
