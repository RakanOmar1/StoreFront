import { Injectable } from '@angular/core'
import { CanDeactivate } from '@angular/router'
import { Observable } from 'rxjs'

export interface CanLeaveWithUnsavedChanges {
  hasUnsavedChanges(): boolean
  confirmDiscardChanges?: () => boolean | Promise<boolean> | Observable<boolean>
}

@Injectable({ providedIn: 'root' })
export class UnsavedChangesGuard implements CanDeactivate<CanLeaveWithUnsavedChanges> {
  canDeactivate(component: CanLeaveWithUnsavedChanges): boolean | Promise<boolean> | Observable<boolean> {
    if (!component.hasUnsavedChanges()) {
      return true
    }

    if (component.confirmDiscardChanges) {
      return component.confirmDiscardChanges()
    }

    return window.confirm('Discard unsaved changes?\n\nYou have changes that have not been saved.')
  }
}
