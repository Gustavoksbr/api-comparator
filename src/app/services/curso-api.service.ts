import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {map, Observable} from 'rxjs';
import {ApiTipo, CasoDeUso} from '../models/Models';
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
  // private url_back_end = 'http://localhost:8080/';
  private url_back_end = 'https://cursos-api-7vr6.onrender.com/';

  call<T>(options: ApiRequestOptions): Observable<{statusCode: number, body: string}> {
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
      observe: 'response',
      headers: { 'Content-Type': 'application/json' }
    }).pipe(
      map(response => ({
        statusCode: response.status,
        body: JSON.stringify(response.body)
      }))
    );
  }
getAllCursosHttp(): Observable<{statusCode: number, body: string}> {
  return this.http.get(this.url_back_end+"cursos", { observe: 'response' }).pipe(
    map(response => ({
      statusCode: response.status,
      body: JSON.stringify(response.body)
    }))
  );
}

getAllCursosGraphql(): Observable<{statusCode: number, body: string}> {
  const query = `
    query {
      listCursos {
        codigo
        titulo
        descricao
        cargaHoraria
      }
    }
  `;
  return this.http.post(this.url_back_end + 'graphql', { query },{ observe: 'response' }).pipe(
    map(response => ({
        statusCode : response.status,
        body: JSON.stringify(response)
      })
    )
  );
}

getAllCursosSoap(): Observable<{statusCode: number, body: string}> {
  const soapEnvelope = `
<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:cur="http://exemplo.com/cursos">
  <soap:Header/>
  <soap:Body>
    <cur:listCursosRequest/>
  </soap:Body>
</soap:Envelope>
    `.trim();
  const headers = new HttpHeaders({
    'Content-Type': 'text/xml'
  });
  return this.http.post(this.url_back_end + 'ws/cursos', soapEnvelope, { headers, responseType: 'text', observe: 'response' }).pipe(
    map(response => ({
      statusCode: response.status,
      body: response.body || ''
    }))
  );
  }

criarCurso(curso: any): Observable<string> {
  return this.http.post(this.url_back_end, curso).pipe(
    map(response => JSON.stringify(response))
  );
}
}
