import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AffiliateRewardsService, RedeemCard } from '../../../services/affiliate-rewards.service';

@Component({
  selector: 'app-affiliate-redeem-tab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './redeem-tab.component.html'
})
export class RedeemTabComponent {
  readonly points$ = this.rewardsService.points$;
  readonly redeemCards = this.rewardsService.redeemCards;

  resultMessage = '';
  resultOk = false;

  constructor(private readonly rewardsService: AffiliateRewardsService) {}

  redeem(card: RedeemCard): void {
    const result = this.rewardsService.redeem(card);
    this.resultMessage = result.message;
    this.resultOk = result.success;
  }
}
