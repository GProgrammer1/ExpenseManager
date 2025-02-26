import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';
import { addTransactionsRoutes } from '../add-transactions/add-transactions.routes';

export const tabsRoutes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'transactions',
        loadComponent: () =>
          import('../transactions/transactions.page').then((m) => m.TransactionsPage),
      },
      {
        path: 'stats',
        loadComponent: () =>
          import('../Stats/stats.page').then((m) => m.StatsPage),
        children: [
          {
            path: 'expenses/:month',
            loadComponent: () =>
              import('../expenses-stats/expenses-stats.page').then((m) => m.ExpensesStatsPage),
          },
          {
            path: 'incomes/:month',
            loadComponent: () =>
              import('../incomes-stats/incomes-stats.page').then((m) => m.IncomesStatsPage),
          }]
      },
      {
        path: 'payments',
        loadComponent: () =>
          import('../Payments/payments.page').then((m) => m.PaymentPage),
      },
      {
        path: 'budget',
        loadComponent: () =>
          import('../budget/budget.page').then((m) => m.BudgetPage),
      },
      {
        path: '',
        redirectTo: '/tabs/transactions',
        pathMatch: 'full',
      },
     
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/tab1',
    pathMatch: 'full',
  },
  
];
