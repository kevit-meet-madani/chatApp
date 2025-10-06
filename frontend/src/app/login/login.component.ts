import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { io } from 'socket.io-client';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent {

  constructor(private router:Router,private http:HttpClient) {}
   username!:string
   password!:string

   login(){

     const body = {
      name: this.username,
      password: this.password
     }
     this.http.post<any>("http://172.24.2.207:7000/chat/join",body).subscribe({
      next: (response) => {
         localStorage.setItem('user',this.username);
         localStorage.setItem('roomid',response[0].roomid)
         this.router.navigate(['/chat'])
      },

      error: (error) => {
        console.log(error);
        alert("Unauthorized!");
      }
     })
     
   }
}
