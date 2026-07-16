import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/lib/language-context";
import { Check, X } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "";

function ValidationItem({ isValid, text }: { isValid: boolean; text: string }) {
  return (
    <div className={`flex items-center space-x-2 text-xs ${isValid ? "text-green-600" : "text-gray-500"}`}>
      {isValid ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
      <span>{text}</span>
    </div>
  );
}

export default function Signup() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t, language } = useLanguage();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phone: "",
    country: "Germany",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const validations = useMemo(() => {
    return {
      length: formData.password.length >= 8,
      uppercase: /[A-Z]/.test(formData.password),
      number: /[0-9]/.test(formData.password),
      special: /[^A-Za-z0-9]/.test(formData.password),
      match: formData.password === formData.confirmPassword && formData.password.length > 0,
    };
  }, [formData.password, formData.confirmPassword]);

  const isValid = Object.values(validations).every(Boolean);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg(null);
  };

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    if (!isValid) {
      setErrorMsg("Please meet all password requirements.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast({
          title: "Account Created!",
          description: "You have successfully signed up. Please log in.",
        });
        navigate("/login");
      } else {
        setErrorMsg(data.message || "Could not create account");
      }
    } catch (error) {
      setErrorMsg("An unexpected error occurred while signing up.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="flex items-center justify-center pt-32 pb-16 px-4">
        <div className="w-full max-w-lg space-y-8 bg-gray-50 p-8 rounded-lg shadow-sm border">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              {t.auth.createAccount}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {t.auth.joinUs}
            </p>
          </div>

          <form onSubmit={handleSignup} className="mt-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">{t.auth.firstName}</label>
                <Input type="text" name="firstName" required value={formData.firstName} onChange={handleChange} className="mt-1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t.auth.lastName}</label>
                <Input type="text" name="lastName" required value={formData.lastName} onChange={handleChange} className="mt-1" />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">{t.auth.username}</label>
                <Input type="text" name="username" required value={formData.username} onChange={handleChange} className="mt-1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t.auth.email}</label>
                <Input type="email" name="email" required value={formData.email} onChange={handleChange} className="mt-1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t.auth.phone}</label>
                <Input type="tel" name="phone" required value={formData.phone} onChange={handleChange} className="mt-1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Country</label>
                <select
                  name="country"
                  required
                  value={formData.country}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="India">India</option>
                  <option value="Germany">Germany</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t.auth.password}</label>
                <Input type="password" name="password" required value={formData.password} onChange={handleChange} className="mt-1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t.auth.confirmPassword}</label>
                <Input type="password" name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange} className="mt-1" />
              </div>
              
              <div className="space-y-1.5 py-1">
                <ValidationItem isValid={validations.length} text="At least 8 characters" />
                <ValidationItem isValid={validations.uppercase} text="At least 1 uppercase letter" />
                <ValidationItem isValid={validations.number} text="At least 1 number" />
                <ValidationItem isValid={validations.special} text="At least 1 special character" />
                <ValidationItem isValid={validations.match} text="Passwords match" />
              </div>
            </div>

            {errorMsg && <p className="text-sm text-red-500 text-center font-medium">{errorMsg}</p>}

            <div className="text-xs text-gray-500 text-center leading-normal">
              {language === 'de' ? (
                <>
                  Mit der Registrierung stimmen Sie unseren{" "}
                  <a href="/terms-and-conditions" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
                    Allgemeinen Geschäftsbedingungen
                  </a>{" "}
                  zu und bestätigen die Kenntnisnahme unserer{" "}
                  <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
                    Datenschutzerklärung
                  </a>.
                </>
              ) : (
                <>
                  By creating an account, you agree to our{" "}
                  <a href="/terms-and-conditions" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
                    Terms & Conditions
                  </a>{" "}
                  and acknowledge our{" "}
                  <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
                    Privacy Policy
                  </a>.
                </>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading || !isValid}>
              {loading ? t.auth.creating : t.auth.createAccount}
            </Button>
            
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                {t.auth.alreadyHaveAccount}{" "}
                <button
                  type="button"
                  className="text-primary hover:underline font-semibold"
                  onClick={() => navigate("/login")}
                >
                  {t.auth.login}
                </button>
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
