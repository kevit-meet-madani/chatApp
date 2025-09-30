import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { ChatComponent } from './chat/chat.component';

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
    path:'**',
    component:LoginComponent,
        pathMatch: 'full'
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
