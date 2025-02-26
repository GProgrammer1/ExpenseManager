import { Routes } from "@angular/router";
import { AddTransactionsPage } from "./add-transactions.page";
import { AddIncomePage } from "../add-income/add-income.page";
import { AddExpensePage } from "../add-expense/add-expense.page";

export const addTransactionsRoutes : Routes = [
    
    {
        path: 'add-transactions',
        component: AddTransactionsPage,
        children: [
            {
                path: 'expense',
                component: AddExpensePage
            },
            {
                path: 'income',
                component: AddIncomePage
            },
            {
                path: '',  // Redirect to 'expense' as default
                redirectTo: 'expense',
                pathMatch: 'full'
              }
        ],
    }
];