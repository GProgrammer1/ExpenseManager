import { Timestamp } from "firebase/firestore";

export interface User {
    uid: string;
    Name: string;
    Email: string;
    Password: string;
    Expenses: Expense[];
    Incomes: Income[];
    Budgets: Budget[];
    Payments: Payment[];
    fcmTokens: string[];
}

export interface Expense {
type?: any;
    Category: string;
    Amount: number;
    Date: Timestamp;
    Description: string;
    userId: string;
}

export interface Subscription {
    userId: string;
    amount: number;
    name: string;
    dayOfTheMonth: number;
}


export interface Income {
type?: any;
    Category: string;
    Amount: number;
    Date: Timestamp;
    Description: string;
    userId: string;
}

export interface Budget {
    spendings: {[key:string]: number};
    totalBudget: number;
    month: number;
    userId: string;
}

export interface Category {
    name: string;
    icon?: string;
}

export interface Payment {
    amount: number;
    dueDate: Timestamp;
    description: string;
    userId: string;
}