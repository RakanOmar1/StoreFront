import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { TranslationService } from './core/i18n/translation.service'

@Component({
  selector: 'app-root',
  template: `
    <app-header></app-header>
    <main class="app-main">
      <router-outlet></router-outlet>
    </main>
  `
})
export class AppComponent implements OnInit {
  constructor(private router: Router, private translations: TranslationService) {}

  ngOnInit() {
    const legacyHashRoute = window.location.hash.startsWith('#/')
      ? window.location.hash.slice(1)
      : ''

    if (legacyHashRoute) {
      window.history.replaceState(null, '', legacyHashRoute)
      this.router.navigateByUrl(legacyHashRoute)
    }
  }
}
