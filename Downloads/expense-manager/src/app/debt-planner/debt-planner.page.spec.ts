import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebtPlannerPage } from './debt-planner.page';

describe('DebtPlannerPage', () => {
  let component: DebtPlannerPage;
  let fixture: ComponentFixture<DebtPlannerPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DebtPlannerPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
