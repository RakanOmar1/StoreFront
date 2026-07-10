import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { TranslationService } from '../../core/i18n/translation.service'

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="language-switcher"
      [attr.aria-label]="label"
      (click)="toggleLanguage()"
    >
      {{ currentLabel }}
    </button>
  `
})
export class LanguageSwitcherComponent {
  constructor(public translations: TranslationService) {}

  get currentLabel(): string {
    return this.translations.currentLanguage === 'ar' ? 'EN' : 'AR'
  }

  get label(): string {
    return this.translations.currentLanguage === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'
  }

  toggleLanguage(): void {
    this.translations.toggleLanguage()
  }
}
