const express = require('express');
const incomeRouter = express.Router();
const {admin} = require('../admin'); 

const firestore = admin.firestore(); 
incomeRouter.post('/addIncome',  async (req, res) => {
    try {
        const { userId, ...incomeData } = req.body;
        console.log("Request body: ", req.body);
        
        if (!userId) return res.status(400).json({ error: "User ID is required" });

        const userDocRef = firestore.doc(`users/${userId}`);
        const incomeDocRef = firestore.collection('incomes').doc();
        const income = { ...incomeData, id: incomeDocRef.id, userId: userId,
            date :{
                seconds: incomeData.date.seconds,
                nanoseconds: incomeData.date.nanoseconds
            }
         };

         console.log("Income data: ", income);
         
        const batch = firestore.batch();
        batch.set(incomeDocRef, income);
        batch.update(userDocRef, { incomes: admin.firestore.FieldValue.arrayUnion(incomeDocRef) });

        await batch.commit();
        res.status(201).json({ message: 'Income added successfully', income });
    } catch (ex) {
        console.error("🔥 Error adding income:", ex);
        res.status(500).json({ error: "Failed to add income" });
    }
});

incomeRouter.delete('/:incomeId',  async (req, res) => {
    try {
        const { incomeId } = req.params;
        const incomeRef = firestore.doc(`incomes/${incomeId}`);
        const incomeDoc = await incomeRef.get();

        if (!incomeDoc.exists) {
            return res.status(404).json({ error: "Income not found" });
        }

        const { userId } = incomeDoc.data();
        const userRef = firestore.doc(`users/${userId}`);

        const batch = firestore.batch();
        batch.delete(incomeRef);
        batch.update(userRef, { incomes: admin.firestore.FieldValue.arrayRemove(incomeRef) });

        await batch.commit();
        res.status(200).json({ message: "Income deleted successfully" });
    } catch (ex) {
        console.error("🔥 Error deleting income:", ex);
        res.status(500).json({ error: "Failed to delete income" });
    }
});

incomeRouter.get('/incomeData/:uid/:month',  async (req, res) => {
    console.log("🔥 Fetching income data...");
    
    try {
        const { uid, month } = req.params;
        const incomesCollection = firestore.collection('incomes');
        const q = incomesCollection.where('userId', '==', uid);
        const incomesSnapshot = await q.get();

        const monthNum = parseInt(month);
        const incomes = incomesSnapshot.docs
            .map(doc => doc.data())
            .filter(income =>{ 
                const timestamp = new Date(income.date.seconds * 1000);
                return timestamp.getMonth()=== monthNum;
            });
            console.log("Incomes: ", incomes);
            
        if (incomes.length === 0) {
            return res.status(200).json({});
        }
        res.status(200).json(incomes);
    } catch (ex) {
        console.error("🔥 Error fetching income data:", ex);
        res.status(500).json({ error: "Failed to fetch income data" });
    }
});



incomeRouter.get('/all/:uid',  async (req, res) => {
    console.log("🔥 Fetching all incomes...");
    
    try {
        const { uid } = req.params;

        const incomesCollection = firestore.collection('incomes');
        const incomesQuery = incomesCollection.where('userId', '==', uid);
        const querySnapshot = await incomesQuery.get();

        let incomes = querySnapshot.docs.map(doc => doc.data());
        incomes= incomes.map((income) => {
            income = {...income, date: 
                {
                    seconds: income.date.seconds,
                    nanoseconds: income.date.nanoseconds
                }
            }
            return income;
        }
    );
        console.log("Incomes to be fetched");
        
        res.status(200).json(incomes);
    } catch (error) {
        console.error("🔥 Error fetching incomes:", error);
        res.status(500).json({ error: "Failed to retrieve incomes" });
    }
}
);

incomeRouter.get('/:uid/:month',  async (req, res) => {
    console.log("🔥 Fetching incomes...");
    try {
        const { uid, month } = req.params;
        const incomesCollection = firestore.collection('incomes');
        const q = incomesCollection.where('userId', '==', uid);
        const incomesSnapshot = await q.get();

        const monthNum = parseInt(month);
        let incomes = incomesSnapshot.docs
            .map(doc => doc.data())
            .filter(income => new admin.firestore.Timestamp(income.date.seconds, income.date.nanoseconds).toDate().getMonth()  === monthNum);
        incomes = incomes.map((income) => {
            income = {...income, date: 
                {
                    seconds: income.date.seconds,
                    nanoseconds: income.date.nanoseconds
                }
            }
            return income;
        }
        
        
    );
    console.log("Incomes: ", incomes);
        res.status(200).json(incomes);
    } catch (ex) {
        console.error("🔥 Error fetching incomes:", ex);
        res.status(500).json({ error: "Failed to fetch incomes" });
    }
});

module.exports = incomeRouter;
