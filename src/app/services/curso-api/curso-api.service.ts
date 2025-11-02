import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {map, Observable} from 'rxjs';
import {ApiTipo, CasoDeUso} from '../../models/Models';
export interface ApiRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  body?: string; // aceita string manual (json, xml, etc)
  headers?: Record<string, string>; // headers extras
  apiType?: ApiTipo; // tipo de API: REST, SOAP, GRAPHQL
}

@Injectable({
  providedIn: 'root'
})
export class CursoApiService {

  constructor(private http: HttpClient) {

  }
  //private url_back_end = 'http://localhost:8080/';
   private url_back_end = 'https://cursos-api-7vr6.onrender.com/';

  call<T>(options: ApiRequestOptions): Observable<{statusCode: number, body: string}> {
    console.log("call options:", JSON.stringify(options));
    if (options.apiType === 'GRAPHQL') {
      const headers = new HttpHeaders({
        'Content-Type': 'application/graphql'
      });
      return this.http.post(this.url_back_end + 'graphql', { query: options.body }, { observe: 'response', headers }).pipe(
        map(response => ({
            statusCode: response.status,
            body: JSON.stringify(response.body)
          })
        )
      );
    } else if(options.apiType === 'SOAP'){
      const headers = new HttpHeaders({
        'Content-Type': 'text/xml'
      });
      return this.http.post(this.url_back_end + 'ws/cursos', options.body, {
        headers, responseType: 'text',
        observe: 'response'
      }).pipe(
        map(response => ({
          statusCode: response.status,
          body: response.body || ''
        }))
      );
    }
//rest

    return this.http.request<T>(options.method, this.url_back_end + options.url, {
      body: options.body,
      observe: 'response' as 'response',
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    }).pipe(
      map((response: any) => {
        return {
          statusCode: response.status,
          body: JSON.stringify(response.body)
        };
      })
    );
  }

}
