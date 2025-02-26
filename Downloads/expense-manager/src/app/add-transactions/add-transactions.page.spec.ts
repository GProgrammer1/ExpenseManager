import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddTransactionsPage } from './add-transactions.page';

describe('AddTransactionsPage', () => {
  let component: AddTransactionsPage;
  let fixture: ComponentFixture<AddTransactionsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AddTransactionsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
