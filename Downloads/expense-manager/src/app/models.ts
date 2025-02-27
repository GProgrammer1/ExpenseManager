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
    Goals: Goal[];
    fcmTokens: string[];
    fixedExpenses: {category: string, amount: number}[];
    variableExpenses: {category: string, amount: number}[];
    savingsGoal: number | null;
    country:string;
    ageRange: string;
    hasDebt: boolean;

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

export interface Goal {
    type: 'Expense' | 'Income';
    userId: string;
    description: string;
    name: string;
    // deadline? : Timestamp;
    // advices?: string[];
}

export interface GoalAdvice {
    advice: string,
    goal: Goal,
    userId: string
}