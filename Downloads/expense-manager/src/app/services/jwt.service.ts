import { Injectable } from '@angular/core';
import * as jwtDecode from 'jwt-decode';
@Injectable({
  providedIn: 'root'
})
export class JwtService {

  constructor() { }

  getUID(token: string) {
    const decoded = jwtDecode.jwtDecode(token);
    return decoded.sub;
  }
}
