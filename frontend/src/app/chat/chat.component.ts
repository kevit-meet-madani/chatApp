import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html'
})
export class ChatComponent implements OnInit {

  socket!: Socket;
  messages: any[] = [];
  users: any[] = [];
  message: string = '';

  constructor(private router: Router, private http: HttpClient) {}
  room = localStorage.getItem('roomid');
  ngOnInit() {
    
    const username = localStorage.getItem('user');

    if (!this.room || !username) {
      this.router.navigate(['/']); 
      return;
    }

    
    this.http.get(`http://172.24.2.207:7000/chat/users/${this.room}`).subscribe({
      next: (response: any) => {
        this.users = response;
      },
      error: (err) => console.log(err)
    });

    this.getMessages();
    
    this.socket = io('http://172.24.2.207:7000', {
      transports: ['websocket']
    });

    
    this.socket.emit('newuser', { username, roomid: this.room });

    
    // this.socket.on('user-message', (msg: any) => {
    //   this.getMessages();
    // });

    this.socket.on("message", (res) => {
      this.messages.push(res);
    })
    
  }

  getMessages(){
      this.http.get(`http://172.24.2.207:7000/chat/messages/${this.room}`).subscribe({
      next: (response: any) => {
        this.messages = response;
      },
      error: (err) => console.log(err)
    });

    }

  sendMessage() {
    if (!this.message.trim()) return; // ignore empty messages

    const msg = {
      content: this.message,
      name: localStorage.getItem('user'),
      roomid: localStorage.getItem('roomid')
    };

    this.socket.emit('user-message', msg);
    this.getMessages();
    this.message = '';
  }

  left() {
    const username = localStorage.getItem('user');
    const room = localStorage.getItem('roomid');

    if (username && room) {
      this.socket.emit('leave-room', { username, room });
    }

    localStorage.removeItem('user');
    localStorage.removeItem('roomid');
    this.router.navigate(['/']);
  }
}
