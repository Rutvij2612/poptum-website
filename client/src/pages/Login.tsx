import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { saveAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/lib/language-context";
const API = import.meta.env.VITE_API_URL || "";

export default function Login() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const initialEmail = searchParams.get("email");
    if (initialEmail) {
      setUsername(initialEmail);
    }
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
const res = await fetch(`${API}/api/auth/login`, {        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        saveAuth(data.token, data.role, data.username, data.country);
        
        toast({
          title: "Login Successful",
          description: `Welcome back, ${data.username}!`,
        });

        if (data.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      } else {
        toast({
          title: "Login Failed",
          description: data.message || "Invalid credentials",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred while logging in.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestPasswordReset(e: React.FormEvent) {
    e.preventDefault();
    setForgotMessage(null);
    setForgotLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/request-password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast({
          title: "Request failed",
          description: data.message || "Unable to process reset request.",
          variant: "destructive",
        });
        return;
      }

      setForgotMessage(data.message || "If an account exists, you'll receive an email shortly.");
      toast({
        title: "Check your email",
        description: data.message || "If an account exists, you'll receive an email shortly.",
      });
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred while requesting password reset.",
        variant: "destructive",
      });
    } finally {
      setForgotLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="flex items-center justify-center pt-32 pb-16 px-4">
        <div className="w-full max-w-md space-y-8 bg-gray-50 p-8 rounded-lg shadow-sm border">
          {!forgotOpen ? (
            <>
              <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                  {t.auth.welcomeBack}
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  {t.auth.loginToAccess}
                </p>
              </div>

              <form onSubmit={handleLogin} className="mt-8 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t.auth.username}
                    </label>
                    <Input
                      type="text"
                      required
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t.auth.password}
                    </label>
                    <Input
                      type="password"
                      required
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t.auth.loggingIn : t.auth.login}
                </Button>

                <div className="mt-4 text-center">
                  <button
                    type="button"
                    className="text-orange-500 hover:underline font-semibold"
                    onClick={() => {
                      setForgotOpen(true);
                      setForgotMessage(null);
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    {t.auth.noAccount}{" "}
                    <button
                      type="button"
                      className="text-primary hover:underline font-semibold"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate("/signup");
                      }}
                    >
                      {t.auth.createAccount}
                    </button>
                  </p>
                </div>
              </form>
            </>
          ) : (
            <>
              <div className="text-center">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                  Reset your password
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  Enter your email and we will send a secure reset link.
                </p>
              </div>

              <form onSubmit={handleRequestPasswordReset} className="mt-8 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <Input
                      type="email"
                      required
                      placeholder="Enter your email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={forgotLoading}>
                  {forgotLoading ? "Sending..." : "Send reset link"}
                </Button>

                {forgotMessage && (
                  <p className="text-sm text-gray-700 text-center">{forgotMessage}</p>
                )}

                <div className="text-center">
                  <button
                    type="button"
                    className="text-orange-500 hover:underline font-semibold"
                    onClick={() => {
                      setForgotOpen(false);
                      setForgotMessage(null);
                    }}
                  >
                    Back to login
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}