const express = require('express');
const app = express();
const cors = require('cors');
const cron = require('node-cron');
const {checkPaymentsApproachingDeadline, deleteExpiredPayments} = require('./admin')
const {sendNotification} = require('./admin')
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(cors());
app.listen(3000,'10.169.39.9', () => {
    console.log('Server is running on port 3000');
});
// minutes hours dayofthemonth month dayoftheweek
cron.schedule('8 16 * * *', () => {
    console.log('Checking for payments nearing the deadline...');
    checkPaymentsApproachingDeadline();
    deleteExpiredPayments();
  });

app.post('/send-notification', (req, res) => {
    const token = req.body.token;
    sendNotification('Hello', 'This is a test notification', token);
    console.log('Notification sent');
    
    res.json({ message: 'Notification sent' });
});
