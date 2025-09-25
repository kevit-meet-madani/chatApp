import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { io } from 'socket.io-client';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  constructor(private router:Router) {}
   username!:string

   login(){
     localStorage.setItem('user',this.username)
     this.router.navigate(['/chat'])
   }
}
