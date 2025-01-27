import { Routes } from '@angular/router';
import {tabsRoutes} from './tabs/tabs.routes';
export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.page').then( m => m.RegisterPage)
  },
  
  {
    path: 'add',
    loadComponent: () => import('./add/add.page').then( m => m.AddPage)
  },
 
  tabsRoutes[0],
  {
    path: 'budget',
    loadComponent: () => import('./budget/budget.page').then( m => m.BudgetPage)  
  },
  


];
