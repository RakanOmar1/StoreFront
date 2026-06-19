import { ChangeDetectionStrategy, Component } from '@angular/core'

@Component({
  selector: 'app-product-hero',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="products-header">
      <div class="page-heading">
        <p class="eyebrow">Shoe store</p>
        <h1>Find your next pair</h1>
        <p class="muted">Shop running, lifestyle, and boots from the database.</p>
      </div>
    </div>
  `
})
export class ProductHeroComponent {}
