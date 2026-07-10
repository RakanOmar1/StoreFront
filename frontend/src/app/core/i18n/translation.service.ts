import { DOCUMENT } from '@angular/common'
import { Inject, Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import { AppLanguage, supportedLanguages, translations, TranslationDictionary, TranslationValue } from './translations'

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private storageKey = 'language'
  private languageSubject = new BehaviorSubject<AppLanguage>(this.initialLanguage())

  language$ = this.languageSubject.asObservable()

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.applyDocumentLanguage(this.languageSubject.value)
  }

  get currentLanguage(): AppLanguage {
    return this.languageSubject.value
  }

  get direction(): 'ltr' | 'rtl' {
    return supportedLanguages.find(language => language.code === this.currentLanguage)?.dir || 'ltr'
  }

  setLanguage(language: AppLanguage): void {
    if (!translations[language]) {
      return
    }

    localStorage.setItem(this.storageKey, language)
    this.languageSubject.next(language)
    this.applyDocumentLanguage(language)
  }

  toggleLanguage(): void {
    this.setLanguage(this.currentLanguage === 'ar' ? 'en' : 'ar')
  }

  translate(key: string, params: Record<string, string | number> = {}): string {
    const value = this.lookup(translations[this.currentLanguage], key)
      ?? this.lookup(translations.en, key)
      ?? key

    if (typeof value !== 'string') {
      return key
    }

    return Object.entries(params).reduce(
      (text, [paramKey, paramValue]) => text.replace(new RegExp(`{{\\s*${paramKey}\\s*}}`, 'g'), String(paramValue)),
      value
    )
  }

  private initialLanguage(): AppLanguage {
    const stored = localStorage.getItem(this.storageKey) as AppLanguage | null
    if (stored && translations[stored]) {
      return stored
    }

    return navigator.language?.toLowerCase().startsWith('ar') ? 'ar' : 'en'
  }

  private applyDocumentLanguage(language: AppLanguage): void {
    const meta = supportedLanguages.find(item => item.code === language) || supportedLanguages[0]
    this.document.documentElement.lang = language
    this.document.documentElement.dir = meta.dir
    this.document.body.classList.toggle('is-rtl', meta.dir === 'rtl')
    this.document.body.classList.toggle('is-ltr', meta.dir === 'ltr')
  }

  private lookup(dictionary: TranslationDictionary, key: string): TranslationValue | undefined {
    return key.split('.').reduce<TranslationValue | undefined>((current, segment) => {
      if (!current || typeof current === 'string') {
        return undefined
      }

      return current[segment]
    }, dictionary)
  }
}
