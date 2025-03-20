import { Timestamp } from "firebase/firestore";

export interface User {
    id: string;
    name: string;
    email: string;
    password: string;
    expenses: Expense[];
    incomes: Income[];
    budgets: Budget[];
    payments: Payment[];
    subscriptions: Subscription[];
    goals: Goal[];
    fcmTokens: string[];
    fixedExpenses: { category: string; amount: number }[];
    variableExpenses: { category: string; amount: number }[];
    savingsGoal: number | null;
    savings: number | null;
    monthlyIncome: number | null;
    country: string;
    ageRange: string;
    hasDebt: boolean;
    debtAmount?: number;
    city: string;
    occupation: string;
}

export interface Expense {
    id: string;
    type?: any;
    category: string;
    amount: number;
    date: Timestamp;
    description: string;
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
    category: string;
    amount: number;
    date: Timestamp;
    description: string;
    userId: string;
}

export interface Budget {
    id: string;
    shouldGlow?: boolean;
    spendings: { [key: string]: number };
    totalBudget: number;
    month: number;
    userId: string;
}

export interface Category {
    id: string;
    name: string;
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
    selected? : boolean;
    targetAmount: number;
    type: 'Expense' | 'Income';
    userId: string;
    description: string;
    name: string;
    deadline: Timestamp;
    priority: string;
    // advices?: string[];
}

export interface Note {
    id: string;
    title: string;
    content: string;
    userId: string;
    date: Timestamp;
}

export interface GoalAdvice {
    advice: string;
    goal: Goal;
    userId: string;
}