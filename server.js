const express = require('express');
const app = express();
const cors = require('cors');
const cron = require('node-cron');
const {checkPaymentsApproachingDeadline, deleteExpiredPayments, checkUpcomingSubscriptions} = require('./admin')
const {sendNotification} = require('./admin')
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(cors());
app.listen(3000,'10.169.38.253', () => {
    console.log('Server is running on port 3000');
});
// minutes hours dayofthemonth month dayoftheweek
cron.schedule('56 19 * * *', () => {
    console.log('Checking for payments nearing the deadline...');
    checkPaymentsApproachingDeadline();
    deleteExpiredPayments();
    checkUpcomingSubscriptions();
  });

app.post('/send-notification', (req, res) => {
    const token = req.body.token;
    sendNotification('Welcome', 'This is your sign to start your day economically!', token);
    console.log('Notification sent');
    
    res.json({ message: 'Notification sent' });
});
