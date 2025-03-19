const admin = require('firebase-admin');

console.log("Initializing firebase app");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert('./service-account.json'),
  });
}

const firestore = admin.firestore();

async function checkPaymentsApproachingDeadline() {

  const now = admin.firestore.Timestamp.now();
  const twoDaysFromNow = new Date(now.toMillis() + 2 * 24 * 60 * 60 * 1000); // 2 days from now

  let messages = [];
  let title = "Payment Reminder";

  try {
    const usersSnapshot = await admin.firestore().collection("users").get();

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();

      if (!userData.payments || !Array.isArray(userData.payments) || userData.payments.length === 0) {
        continue;
      }

      const paymentDocs = await Promise.all(userData.payments.map((ref) => {
      
        return ref.get();
      }));

      if (paymentDocs.length === 0) {
        continue;
      }

      const approachingPayments = paymentDocs
        .map((doc) => doc.data())
        .filter((payment) => {
          const dueDate = new Date(payment.dueDate.seconds * 1000);
          return dueDate <= twoDaysFromNow;
        });

      if (approachingPayments.length === 0) continue; 

      let body = "Your payment for ";
      if (approachingPayments.length === 1) {
        body += `${approachingPayments[0].description} is approaching the deadline. Please pay as soon as possible.`;
      } else if (approachingPayments.length === 2) {
        body += approachingPayments
          .map((payment) => payment.description)
          .join(", ") + " are approaching the deadline. Please pay as soon as possible.";
      } else {
        body += approachingPayments
          .map((payment) => payment.description)
          .join(", ") + ` and ${approachingPayments.length - 2} others are approaching the deadline. Please pay as soon as possible.`;
      }

      if (!userData.fcmTokens || !Array.isArray(userData.fcmTokens) || userData.fcmTokens.length === 0) {
        continue;
      }
      const userId = userDoc.id;
      for (const token of userData.fcmTokens) {
        messages.push({
          userId,
          title,
          body,
          token, 
        });
        
      }
    }

    if (messages.length > 0) {
      await sendBatchNotifications(messages);
    } 
  } catch (error) {
    console.error("Error fetching payments:", error);
  }
}

async function sendBatchNotifications(messages) {
  try {
    const response = await Promise.allSettled(
      messages.map((msg) =>
        admin.messaging().send({
          notification: {
            title: msg.title,
            body: msg.body,
          },
          token: msg.token,
        })
      )
    );

    let tokensToRemove = [];
    response.forEach((result, index) => {
     
        console.error(`Failed to send notification ${index}:`, result.reason);
        if (
          result.reason.code === "messaging/invalid-registration-token" ||
          result.reason.code === "messaging/registration-token-not-registered"
        ) {
          tokensToRemove.push(messages[index].token);
        }
      
    } 
    );

    for (const token of tokensToRemove) {
      const snapshot =  await admin.firestore().collection("users").where('fcmTokens','array-contains',token).get();
      snapshot.forEach((doc) => {
        doc.ref.update({
          fcmTokens: admin.firestore.FieldValue.arrayRemove(token),
        });
      });
     
    }
    
  } catch (error) {
    
    console.error("Error sending notifications:", error);
  }
}


async function checkUpcomingSubscriptions() {

  const now = admin.firestore.Timestamp.now();
  const sevenDaysFromNow = new Date(now.toMillis() + 7 * 24 * 60 * 60 * 1000);

  let messages = [];
  let title = "Subscription Renewal Reminder";

  try {
    const usersSnapshot = await admin.firestore().collection("users").get();

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      
      if (!userData.subscriptions || !Array.isArray(userData.subscriptions) || userData.subscriptions.length === 0) {
        continue;
      }


      const subscriptionDocs = await Promise.all(userData.subscriptions.map((ref) => ref.get()));
      const approachingSubscriptions = 
      subscriptionDocs
        .map((subscription) => subscription.data())
        .filter((subscription) => {
          
          const currentDate = new Date();
          
          let nextRenewalDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), subscription.dayOfTheMonth);
          
          return nextRenewalDate <= sevenDaysFromNow;
        });
        
      if (approachingSubscriptions.length === 0) continue;

      let body = "Your subscription for ";
      if (approachingSubscriptions.length === 1) {
        body += `${approachingSubscriptions[0].name} is due on ${approachingSubscriptions[0].dayOfTheMonth} of this month. Please renew it soon.`;
      } else if (approachingSubscriptions.length === 2) {
        body += approachingSubscriptions.map((sub) => sub.name).join(", ") + " are nearing renewal. Please renew them on time.";
      } else {
        body += approachingSubscriptions.map((sub) => sub.name).join(", ") + ` and ${approachingSubscriptions.length-2} others are nearing renewal. Please renew them on time.`;
      }

      if (!userData.fcmTokens || !Array.isArray(userData.fcmTokens) || userData.fcmTokens.length === 0) {
        continue;
      }

      for (const token of userData.fcmTokens) {
        messages.push({ title, body, token });
      }
    }
      await sendBatchNotifications(messages);
   
  } catch (error) {
    console.error("Error checking subscriptions:", error);
  }
}


async function warnAboutMoneyShortage() {

  const now = admin.firestore.Timestamp.now().toDate();
  const endOfTheMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const userSnapshot = await firestore.collection('users').get();
  let messages = []; 
  let title = 'Low balance warning'
  for (const userDoc of userSnapshot.docs ) {
    const userData = userDoc.data();
    const id = userData.id;
    const fcmTokens = userData.fcmTokens;
    const [expenseSnapshot, incomeSnapshot, paymentSnapshot, subscriptionSnapshot] = await Promise.all([firestore.collection('expenses')
                                                                .where('userId','==', id)
                                                                .get(),
                                                                firestore.collection('incomes')
                                                                .where('userId','==', id)
                                                                .get(),
                                                                firestore.collection('payments')
                                                                .where('userId','==', id)
                                                                .get(),
                                                                firestore.collection('subscriptions')
                                                                .where('userId','==', id)
                                                                .get(),
                                                                ]);
  
  const totalExpenses =  expenseSnapshot.docs
                    .map((doc) => doc.data())
                    .filter((data) => new Date(data.date.seconds * 1000).getMonth() === new Date().getMonth())
                    .reduce((acc, data) => acc + (data.amount || 0), 0);

  const totalIncomes = incomeSnapshot.docs
                      .map((doc) => doc.data())
                      .filter((data) => new Date(data.date.seconds * 1000).getMonth() === new Date().getMonth())
                      .reduce((acc, data) => acc + (data.amount || 0), 0);

  const totalAmount = totalIncomes - totalExpenses;
  const totalPayments = paymentSnapshot.docs.map((doc) => {
    return doc.data();
  })
  .filter((data)=> new Date(data.dueDate.seconds * 1000) < endOfTheMonth)
  .reduce((acc, data) => acc + (data.amount || 0) , 0);
;
  
  const totalSubscriptions = subscriptionSnapshot.docs.map((doc) => doc.data())
  .filter((data)=> data.dayOfTheMonth > now.getDate())
  .reduce((acc, data) => acc + (data.amount || 0) , 0);

  const totalDue = totalPayments + totalSubscriptions;
  if (totalDue > totalAmount || totalAmount - totalDue < 300) {
    for (const fcmToken of fcmTokens) {
    messages.push({
      title,
      body: `You have ${totalDue}$ in upcoming payments this month and your balance is low.`,
      token: fcmToken
    });
  }
  }
  }
  await sendBatchNotifications(messages);
}

async function deleteExpiredPayments() {

  try {
  const now = admin.firestore.Timestamp.now();

  const paymentsRef = firestore.collection('payments');
  const paymentsSnapshot = await paymentsRef.get();
  const data = await Promise.all(paymentsSnapshot.docs.map((doc) => doc.data()));  
  const expiredPayments = data.filter((payment) => {
    const dueDate = new admin.firestore.Timestamp(payment.dueDate.seconds, payment.dueDate.nanoseconds);
    return dueDate < now;
  });

  const batch = firestore.batch();
  expiredPayments.forEach((payment) => {
    const paymentRef = paymentsRef.doc(payment.id);
    const userRef = firestore.collection('users').doc(payment.userId);
    batch.delete(paymentRef);
    batch.update(userRef, { payments: admin.firestore.FieldValue.arrayRemove(paymentRef) });
  });

  await batch.commit();
} catch (error) {
  console.error("Error deleting expired payments:", error);
}
}

module.exports = { 
  checkPaymentsApproachingDeadline, 
  checkUpcomingSubscriptions,  
  deleteExpiredPayments,
  warnAboutMoneyShortage,
  admin
};
