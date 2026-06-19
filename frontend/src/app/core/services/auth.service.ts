import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { BehaviorSubject, Observable, of, tap } from 'rxjs'
import { catchError, mapTo } from 'rxjs/operators'
import { PublicUser, UserInput, UserUpdate } from '../../shared/interfaces/user'
import { environment } from '../../../environments/environment'

interface AuthResponse {
  user: PublicUser
  token: string
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = environment.apiUrl
  private tokenKey = 'token'
  private userKey = 'user'
  private authState = new BehaviorSubject<boolean>(!!this.getToken())

  isAuthenticated$ = this.authState.asObservable()

  constructor(private http: HttpClient) {}

  login(firstname: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.api}/auth/login`, { firstname, password }).pipe(
      tap(r => { this.setSession(r) })
    )
  }

  register(payload: UserInput): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.api}/auth/register`, payload).pipe(
      tap(r => { this.setSession(r) })
    )
  }

  updateProfile(userId: number | string, payload: UserUpdate): Observable<PublicUser> {
    return this.http.put<PublicUser>(`${this.api}/users/${userId}`, payload).pipe(
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

    return this.http.post(`${this.api}/auth/logout`, {}).pipe(
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
