import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyClWQCtIwXAkWunvWkjCK8Y3ZQgYSAgf34",
  authDomain: "kra-tognoek.firebaseapp.com",
  projectId: "kra-tognoek",
  storageBucket: "kra-tognoek.firebasestorage.app",
  messagingSenderId: "923609492556",
  appId: "1:923609492556:web:1dd521fb6b4dc131d258e9",
  measurementId: "G-WD8X7CYB4X"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;