import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChargingNetworkComponent } from './charging-network.component';

describe('ChargingNetworkComponent', () => {
  let component: ChargingNetworkComponent;
  let fixture: ComponentFixture<ChargingNetworkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChargingNetworkComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChargingNetworkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
