// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBdNfkt4zp-GwZlFL2R9eE1_VUBVzV3A7o",
  authDomain: "expense-manager-950ef.firebaseapp.com",
  projectId: "expense-manager-950ef",
  storageBucket: "expense-manager-950ef.firebasestorage.app",
  messagingSenderId: "917216977831",
  appId: "1:917216977831:web:cf7ee8c4f97e4abb3fcc82",
  measurementId: "G-6M9PMZ863T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const firestore = getFirestore(app);

export { app, analytics, firestore, firebaseConfig };