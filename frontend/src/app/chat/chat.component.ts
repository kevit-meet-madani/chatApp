import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { io } from 'socket.io-client';


@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent {

  constructor(private router:Router) {}

  socket!:any
  messages:any = []

  ngOnInit(){
    this.socket = io('http://172.24.2.207:7000', {
           transports: ['websocket'], // ensures pure WS (optional, avoids polling)
     });
     this.socket.on("connect", () => {
       const username = localStorage.getItem("user");
       if (username) {
          this.socket.emit("newuser", username);
       }
  });  
     this.socket.on('chatMessage', (msg: any) => {
       this.messages.push(msg); // instantly show new message
     });

    this.socket.on("onlineUsers", (users: string[]) => {
       this.users = users;
       console.log(users)
     });

  }

   users:any = []

   
   msg:any={
    user:'',
    text:''
   }
   message:any

   
   sendMessage(){
    console.log(this.message)
     this.socket.emit("user-message",{text:this.message,user:localStorage.getItem('user')});     
     this.message = ''
   }

   left(){
     this.socket.emit("left",localStorage.getItem('user'));
     localStorage.removeItem('user');
     this.router.navigate(['/'])
   }
}
