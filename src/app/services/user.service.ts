import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {BehaviorSubject, Observable, of, Subject} from 'rxjs';
import {catchError, tap} from 'rxjs/operators';
import {JwtResponse} from '../response/JwtResponse';
import {CookieService} from 'ngx-cookie-service';
import {User} from "../models/User";

@Injectable({
    providedIn: 'root'
})
export class UserService {

    private currentUserSubject: BehaviorSubject<JwtResponse>;
    public currentUser: Observable<JwtResponse>;
    public nameTerms = new Subject<string>();
    public name$ = this.nameTerms.asObservable();
    constructor(private http: HttpClient,
                private cookieService: CookieService) {
        const memo = localStorage.getItem('currentUser');
        this.currentUserSubject = new BehaviorSubject<JwtResponse>(JSON.parse(memo as any));
        this.currentUser = this.currentUserSubject.asObservable();
        cookieService.set('currentUser', memo as any);
    }

    get currentUserValue() {
        return this.currentUserSubject.value;
    }


    login(loginForm: { remembered: any; }): Observable<JwtResponse> {
        const url = `${environment.apiUrl}/login`;
        return this.http.post<JwtResponse>(url, loginForm).pipe(
            tap(user  => {
                if (user && user.token) {
                    this.cookieService.set('currentUser', JSON.stringify(user));
                    if (loginForm.remembered) {
                        localStorage.setItem('currentUser', JSON.stringify(user));
                    }
                    console.log((user.name));
                    this.nameTerms.next(user.name as any);
                    this.currentUserSubject.next(user);
                    return user;
                }else{ return user; }
            }),
            catchError(this.handleError('Login Failed', null as any))
        );
    }

    logout() {
        this.currentUserSubject.next(null as unknown as JwtResponse);
        localStorage.removeItem('currentUser');
        this.cookieService.delete('currentUser');
    }

    signUp(user: User): Observable<User> {
        const url = `${environment.apiUrl}/register`;
        return this.http.post<User>(url, user);
    }

    update(user: User): Observable<User> {
        const url = `${environment.apiUrl}/profile`;
        return this.http.put<User>(url, user);    }

    get(email: string): Observable<User> {
        const url = `${environment.apiUrl}/profile/${email}`;
        return this.http.get<User>(url);
    }

    /**
     * Handle Http operation that failed.
     * Let the app continue.
     * @param operation - name of the operation that failed
     * @param result - optional value to return as the observable result
     */
    private handleError<T>(operation = 'operation', result?: T) {
        return (error: any): Observable<T> => {

            console.log(error); // log to console instead

            // Let the app keep running by returning an empty result.
            return of(result as T);
        };
    }
}
