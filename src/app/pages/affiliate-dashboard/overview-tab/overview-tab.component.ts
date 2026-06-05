import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AffiliateRewardsService } from '../../../services/affiliate-rewards.service';
import { map } from 'rxjs';

interface NextRedeemProgress {
  currentPoints: number;
  nextCardTitle: string;
  nextCardValueLkr: number;
  previousThreshold: number;
  nextThreshold: number;
  remainingPoints: number;
  progressPercent: number;
  isMaxTier: boolean;
}

@Component({
  selector: 'app-affiliate-overview-tab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './overview-tab.component.html'
})
export class OverviewTabComponent {
  readonly points$ = this.rewardsService.points$;
  readonly activity$ = this.rewardsService.activity$;
  readonly nextRedeemProgress$ = this.points$.pipe(
    map((points) => {
      const cards = [...this.rewardsService.redeemCards].sort((a, b) => a.pointsRequired - b.pointsRequired);
      const nextCard = cards.find((card) => points < card.pointsRequired);
      const previousCard = [...cards].reverse().find((card) => card.pointsRequired <= points);

      if (!nextCard) {
        const topCard = cards[cards.length - 1];
        return {
          currentPoints: points,
          nextCardTitle: topCard.title,
          nextCardValueLkr: topCard.valueLkr,
          previousThreshold: topCard.pointsRequired,
          nextThreshold: topCard.pointsRequired,
          remainingPoints: 0,
          progressPercent: 100,
          isMaxTier: true
        } as NextRedeemProgress;
      }

      const previousThreshold = previousCard?.pointsRequired ?? 0;
      const segmentSize = Math.max(nextCard.pointsRequired - previousThreshold, 1);
      const segmentProgress = Math.max(points - previousThreshold, 0);
      const progressPercent = Math.min(Math.round((segmentProgress / segmentSize) * 100), 100);

      return {
        currentPoints: points,
        nextCardTitle: nextCard.title,
        nextCardValueLkr: nextCard.valueLkr,
        previousThreshold,
        nextThreshold: nextCard.pointsRequired,
        remainingPoints: Math.max(nextCard.pointsRequired - points, 0),
        progressPercent,
        isMaxTier: false
      } as NextRedeemProgress;
    })
  );

  readonly monthlyReferrals = 42;
  readonly activeReferralCards = 8;
  readonly estimatedPayout = 18500;

  constructor(private readonly rewardsService: AffiliateRewardsService) {}
}
