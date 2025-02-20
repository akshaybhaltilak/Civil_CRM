import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database"; // Import Realtime Database

const firebaseConfig = {
  apiKey: "AIzaSyC1w8bCn1j4gOBecLQ7GRXYd8BljZNlf3I",
  authDomain: "civilcrm-869a3.firebaseapp.com",
  databaseURL: "https://civilcrm-869a3-default-rtdb.firebaseio.com/", // ✅ Added Realtime Database URL
  projectId: "civilcrm-869a3",
  storageBucket: "civilcrm-869a3.appspot.com", // Fixed incorrect storage bucket URL
  messagingSenderId: "739329889637",
  appId: "1:739329889637:web:2690c3cbaac2d66084bd8c",
  measurementId: "G-Y94QWR1GGL",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const realtimeDb = getDatabase(app); // ✅ Initialize Realtime Database

export { db, realtimeDb }; // ✅ Export both Firestore & Realtime Database
