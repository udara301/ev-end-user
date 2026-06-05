import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AffiliateRewardsService } from '../../../services/affiliate-rewards.service';

@Component({
  selector: 'app-affiliate-points-tab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './points-tab.component.html'
})
export class PointsTabComponent {
  readonly points$ = this.rewardsService.points$;
  readonly activity$ = this.rewardsService.activity$;

  constructor(private readonly rewardsService: AffiliateRewardsService) {}
}
