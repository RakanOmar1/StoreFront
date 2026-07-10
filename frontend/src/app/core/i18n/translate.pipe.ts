import { ChangeDetectorRef, OnDestroy, Pipe, PipeTransform } from '@angular/core'
import { Subscription } from 'rxjs'
import { TranslationService } from './translation.service'

@Pipe({
  name: 't',
  standalone: true,
  pure: false
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  private sub: Subscription

  constructor(
    private translations: TranslationService,
    private cdr: ChangeDetectorRef
  ) {
    this.sub = this.translations.language$.subscribe(() => this.cdr.markForCheck())
  }

  transform(key: string, params: Record<string, string | number> = {}): string {
    return this.translations.translate(key, params)
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe()
  }
}
