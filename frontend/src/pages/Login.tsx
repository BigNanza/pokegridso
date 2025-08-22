// Login.tsx - Simplified for Firebase-only approach
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Icons } from "@/components/icons";
import { useAuth } from "../contexts/useAuth";
import {
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  signInWithPopup,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date;
  lastLogin: Date;
}

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isLoggedIn, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect to daily game if already logged in
  useEffect(() => {
    if (isLoggedIn && !authLoading) {
      // console.log("User already logged in, redirecting to daily game");
      navigate("/game/daily");
    }
  }, [isLoggedIn, authLoading, navigate]);

  // Handle redirect result from Google OAuth
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        // console.log("=== Checking for redirect result ===");
        // console.log("Current URL:", window.location.href);
        // console.log("Auth domain:", import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);

        setLoading(true);

        const result = await getRedirectResult(auth);
        // console.log("Redirect result:", result);

        if (result?.user) {
          // console.log("User logged in via redirect - processing...");
          await handleUserLogin(result.user);
        } else {
          // console.log(
          //   "No redirect result found - user may have cancelled or this is initial page load"
          // );
        }
      } catch (err: unknown) {
        // console.error("Google auth redirect error:", err);
        if (err instanceof Error) {
          // console.error("Error details:", {
          //   name: err.name,
          //   message: err.message,
          //   stack: err.stack,
          // });
          setError(`Authentication failed: ${err.message}`);
        } else {
          setError("Google authentication failed");
        }
      } finally {
        setLoading(false);
      }
    };

    handleRedirectResult();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      // console.log("=== Starting Google sign in ===");
      setLoading(true);
      setError(null);

      const provider = new GoogleAuthProvider();
      provider.addScope("email");
      provider.addScope("profile");

      // Try popup first (better for development), fallback to redirect
      try {
        // console.log("Attempting popup authentication...");
        const result = await signInWithPopup(auth, provider);
        // console.log("Popup authentication successful:", result.user);

        // Handle the successful login immediately
        if (result.user) {
          await handleUserLogin(result.user);
        }
      } catch (popupError: any) {
        // console.log("Popup failed, trying redirect:", popupError.message);

        // If popup fails (blocked, etc.), fall back to redirect
        if (
          popupError.code === "auth/popup-blocked" ||
          popupError.code === "auth/popup-closed-by-user" ||
          popupError.code === "auth/cancelled-popup-request"
        ) {
          // console.log("Using redirect method instead...");
          await signInWithRedirect(auth, provider);
          // console.log("Redirect initiated");
        } else {
          throw popupError;
        }
      }
    } catch (err: unknown) {
      console.error("Google auth error:", err);
      if (err instanceof Error) {
        setError(err.message || "Google authentication failed");
      } else {
        setError("Google authentication failed");
      }
      setLoading(false);
    }
  };

  // Extract user login logic to reuse for both popup and redirect
  const handleUserLogin = async (user: any) => {
    try {
      // console.log("Processing user login:", {
      //   uid: user.uid,
      //   email: user.email,
      //   displayName: user.displayName,
      // });

      // Try to create/update user in Firestore (optional - don't fail login if this fails)
      try {
        const userDoc = doc(db, "users", user.uid);
        const userData: UserData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: new Date(),
          lastLogin: new Date(),
        };

        const userSnapshot = await getDoc(userDoc);
        if (userSnapshot.exists()) {
          // console.log("Existing user found, updating last login");
          await setDoc(userDoc, { lastLogin: new Date() }, { merge: true });
        } else {
          // console.log("New user, creating user document");
          await setDoc(userDoc, userData);
        }
        // console.log("Firestore user data saved successfully");
      } catch (firestoreError) {
        // console.warn(
        //   "Failed to save user data to Firestore (continuing anyway):",
        //   firestoreError
        // );
        // Don't fail the login process if Firestore fails
      }

      // Store user data in localStorage
      const userForStorage = {
        id: user.uid,
        username: user.displayName || user.email?.split("@")[0] || "User",
        email: user.email,
        isGuest: false,
        picture: user.photoURL,
      };

      localStorage.setItem("user", JSON.stringify(userForStorage));
      localStorage.setItem("authToken", "firebase-auth");

      // console.log("User login processed successfully");
      setLoading(false);

      // Navigate to daily game
      navigate("/game/daily");
    } catch (error) {
      console.error("Error processing user login:", error);
      setError("Failed to complete login process");
      setLoading(false);
    }
  };

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="flex items-center justify-center py-8">
            <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <Icons.Squirrel className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl text-center">PokeGridso</CardTitle>
          <CardDescription className="text-center">
            Sign in with Google to save your stats
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-4">
            <Button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full"
              variant="outline"
            >
              {loading ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  Redirecting to Google...
                </>
              ) : (
                <>
                  <Icons.Chrome className="mr-2 h-4 w-4" />
                  Sign in with Google
                </>
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              <p>
                Playing as a guest?{" "}
                <a href="/" className="text-primary hover:underline">
                  Continue without signing in
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
