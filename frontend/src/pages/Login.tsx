// Login.tsx - Clean + Safe Version
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Icons } from "@/components/icons";

declare global {
  interface Window {
    google?: any;
  }
}

// Helper: debounce with proper typing
function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [isGsiScriptLoaded, setIsGsiScriptLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const buttonParentRef = useRef<HTMLDivElement>(null);

  const apiUrl = import.meta.env.PROD
    ? "https://pokegridso.vercel.app" // We'll get this after deploying backend
    : "http://localhost:3000/api";
  // --- handleGoogleResponse declared BEFORE useEffect ---
  const handleGoogleResponse = useCallback(
    async (response: any) => {
      try {
        setLoading(true);
        setError(null);

        const jwtPayload = parseJwt(response.credential);
        const userData = {
          uid: jwtPayload.sub,
          email: jwtPayload.email,
          displayName: jwtPayload.name,
          picture: jwtPayload.picture,
        };

        if (!userData.uid || !userData.email) {
          throw new Error("Failed to extract user data from Google response");
        }

        const res = await fetch(`${apiUrl}/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user: userData }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(
            `HTTP ${res.status}: ${errorText || "Google authentication failed"}`
          );
        }

        const data = await res.json();
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        login();
        navigate("/game/daily");
      } catch (err) {
        console.error("Google auth error:", err);
        setError(
          err instanceof Error ? err.message : "Google authentication failed"
        );
      } finally {
        setLoading(false);
      }
    },
    [apiUrl, login, navigate]
  );

  // --- Google script + button render ---
  useEffect(() => {
    const renderGoogleButton = () => {
      if (!window.google?.accounts) {
        console.log("[GSI] google.accounts not ready");
        return;
      }

      const parent = buttonParentRef.current; // NEW ref for stable parent container
      if (!parent) {
        console.log("[GSI] parent not ready, retrying...");
        setTimeout(renderGoogleButton, 100);
        return;
      }

      const width = parent.offsetWidth;
      if (width === 0) {
        console.log("[GSI] parent width 0, retrying...");
        setTimeout(renderGoogleButton, 100);
        return;
      }

      const container = buttonContainerRef.current;
      if (!container) return;

      container.innerHTML = "";
      console.log("[GSI] Rendering Google button with locked width:", width);

      window.google.accounts.id.renderButton(container, {
        theme: "outline",
        size: "large",
        text: "signin_with",
        shape: "rectangular",
        width, // locked width from parent
      });
    };

    const handleResize = debounce(renderGoogleButton, 150);

    const initialize = () => {
      console.log("[GSI] initialize() called");

      if (!window.google?.accounts) {
        console.log("[GSI] google.accounts not available");
        return;
      }

      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) {
        console.error("[GSI] Missing VITE_GOOGLE_CLIENT_ID in .env");
        setError("Google Client ID is missing.");
        return;
      }

      console.log("[GSI] Initializing Google One Tap with clientId:", clientId);
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleResponse,
      });

      setIsGsiScriptLoaded(true);
      renderGoogleButton();
      window.addEventListener("resize", handleResize);
    };

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]'
    );

    if (existingScript) {
      console.log("[GSI] Script already in DOM → calling initialize()");
      initialize();
    } else {
      console.log("[GSI] Adding Google Sign-In script to DOM...");
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log("[GSI] Script loaded successfully");
        initialize();
      };
      script.onerror = () => {
        console.error("[GSI] Failed to load Google Sign-In script");
        setError("Failed to load Google Sign-In script.");
      };
      document.head.appendChild(script);
    }

    return () => {
      console.log("[GSI] Cleanup: removing resize listener");
      window.removeEventListener("resize", handleResize);
    };
  }, [handleGoogleResponse]);

  // --- JWT parser ---
  const parseJwt = (token: string) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch {
      return {};
    }
  };

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
            <div className="w-full h-[40px]">
              {!isGsiScriptLoaded || loading ? (
                <Button variant="outline" className="w-full" disabled>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  {loading ? "Signing in..." : "Loading Sign-In..."}
                </Button>
              ) : (
                <div ref={buttonParentRef} className="w-full">
                  <div
                    ref={buttonContainerRef}
                    id="google-signin-button-container"
                    className="w-full flex justify-center"
                  />
                </div>
              )}
            </div>

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
        <CardFooter className="flex flex-col text-center text-sm text-muted-foreground">
          <p>Sign in with Google to save your progress</p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
