import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddIncomePage } from './add-income.page';

describe('AddIncomePage', () => {
  let component: AddIncomePage;
  let fixture: ComponentFixture<AddIncomePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AddIncomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
