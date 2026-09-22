import { Injectable } from '@angular/core'
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http'
import { Router } from '@angular/router'
import { Observable, throwError } from 'rxjs'
import { catchError } from 'rxjs/operators'
import { AuthService } from '../services/auth.service'

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.auth.getToken()
    if (!token) {
      return next.handle(req)
    }

    const cloned = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    return next.handle(cloned).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.auth.clearSession()
          if (!this.router.url.startsWith('/auth/login')) {
            void this.router.navigate(['/auth/login'], {
              queryParams: { reason: 'session-changed' }
            })
          }
        }
        return throwError(() => error)
      })
    )
  }
}
