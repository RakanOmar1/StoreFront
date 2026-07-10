import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { HttpHeaders } from '@angular/common/http'
import { Observable, catchError, throwError } from 'rxjs'
import { environment } from '../../../environments/environment'

@Injectable({ providedIn: 'root' })
export class ApiUrlService {
  private root = environment.apiUrl.replace(/\/$/, '')
  private prefix = environment.apiPrefix || ''

  constructor(private http: HttpClient) {}

  get<T>(path: string): Observable<T> {
    return this.withFallback<T>('get', path)
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.withFallback<T>('post', path, body)
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.withFallback<T>('put', path, body)
  }

  patch<T>(path: string, body: unknown): Observable<T> {
    return this.withFallback<T>('patch', path, body)
  }

  delete<T>(path: string): Observable<T> {
    return this.withFallback<T>('delete', path)
  }

  private withFallback<T>(method: 'get' | 'post' | 'put' | 'patch' | 'delete', path: string, body?: unknown): Observable<T> {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    const prefixedUrl = `${this.root}${this.prefix}${normalizedPath}`
    const rootUrl = `${this.root}${normalizedPath}`

    return this.request<T>(method, prefixedUrl, body).pipe(
      catchError(error => {
        if (error?.status === 404 && this.prefix) {
          return this.request<T>(method, rootUrl, body)
        }

        return throwError(() => error)
      })
    )
  }

  private request<T>(method: 'get' | 'post' | 'put' | 'patch' | 'delete', url: string, body?: unknown): Observable<T> {
    const token = localStorage.getItem('token')
    const options = token ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) } : undefined

    if (method === 'get') {
      return this.http.get<T>(url, options)
    }
    if (method === 'delete') {
      return this.http.delete<T>(url, options)
    }
    if (method === 'post') {
      return this.http.post<T>(url, body, options)
    }
    if (method === 'put') {
      return this.http.put<T>(url, body, options)
    }

    return this.http.patch<T>(url, body, options)
  }
}
