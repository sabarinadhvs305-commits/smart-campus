import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDN9A6kssRRKLW97bQ4CLRlnaY28MWWZyQ",
  authDomain: "smart-room-tracker.firebaseapp.com",
  projectId: "smart-room-tracker",
  storageBucket: "smart-room-tracker.appspot.com",
  messagingSenderId: "831159044172",
  appId: "1:831159044172:web:5a3a3657fc10c986bb4ce9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);