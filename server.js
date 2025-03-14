const express = require('express');
const app = express();
const cors = require('cors');
const cron = require('node-cron');
const {checkPaymentsApproachingDeadline, deleteExpiredPayments, checkUpcomingSubscriptions, warnAboutMoneyShortage} = require('./admin')
const bodyParser = require('body-parser');

require('dotenv').config();
app.use(bodyParser.json());
app.use(cors());
app.use('/goals', require('./routers/goalRouter'));
app.use('/incomes', require('./routers/incomeRouter'));
app.use('/expenses', require('./routers/expenseRouter'));
app.use('/subscriptions', require('./routers/subscriptionRouter'));
app.use('/fcm', require('./routers/fcmRouter'));
app.use('/payments', require('./routers/paymentRouter'));
app.use('/users', require('./routers/authRouter'));
app.use('/budgets', require('./routers/budgetRouter'));
app.use('/categories', require('./routers/categoryRouter'));
app.use('/gemini', require('./routers/geminiRouter'));
app.listen(3000,'0.0.0.0', () => {
    console.log('Server is running on port 3000');
});
// minutes hours dayofthemonth month dayoftheweek
cron.schedule('40 19 * * *', () => {
    console.log('Checking for payments nearing the deadline...');
    checkPaymentsApproachingDeadline();
    deleteExpiredPayments();
    checkUpcomingSubscriptions();
    warnAboutMoneyShortage();
  });



//TODO: RESEARCH VIRTUALIZATION