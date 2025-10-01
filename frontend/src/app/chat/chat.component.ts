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

  ngOnInit() {
  // Initialize messages array safely
  this.messages = [];

  this.socket = io('http://localhost:7000', {
    transports: ['websocket'],
    reconnectionAttempts: 3, // limit retries
    timeout: 5000
  });

  // On successful connection
  this.socket.on("connect", () => {
    console.log("Socket connected:", this.socket.id);

    const username = localStorage.getItem("user");
    if (username) {
      this.socket.emit("newuser", username);
    }
  });

  // On receiving a new chat message
  this.socket.on('chatMessage', (msg: any) => {
    if (msg) this.messages.push(msg); // instantly show new message
  });

  // On receiving online users list
  this.socket.on("onlineUsers", (users: string[]) => {
    if (Array.isArray(users)) this.users = users;
    console.log("Online users:", users);
  });

  // On receiving all previous messages
  this.socket.on("msgs", (msgs: any) => {
    if (Array.isArray(msgs)) this.messages = msgs;
  });

  // Optional: handle connection errors
  
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
