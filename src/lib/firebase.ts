// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD7QSHYiqWMYwTAHD-fGONuZ1qqGBc9BSA",
  authDomain: "jarvis-comics.firebaseapp.com",
  projectId: "jarvis-comics",
  storageBucket: "jarvis-comics.firebasestorage.app",
  messagingSenderId: "499807777924",
  appId: "1:499807777924:web:fe87739092a971f9f0bed1",
  measurementId: "G-5YE38WGSMB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Initialize Analytics conditionally to avoid issues in SSR or non-browser environments
let analytics;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

export { app, analytics, auth, googleProvider };
