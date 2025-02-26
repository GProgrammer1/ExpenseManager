import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExpensesStatsPage } from './expenses-stats.page';

describe('ExpensesStatsPage', () => {
  let component: ExpensesStatsPage;
  let fixture: ComponentFixture<ExpensesStatsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ExpensesStatsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
