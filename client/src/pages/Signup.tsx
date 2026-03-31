import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";

export default function Signup() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/signup", {
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
        toast({
          title: "Signup Failed",
          description: data.message || "Could not create account",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred while signing up.",
        variant: "destructive",
      });
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
              Create an account
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Join us to securely order and manage your profile
            </p>
          </div>

          <form onSubmit={handleSignup} className="mt-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <Input type="text" name="firstName" required value={formData.firstName} onChange={handleChange} className="mt-1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <Input type="text" name="lastName" required value={formData.lastName} onChange={handleChange} className="mt-1" />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <Input type="text" name="username" required value={formData.username} onChange={handleChange} className="mt-1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email address</label>
                <Input type="email" name="email" required value={formData.email} onChange={handleChange} className="mt-1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <Input type="tel" name="phone" required value={formData.phone} onChange={handleChange} className="mt-1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <Input type="password" name="password" required value={formData.password} onChange={handleChange} className="mt-1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                <Input type="password" name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange} className="mt-1" />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating Account..." : "Sign Up"}
            </Button>
            
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <button
                  type="button"
                  className="text-primary hover:underline font-semibold"
                  onClick={() => navigate("/login")}
                >
                  Log in
                </button>
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
