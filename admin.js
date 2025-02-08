const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert('./service-account.json'),
});

const firestore = admin.firestore();

async function checkPaymentsApproachingDeadline() {
  const now = admin.firestore.Timestamp.now();
  const twoDaysFromNow = new Date(now.toMillis() + (2 * 24 * 60 * 60 * 1000)); // 2 days from now

  try {
    const paymentsRef = firestore.collection('payments');
    console.log("paymentsRef:", paymentsRef);
    
    const snapshot = await paymentsRef
      .where('dueDate', '<=', admin.firestore.Timestamp.fromDate(twoDaysFromNow))
      .get(); //querysnapshot

    if (snapshot.empty) {
      console.log('No payments approaching deadline.');
      return;
    }

    if (snapshot.size > 1) {
      console.log(`Found ${snapshot.size} payments nearing the deadline.`);
    }

    let descriptions = [];
    let numOfNotifications = snapshot.size;

    // Use for loop instead of forEach
    let count = 0;
    let body = `Your payment for`;
    for (const doc of snapshot.docs) {
      const payment = doc.data();
      console.log("payment:", payment);
      
      console.log(`Payment ${payment['description']} is nearing the deadline.`);
      const userRef = firestore.collection('users').where('uid', '==', payment.userId);
      const userSnapshot = await userRef.get(); // Get the query snapshot

      console.log("userDoc:", userSnapshot);

      if (userSnapshot.empty) {
        console.log(`User with ID ${payment.userId} not found.`);
        continue;  // Use continue to skip this payment and move to next one
      }

      // Access the first document in the QuerySnapshot
      const userDoc = userSnapshot.docs[0];
      const userData = userDoc.data();
      console.log('User data:', userData);

      const fcmToken = userData.fcmToken;

      if (fcmToken) {
        // Send the notification
        const title = 'Payment Reminder';
        
        if (numOfNotifications === 1) {
          body = `Your payment for ${payment.description} is nearing the deadline. Please pay as soon as possible`;
          sendNotification(title, body, fcmToken);
          break;  // Stop after sending notification for 1 payment
        }
        if (count < 2) {
          console.log("payment.description:", payment.description);
          
          body += ` ${payment.description}, `;
          
        } else {
          body += ` and ${numOfNotifications - count} more payments are nearing the deadline. Please pay as soon as possible`;
          sendNotification(title, body, fcmToken);
          break;  // Stop after sending notification for 2 payments
        }

        count++;  // Increment count after processing each payment
      } else {
        console.log(`FCM token not found for user ${payment.userId}`);
      }
    }
  } catch (error) {
    console.error('Error checking payments:', error);
  }
}

// Set up cron job to run once a day at midnight
function sendNotification(title, body, fcmToken) {
  console.log('Sending notification...');
  
  const message = {
    notification: {
      title: title,
      body: body,
      
    },
    token: fcmToken,
  };

  // Send the notification using Firebase Cloud Messaging (FCM)
  admin.messaging().send(message)
    .then((response) => {
      console.log('Notification sent successfully:', response);
    })
    .catch((error) => {
      console.error('Error sending notification:', error);
    });
}

function deleteExpiredPayments() {
  const now = admin.firestore.Timestamp.now();

  const paymentsRef = firestore.collection('payments');
  const query = paymentsRef.where('dueDate', '<', now);

  query.get()
    .then((snapshot) => {
      if (snapshot.empty) {
        console.log('No expired payments found.');
        return;
      }

      if (snapshot.size > 1) {
        console.log(`Found ${snapshot.size} expired payments.`);
      }

      snapshot.forEach((doc) => {
        console.log('Deleting expired payment:', doc.id);
        doc.ref.delete();
      });
    })
    .catch((error) => {
      console.error('Error deleting expired payments:', error);
    });
}

module.exports = { checkPaymentsApproachingDeadline, sendNotification, deleteExpiredPayments };
