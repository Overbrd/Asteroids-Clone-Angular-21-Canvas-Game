import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Asteroids } from './asteroids';

describe('Asteroids', () => {
  let component: Asteroids;
  let fixture: ComponentFixture<Asteroids>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Asteroids]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Asteroids);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
