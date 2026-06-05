import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Check, X, CheckCircle2 } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "";

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const searchParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = searchParams.get("token") || "";
  const emailFromUrl = searchParams.get("email") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const validations = useMemo(() => {
    return {
      length: newPassword.length >= 8,
      uppercase: /[A-Z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
      special: /[^A-Za-z0-9]/.test(newPassword),
      match: newPassword === confirmPassword && newPassword.length > 0,
    };
  }, [newPassword, confirmPassword]);

  const isValid = Object.values(validations).every(Boolean);

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!tokenFromUrl) {
      setError("Reset token is missing.");
      return;
    }

    if (!isValid) {
      setError("Please meet all password requirements.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenFromUrl, newPassword }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Unable to reset password.");
        return;
      }

      toast({
        title: "Password updated",
        description: "Your password has been successfully reset.",
      });

      setIsSuccess(true);
    } catch {
      setError("An unexpected error occurred while resetting password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="flex items-center justify-center pt-32 pb-16 px-4">
        <div className="w-full max-w-md bg-gray-50 p-8 rounded-lg shadow-sm border">
          {isSuccess ? (
            <div className="text-center space-y-6">
              <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                  Password Reset Successfully!
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  You can now log in to your account with your new password.
                </p>
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  const returnToCheckout = localStorage.getItem("poptum-reset-return-to-checkout") === "true";
                  localStorage.removeItem("poptum-reset-return-to-checkout");
                  if (returnToCheckout) {
                    localStorage.setItem("poptum-open-checkout-auth-after-reset", "true");
                    navigate("/");
                  } else {
                    navigate(`/login?email=${encodeURIComponent(emailFromUrl)}`);
                  }
                }}
              >
                Go to Login
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                  Change your password
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  for <span className="font-semibold">{emailFromUrl || "your email"}</span>
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">New Password</label>
                  <Input
                    type="password"
                    required
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                  <Input
                    type="password"
                    required
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="space-y-2 py-2">
                  <ValidationItem isValid={validations.length} text="At least 8 characters" />
                  <ValidationItem isValid={validations.uppercase} text="At least 1 uppercase letter" />
                  <ValidationItem isValid={validations.number} text="At least 1 number" />
                  <ValidationItem isValid={validations.special} text="At least 1 special character" />
                  <ValidationItem isValid={validations.match} text="Passwords match" />
                </div>

                {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                <Button type="submit" className="w-full" disabled={loading || !isValid}>
                  {loading ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function ValidationItem({ isValid, text }: { isValid: boolean; text: string }) {
  return (
    <div className={`flex items-center space-x-2 text-sm ${isValid ? "text-green-600" : "text-gray-500"}`}>
      {isValid ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
      <span>{text}</span>
    </div>
  );
}
