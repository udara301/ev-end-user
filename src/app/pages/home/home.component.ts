import { Component } from '@angular/core';
import { NetworkComponent } from '../../components/network/network.component';
import { VehiclesComponent } from '../../components/vehicles/vehicles.component';
import { HeroComponent } from '../../components/hero/hero.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [HeroComponent, VehiclesComponent, NetworkComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

}
