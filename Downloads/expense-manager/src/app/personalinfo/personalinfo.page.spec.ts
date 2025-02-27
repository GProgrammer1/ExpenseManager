import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PersonalinfoPage } from './personalinfo.page';

describe('PersonalinfoPage', () => {
  let component: PersonalinfoPage;
  let fixture: ComponentFixture<PersonalinfoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PersonalinfoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
