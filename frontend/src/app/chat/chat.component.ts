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
    const user = localStorage.getItem('username');
    this.socket = io('http://localhost:7000', {
           transports: ['websocket'], // ensures pure WS (optional, avoids polling)
     });
     this.socket.on('chatMessage', (msg: any) => {
       this.messages.push(msg); // instantly show new message
     });
  }

   users = ["meet","saurabh"]

   
   msg:any={
    user:'',
    text:''
   }
   message:any

   
   sendMessage(){
    console.log(this.message)
     this.socket.emit("user-message",{text:this.message,user:localStorage.getItem('user')});     
   }

   left(){
     this.router.navigate(['/'])
   }
}
