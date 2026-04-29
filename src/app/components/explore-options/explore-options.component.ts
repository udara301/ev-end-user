import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-explore-options',
  standalone: true,
  templateUrl: './explore-options.component.html',
  styleUrls: ['./explore-options.component.scss']
})
export class ExploreOptionsComponent {

  constructor(private router: Router) { }
  ngOnInit(): void {

  }
  planYourJourney() {
    // Logic to navigate to the Plan Journey page
    console.log('Navigating to Plan Journey page...');
    this.router.navigate(['/plan-journey']);
  }
}
