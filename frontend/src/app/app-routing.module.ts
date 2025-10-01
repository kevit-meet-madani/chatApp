import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { ChatComponent } from './chat/chat.component';
import { TaskListsComponent } from './tasklist/tasklist.component';


const routes: Routes = [
  {
    path:'',
    component:LoginComponent,
    pathMatch: 'full'
  },
  {
    path:'chat',
    component:ChatComponent
  },
  {
     path:'tasks',
     component:TaskListsComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
