// AuthContext.tsx
import React, {
  createContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "../lib/firebase";

interface AuthContextType {
  isLoggedIn: boolean;
  currentUser: User | null;
  login: () => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // console.log("=== AuthProvider: Setting up auth listener ===");

    // Check localStorage first for immediate state
    const token = localStorage.getItem("authToken");
    if (token) {
      // console.log("Found auth token in localStorage");
      setIsLoggedIn(true);
    }

    // Listen for auth state changes from Firebase
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // console.log("=== AuthProvider: Auth state changed ===", user?.uid);
      // console.log("Previous isLoggedIn state:", isLoggedIn);

      if (user) {
        // User is signed in
        // console.log("User authenticated:", user.email);
        // console.log("Setting isLoggedIn to true");
        setIsLoggedIn(true);
        setCurrentUser(user);

        // Ensure localStorage is updated
        const userForStorage = {
          id: user.uid,
          username: user.displayName || user.email?.split("@")[0] || "User",
          email: user.email,
          isGuest: false,
          picture: user.photoURL,
        };

        localStorage.setItem("user", JSON.stringify(userForStorage));
        localStorage.setItem("authToken", "firebase-auth");
      } else {
        // User is signed out
        // console.log("User signed out");
        setIsLoggedIn(false);
        setCurrentUser(null);

        // Clear localStorage only if we're sure the user signed out
        // (not just during initial load)
        if (!loading) {
          localStorage.removeItem("user");
          localStorage.removeItem("authToken");
        }
      }

      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      // console.log("=== AuthProvider: Cleaning up auth listener ===");
      unsubscribe();
    };
  }, [loading]);

  const login = () => {
    // Login is handled by Firebase auth state listener
    // console.log("Login method called (handled by Firebase listener)");
  };

  const logout = async () => {
    try {
      // console.log("=== AuthProvider: Logging out ===");
      await signOut(auth);
      setIsLoggedIn(false);
      setCurrentUser(null);
      localStorage.removeItem("user");
      localStorage.removeItem("authToken");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const value = {
    isLoggedIn,
    currentUser,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
