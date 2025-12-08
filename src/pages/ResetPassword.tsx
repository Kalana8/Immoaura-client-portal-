import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { z } from "zod";

const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const ResetPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [isValidSession, setIsValidSession] = useState(false);
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // Check if we have a valid recovery token from the password reset link
    const checkRecoveryToken = async () => {
      try {
        // Check if we have hash fragments in the URL (from the reset link)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');

        if (accessToken && type === 'recovery') {
          // We have a valid recovery token in the URL
          // Supabase will automatically handle this when we call getSession()
          // Wait a moment for Supabase to process the hash fragments
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error("Session error:", error);
            setIsValidSession(false);
            setValidating(false);
            toast.error("Invalid or expired reset link. Please request a new password reset.", {
              style: {
                background: "#ef4444",
                color: "#ffffff",
                border: "1px solid #dc2626",
              },
              duration: 5000,
            });
            setTimeout(() => {
              navigate("/auth");
            }, 2000);
            return;
          }

          // If we have a session (which Supabase creates from the recovery token), we're good
          if (session) {
            setIsValidSession(true);
            setValidating(false);
          } else {
            // Try one more time after a longer delay
            setTimeout(async () => {
              const { data: { session: retrySession } } = await supabase.auth.getSession();
              if (retrySession) {
                setIsValidSession(true);
              } else {
                setIsValidSession(false);
                toast.error("Invalid or expired reset link. Please request a new password reset.", {
                  style: {
                    background: "#ef4444",
                    color: "#ffffff",
                    border: "1px solid #dc2626",
                  },
                  duration: 5000,
                });
                setTimeout(() => {
                  navigate("/auth");
                }, 2000);
              }
              setValidating(false);
            }, 1000);
          }
        } else {
          // No recovery token in URL
          setIsValidSession(false);
          setValidating(false);
          toast.error("Invalid or expired reset link. Please request a new password reset.", {
            style: {
              background: "#ef4444",
              color: "#ffffff",
              border: "1px solid #dc2626",
            },
            duration: 5000,
          });
          setTimeout(() => {
            navigate("/auth");
          }, 2000);
        }
      } catch (error) {
        console.error("Error checking recovery token:", error);
        setIsValidSession(false);
        setValidating(false);
        toast.error("An error occurred. Please try again.", {
          style: {
            background: "#ef4444",
            color: "#ffffff",
            border: "1px solid #dc2626",
          },
          duration: 4000,
        });
        setTimeout(() => {
          navigate("/auth");
        }, 2000);
      }
    };

    checkRecoveryToken();
  }, [navigate]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate the form
      const validated = resetPasswordSchema.parse({
        password,
        confirmPassword,
      });

      // Update the password using Supabase
      const { error } = await supabase.auth.updateUser({
        password: validated.password,
      });

      if (error) throw error;

      // Sign out the user after password reset (they'll need to sign in again)
      await supabase.auth.signOut();

      toast.success("Password reset successfully! Redirecting to login...", {
        style: {
          background: "#10b981",
          color: "#ffffff",
          border: "1px solid #059669",
        },
        duration: 3000,
      });

      // Clear the URL hash to remove the token
      window.history.replaceState(null, "", window.location.pathname);

      // Redirect to login page after a short delay
      setTimeout(() => {
        navigate("/auth");
      }, 1500);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message, {
          style: {
            background: "#ef4444",
            color: "#ffffff",
            border: "1px solid #dc2626",
          },
          duration: 4000,
        });
      } else {
        toast.error(error.message || "Failed to reset password", {
          style: {
            background: "#ef4444",
            color: "#ffffff",
            border: "1px solid #dc2626",
          },
          duration: 4000,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/30 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground">Validating reset link...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto flex items-center justify-center">
              <img
                src="/immoaura-logo.png"
                alt="Immoaura Logo"
                className="h-10 w-auto object-contain"
              />
            </div>
            <CardTitle className="text-2xl">Invalid Reset Link</CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired. Please request a new one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate("/auth")}
              className="w-full bg-[#243E8F] hover:bg-[#1E3268] text-white"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex items-center justify-center">
            <img
              src="/immoaura-logo.png"
              alt="Immoaura Logo"
              className="h-10 w-auto object-contain"
            />
          </div>
          <CardTitle className="text-2xl">Reset Your Password</CardTitle>
          <CardDescription>
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Password must be at least 6 characters long
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#243E8F] hover:bg-[#1E3268] text-white"
              disabled={loading}
            >
              {loading ? "Resetting Password..." : "Reset Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;

