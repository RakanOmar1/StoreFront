import { Injectable } from '@angular/core'
import { BehaviorSubject, Observable, of, tap } from 'rxjs'
import { catchError, map, mapTo } from 'rxjs/operators'
import { PublicUser, UserInput, UserUpdate } from '../../shared/interfaces/user'
import { ApiUrlService } from './api-url.service'

interface AuthResponse {
  user: PublicUser
  token: string
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'token'
  private userKey = 'user'
  private authState = new BehaviorSubject<boolean>(!!this.getToken())

  isAuthenticated$ = this.authState.asObservable()

  constructor(private api: ApiUrlService) {}

  login(identifier: string, password: string, legacyFirstname?: string): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/login', {
      identifier: identifier.trim(),
      firstname: (legacyFirstname || identifier).trim(),
      email: identifier.trim(),
      phone: identifier.trim(),
      password
    }).pipe(
      tap(r => { this.setSession(r) })
    )
  }

  register(payload: UserInput): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/register', payload).pipe(
      tap(r => { this.setSession(r) })
    )
  }

  updateProfile(userId: number | string, payload: UserUpdate): Observable<PublicUser> {
    return this.api.put<PublicUser>(`/users/${userId}`, payload).pipe(
      map(user => ({ ...user, ...payload })),
      tap(user => {
        localStorage.setItem(this.userKey, JSON.stringify(user))
        this.authState.next(true)
      })
    )
  }

  setToken(token: string | null) {
    if (token) {
      localStorage.setItem(this.tokenKey, token)
      this.authState.next(true)
    } else {
      localStorage.removeItem(this.tokenKey)
      localStorage.removeItem(this.userKey)
      this.authState.next(false)
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey)
  }

  logout(): Observable<boolean> {
    const token = this.getToken()

    if (!token) {
      this.setToken(null)
      return of(true)
    }

    return this.api.post('/auth/logout', {}).pipe(
      mapTo(true),
      catchError(() => of(true)),
      tap(() => { this.setToken(null) })
    )
  }

  clearSession() {
    this.setToken(null)
  }

  getCurrentUser(): PublicUser | null {
    const storedUser = localStorage.getItem(this.userKey)

    if (storedUser) {
      try {
        return JSON.parse(storedUser)
      } catch {
        localStorage.removeItem(this.userKey)
      }
    }

    return this.getUserFromToken()
  }

  private setSession(response: AuthResponse) {
    this.setToken(response.token)
    localStorage.setItem(this.userKey, JSON.stringify(response.user))
  }

  private getUserFromToken(): PublicUser | null {
    const token = this.getToken()

    if (!token) {
      return null
    }

    try {
      const payload = JSON.parse(atob(this.toBase64(token.split('.')[1])))
      const user = payload.user as PublicUser | undefined

      if (user) {
        localStorage.setItem(this.userKey, JSON.stringify(user))
        return user
      }
    } catch {
      return null
    }

    return null
  }

  private toBase64(value: string): string {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
    const padding = normalized.length % 4

    return padding ? normalized + '='.repeat(4 - padding) : normalized
  }
}
