import { ChangeDetectionStrategy, Component } from '@angular/core'
import { TranslatePipe } from '../../core/i18n/translate.pipe'

@Component({
  selector: 'app-product-hero',
  standalone: true,
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="products-header">
      <div class="page-heading">
        <p class="eyebrow">{{ 'store.sportStore' | t }}</p>
        <h1>{{ 'store.heroTitle' | t }}</h1>
        <p class="muted">{{ 'store.heroSubtitle' | t }}</p>
      </div>
    </div>
  `
})
export class ProductHeroComponent {}
