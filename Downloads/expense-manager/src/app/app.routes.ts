import { Routes } from '@angular/router';
import {tabsRoutes} from './tabs/tabs.routes';
import { addTransactionsRoutes } from './add-transactions/add-transactions.routes';
import { loginResolver } from './login.resolver';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    resolve: {
      isLoggedIn: loginResolver},
    loadComponent: () => import('./login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.page').then( m => m.RegisterPage)
  },
  
  tabsRoutes[0],
  addTransactionsRoutes[0],
  {
    path: 'budget',
    loadComponent: () => import('./budget/budget.page').then( m => m.BudgetPage)  
  },
  {
    path: 'add-payment',
    loadComponent: () => import('./add-payment/add-payment.page').then( m => m.AddPaymentPage)
  },
  {
    path: 'add-budget',
    loadComponent: () => import('./add-budget/add-budget.page').then( m => m.AddBudgetPage)
  },
  

 


];
