import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBvE1SHjQEC_gzslhCd51EGvgI0zAwgsuc",
  authDomain: "study-plus-89936.firebaseapp.com",
  projectId: "study-plus-89936",
  storageBucket: "study-plus-89936.firebasestorage.app",
  messagingSenderId: "685590718796",
  appId: "1:685590718796:web:1499dc6a21c204ce7447e9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);