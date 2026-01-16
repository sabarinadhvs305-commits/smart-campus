import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, setDoc } from "firebase/firestore";
import {Link} from "react-router-dom";


function Signup() {
  

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student"); // student | admin
  const [loading, setLoading] = useState(false);

  // Save user in Firestore
  const saveUser = async (user, name, role) => {
    await setDoc(doc(db, "users", user.uid), {
      name: name,
      email: user.email,
      role: role,
    });
  };

  // Redirect based on role
  

  // Email & Password Signup
  const handleSignup = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    const result = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    await saveUser(result.user, name, role);

    // 🔁 REDIRECT TO MAIN DASHBOARD
   

  } catch (error) {
    console.error(error);
  }
  setLoading(false);
};


  // Google Signup
  const handleGoogleSignup = async () => {
  setLoading(true);
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);

    await saveUser(
      result.user,
      result.user.displayName,
      role
    );

    // 🔁 REDIRECT TO MAIN DASHBOARD
    

  } catch (error) {
    console.error(error);
  }
  setLoading(false);
};


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364]">
      <div className="backdrop-blur-xl bg-white/70 w-[380px] rounded-2xl shadow-xl border border-white/30 p-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-1">
          Smart Room Tracker
        </h2>
        <p className="text-center text-gray-600 mb-6">
          Sign up to continue
        </p>

        <form onSubmit={handleSignup} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            className="w-full px-4 py-2 bg-white/80 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-2 bg-white/80 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-2 bg-white/80 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {/* Role Selection (Clean & Minimal) */}
          <div className="grid grid-cols-2 gap-4">
            <div
              onClick={() => setRole("student")}
              className={`cursor-pointer rounded-lg border p-3 text-center transition
                ${
                  role === "student"
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-300 bg-white/70 hover:bg-gray-100"
                }`}
            >
              <h3 className="font-medium">Student</h3>
              <p className="text-xs text-gray-500 mt-1">
                View classrooms
              </p>
            </div>

            <div
              onClick={() => setRole("admin")}
              className={`cursor-pointer rounded-lg border p-3 text-center transition
                ${
                  role === "admin"
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-300 bg-white/70 hover:bg-gray-100"
                }`}
            >
              <h3 className="font-medium">Admin</h3>
              <p className="text-xs text-gray-500 mt-1">
                Manage classrooms
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="flex-grow h-px bg-gray-300"></div>
          <span className="text-gray-400 text-sm">OR</span>
          <div className="flex-grow h-px bg-gray-300"></div>
        </div>

        <button
          onClick={handleGoogleSignup}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 border py-2 rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
        >
          {/* Google Icon */}
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.22l6.84-6.84C35.9 1.86 30.47 0 24 0 14.6 0 6.51 5.38 2.56 13.22l7.98 6.19C12.47 13.13 17.77 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.5 24c0-1.64-.15-3.21-.43-4.74H24v9.02h12.7c-.55 2.98-2.23 5.5-4.73 7.18l7.48 5.8C43.91 36.76 46.5 30.9 46.5 24z"/>
            <path fill="#FBBC05" d="M10.53 28.41c-.48-1.44-.76-2.97-.76-4.41s.28-2.97.76-4.41l-7.98-6.19C.92 16.36 0 20.06 0 24s.92 7.64 2.55 10.6l7.98-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.14 15.9-5.81l-7.48-5.8c-2.08 1.39-4.75 2.21-8.42 2.21-6.23 0-11.53-3.63-13.47-8.91l-7.98 6.19C6.51 42.62 14.6 48 24 48z"/>
          </svg>

          <span className="font-medium">Sign in with Google</span>
        </button>
      </div>
    </div>
  );
}

export default Signup;