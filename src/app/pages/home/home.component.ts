import { Component } from '@angular/core';
import { NetworkComponent } from '../../components/network/network.component';
import { VehiclesComponent } from '../../components/vehicles/vehicles.component';
import { HeroComponent } from '../../components/hero/hero.component';
import { ExploreOptionsComponent } from '../../components/explore-options/explore-options.component';
import { HowItWorksComponent } from '../../components/how-it-works/how-it-works.component';
import { BlogSectionComponent } from '../../components/blog-section/blog-section.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [HeroComponent, VehiclesComponent, NetworkComponent, ExploreOptionsComponent, HowItWorksComponent, BlogSectionComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

}
