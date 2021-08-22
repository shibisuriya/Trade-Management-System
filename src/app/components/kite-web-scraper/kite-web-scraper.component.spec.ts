import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KiteWebScraperComponent } from './kite-web-scraper.component';

describe('KiteWebScraperComponent', () => {
  let component: KiteWebScraperComponent;
  let fixture: ComponentFixture<KiteWebScraperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KiteWebScraperComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KiteWebScraperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
