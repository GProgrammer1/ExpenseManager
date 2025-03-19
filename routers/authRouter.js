const express = require('express');
const authRouter = express.Router();
const {admin} = require('../admin');
const firestore = admin.firestore();
const axios = require('axios');
const bcrypt = require('bcryptjs');
console.log("Proccess env firebase eky: ", process.env.FIREBASE_API_KEY);
const User = require('../models/User');

authRouter.post('/signup', async (req, res) => {
  const { email, password, fcmToken, name } = req.body;
  

  try {
    const userRecord = await admin.auth().createUser({ email, password });
    const userRef = firestore.collection('users').doc(userRecord.uid);
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User(userRecord.uid, email, hashedPassword, name, [fcmToken]);
    await userRef.set({ ...user });

    res.status(201).json({ message: 'User signed up successfully', user: userRecord });
  } catch (error) {
    console.error('Error during sign-up:', error);
    res.status(500).json({ error: error.message });
  }
});


authRouter.post('/signin', async (req, res) => {  
  const { email, password } = req.body;

  try {
    const user = await admin.auth().getUserByEmail(email);
    const actualPassword = user.customClaims.password;

    const isPasswordValid = await bcrypt.compare(password, actualPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    res.status(200).json({
      message: 'User signed in successfully',
     uid: user.uid,
    });
  } catch (error) {
    console.error('Error during sign-in:', error.response?.data || error.message);
    res.status(401).json({ error: 'Invalid email or password' });
  }
});


authRouter.put('/updateUserData/:uid', async (req, res) => {
  const { uid } = req.params;
  console.log("UID: ", uid);
  
  const data = req.body;
  try {
    const userRef = firestore.collection('users').doc(uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const updatedData = { ...userDoc.data(), ...data };
    await userRef.update(updatedData);
    res.status(200).json({ message: 'User data updated successfully', user: updatedData });
  } catch (error) {
    console.error('Error updating user data:', error);
    res.status(500).json({ error: error.message });
  }
});


authRouter.get('/:uid', async (req, res) => {
  const { uid } = req.params;  
  try {
    const userDoc = await firestore.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json( userDoc.data());
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: error.message});
  }
});


authRouter.get('/currentUser',  async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }
  res.status(200).json({ user: req.user });
} 
);

module.exports = authRouter;
