const express = require('express');
const paymentRouter = express.Router();
const { admin } = require('../admin'); // Ensure Firebase Admin SDK is initialized

const firestore = admin.firestore();
const verifyUser = require('../middlewares/verifyUser');
// Add Payment
paymentRouter.post('/addPayment', verifyUser, async (req, res) => {
    try {
        const { userId, ...paymentData } = req.body;
        if (!userId) return res.status(400).json({ error: "User ID is required" });

        const paymentsCollection = firestore.collection('payments');
        const paymentRef = paymentsCollection.doc();
        const payment = { ...paymentData ,id: paymentRef.id, userId, 
            dueDate: {
                seconds: paymentData.dueDate.seconds,
                nanoseconds: paymentData.dueDate.nanoseconds
            }
         };

        const batch = firestore.batch();
        batch.set(paymentRef, payment);

        const userRef = firestore.doc(`users/${userId}`);
        batch.update(userRef, { Payments: admin.firestore.FieldValue.arrayUnion(paymentRef) });

        await batch.commit();
        res.status(201).json({ message: 'Payment added successfully', payment });
    } catch (error) {
        console.error("🔥 Error adding payment:", error);
        res.status(500).json({ error: "Failed to add payment" });
    }
});

// Get Payments
paymentRouter.get('/:userId', verifyUser, async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) return res.status(400).json({ error: "User ID is required" });

        const paymentsCollection = firestore.collection('payments');
        const paymentsQuery = paymentsCollection.where('userId', '==', userId);
        const querySnapshot = await paymentsQuery.get();

        let payments = querySnapshot.docs.map(doc => doc.data());
        payments = payments.map(payment => {
            return {
                ...payment,
                dueDate: {
                    seconds: payment.dueDate.seconds,
                    nanoseconds: payment.dueDate.nanoseconds
                }
            };
        }
        );
        res.status(200).json(payments);
    } catch (error) {
        console.error("🔥 Error fetching payments:", error);
        res.status(500).json({ error: "Failed to retrieve payments" });
    }
});

// Delete Payment
paymentRouter.delete('/:paymentId',verifyUser,  async (req, res) => {
    try {
        const { paymentId } = req.params;
        const paymentRef = firestore.doc(`payments/${paymentId}`);
        const paymentDoc = await paymentRef.get();

        if (!paymentDoc.exists) {
            return res.status(404).json({ error: "Payment not found" });
        }

        const { userId } = paymentDoc.data();
        const batch = firestore.batch();
        batch.delete(paymentRef);

        const userRef = firestore.doc(`users/${userId}`);
        batch.update(userRef, { Payments: admin.firestore.FieldValue.arrayRemove(paymentRef) });

        await batch.commit();
        res.status(200).json({ message: "Payment deleted successfully" });
    } catch (error) {
        console.error("🔥 Error deleting payment:", error);
        res.status(500).json({ error: "Failed to delete payment" });
    }
});

module.exports = paymentRouter;
