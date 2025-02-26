import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IncomesStatsPage } from './incomes-stats.page';

describe('IncomesStatsPage', () => {
  let component: IncomesStatsPage;
  let fixture: ComponentFixture<IncomesStatsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(IncomesStatsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
