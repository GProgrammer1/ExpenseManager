class User {
    constructor(id, email, password, name, fcmTokens) {
        this.id = id;
        this.email = email;
        this.password = password;
        this.fcmTokens = fcmTokens;
        this.subscriptions = [];
        this.incomes = [];
        this.expenses = [];
        this.goals = [];
        this.budgets = [];
        this.payments = [];
        this.savings = 0;
        this.debtAmount = 0;
        this.city = '';
        this.ageRange = '';
        this.savingsGoal = 0;
        this.monthlyIncome = 0;
        this.country = '';
        this.fixedExpenses = [];
        this.variableExpenses = [];
        this.occupation = '';
        this.name = name;
    }
}

module.exports = User;