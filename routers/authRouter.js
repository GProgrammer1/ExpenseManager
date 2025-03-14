const express = require('express');
const authRouter = express.Router();
const {admin} = require('../admin'); // Ensure Firebase Admin SDK is initialized in 'admin.js'
const verifyUser = require('../middlewares/verifyUser');
const firestore = admin.firestore();
const axios = require('axios');

console.log("Proccess env firebase eky: ", process.env.FIREBASE_API_KEY);

/**
 * POST /signup
 * Creates a new user with email and password.
 */
authRouter.post('/signup', async (req, res) => {
  const { email, password, fcmToken } = req.body;
  

  try {
    const userRecord = await admin.auth().createUser({ email, password });
    const userRef = firestore.collection('users').doc(userRecord.uid);
    await userRef.set({Email: email, id: userRecord.uid, fcmTokens: [fcmToken]});

    res.status(201).json({ message: 'User signed up successfully', user: userRecord });
  } catch (error) {
    console.error('Error during sign-up:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /signin
 * Retrieves a user by email and generates a custom token.
 */
authRouter.post('/signin', async (req, res) => {
  console.log("Signin method reached");
  
  const { email, password } = req.body;

  try {
    // Send a request to Firebase's REST API to verify the user's credentials
    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
      {
        email,
        password,
        returnSecureToken: true,
      }
    );

    const { idToken, refreshToken, expiresIn } = response.data;

    // Respond with the ID token and other relevant information
    res.status(200).json({
      message: 'User signed in successfully',
      idToken,
      refreshToken,
      expiresIn,
    });
  } catch (error) {
    console.error('Error during sign-in:', error.response?.data || error.message);
    res.status(401).json({ error: 'Invalid email or password' });
  }
});

authRouter.post('/refreshToken', async (req, res) => {
  const { refreshToken } = req.body;

  try {
    // Send a request to Firebase's REST API to verify the user's credentials
    const response = await axios.post(
      `https://securetoken.googleapis.com/v1/token?key=${process.env.FIREBASE_API_KEY}`,
      {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }
    );

    const { idToken, refreshToken, expiresIn } = response.data;

    // Respond with the ID token and other relevant information
    res.status(200).json({
      message: 'Token refreshed successfully',
      idToken: idToken,
      refreshToken: refreshToken,
      expiresIn
    });
  } catch (error) {
    console.error('Error refreshing token:', error.response?.data || error.message);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
}
);


/**
 * POST /signout
 * Revokes the refresh tokens for a user (forces re-authentication).
 */
authRouter.post('/signout', async (req, res) => {
  const { uid } = req.body;
  try {
    await admin.auth().revokeRefreshTokens(uid);
    res.status(200).json({ message: 'User signed out successfully' });
  } catch (error) {
    console.error('Error during sign-out:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /updateUserData/:uid
 * Updates Firestore user documents matching the provided uid with new data.
 */
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

/**
 * GET /currentUser
 * Returns the current user.
 * (In a real application, you’d use middleware to verify an ID token and attach the user to req.)
 */
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


authRouter.get('/currentUser', verifyUser, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }
  res.status(200).json({ user: req.user });
} 
);

module.exports = authRouter;
