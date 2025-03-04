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
    Subscriptions: Subscription[];
    Goals: Goal[];
    fcmTokens: string[];
    fixedExpenses: {category: string, amount: number}[];
    variableExpenses: {category: string, amount: number}[];
    savingsGoal: number | null;
    savings: number | null;
    monthlyIncome: number|null;
    country:string;
    ageRange: string;
    hasDebt: boolean;
    debtAmount?: number;
    city: string;
    occupation: string;
}

export interface Expense {
    id: string;
type?: any;
    Category: string;
    Amount: number;
    Date: Timestamp;
    Description: string;
    userId: string;
}

export interface Subscription {
    id: string;

    userId: string;
    amount: number;
    name: string;
    dayOfTheMonth: number;
}


export interface Income {
    id: string;

type?: any;
    Category: string;
    Amount: number;
    Date: Timestamp;
    Description: string;
    userId: string;
}

export interface Budget {
    id: string;

    spendings: {[key:string]: number};
    totalBudget: number;
    month: number;
    userId: string;
}

export interface Category {
    id: string;

    Name: string;
    icon?: string;
}

export interface Payment {
    id: string;

    amount: number;
    dueDate: Timestamp;
    description: string;
    userId: string;
}

export interface Goal {
    id: string;
    targetAmount: number;
    progress: number;
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