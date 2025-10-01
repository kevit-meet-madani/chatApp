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
     if(this.username !== "Meet" && this.username !== "Saurabh"){
      alert("Unauthorized!")
        return;
     }
     localStorage.setItem('user',this.username)
     this.router.navigate(['/chat'])
   }
}
