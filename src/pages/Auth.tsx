import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Eye, EyeOff, User, Building } from "lucide-react";
import { z } from "zod";

// Validation schemas
const individualSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  streetName: z.string().min(1, "Street name is required"),
  streetNo: z.string().min(1, "Street number is required"),
  postBus: z.string().optional(),
  city: z.string().min(1, "City is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  repeatPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.repeatPassword, {
  message: "Passwords don't match",
  path: ["repeatPassword"],
});

const businessSchema = z.object({
  businessName: z.string().min(1, "Business name is required").max(200),
  btwNo: z.string().min(1, "BTW number is required"),
  businessEmail: z.string().email("Invalid email address"),
  businessPhone: z.string().min(1, "Phone number is required"),
  streetName: z.string().min(1, "Street name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  repeatPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.repeatPassword, {
  message: "Passwords don't match",
  path: ["repeatPassword"],
});

// Helper function to redirect based on user role
const redirectByRole = async (userId: string, navigate: any) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user role:", error);
      navigate("/dashboard");
      return;
    }

    if (data?.role === "admin") {
      navigate("/admin/dashboard");
    } else {
      navigate("/dashboard");
    }
  } catch (error) {
    console.error("Error in redirectByRole:", error);
    navigate("/dashboard");
  }
};

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [signupType, setSignupType] = useState<"individual" | "business">("individual");
  const [activeTab, setActiveTab] = useState<"signin" | "signup">(
    searchParams.get("tab") === "signup" ? "signup" : "signin"
  );

  // Sign in state
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  // Individual signup state
  const [individualData, setIndividualData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    streetName: "",
    streetNo: "",
    postBus: "",
    city: "",
    postalCode: "",
    username: "",
    password: "",
    repeatPassword: "",
  });
  const [individualTerms, setIndividualTerms] = useState(false);
  const [individualGdpr, setIndividualGdpr] = useState(false);
  const [showIndividualPassword, setShowIndividualPassword] = useState(false);
  const [showIndividualRepeatPassword, setShowIndividualRepeatPassword] = useState(false);

  // Business signup state
  const [businessData, setBusinessData] = useState({
    businessName: "",
    btwNo: "",
    businessEmail: "",
    businessPhone: "",
    streetName: "",
    address: "",
    city: "",
    postalCode: "",
    username: "",
    password: "",
    repeatPassword: "",
  });
  const [businessTerms, setBusinessTerms] = useState(false);
  const [businessGdpr, setBusinessGdpr] = useState(false);
  const [showBusinessPassword, setShowBusinessPassword] = useState(false);
  const [showBusinessRepeatPassword, setShowBusinessRepeatPassword] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        redirectByRole(session.user.id, navigate);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        redirectByRole(session.user.id, navigate);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Auto-fill username with email if username is empty and email changes
  useEffect(() => {
    if (!individualData.username && individualData.email) {
      setIndividualData({ ...individualData, username: individualData.email });
    }
  }, [individualData.email]);

  useEffect(() => {
    if (!businessData.username && businessData.businessEmail) {
      setBusinessData({ ...businessData, username: businessData.businessEmail });
    }
  }, [businessData.businessEmail]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: signInEmail,
        password: signInPassword,
      });

      if (error) throw error;

      if (data.session) {
        toast.success("Welcome back!", {
          style: {
            background: "#10b981",
            color: "#ffffff",
            border: "1px solid #059669",
          },
          duration: 3000,
        });
        // Let the onAuthStateChange hook handle the redirect
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in", {
        style: {
          background: "#ef4444",
          color: "#ffffff",
          border: "1px solid #dc2626",
        },
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!resetEmail) {
        toast.error("Please enter your email address", {
          style: {
            background: "#ef4444",
            color: "#ffffff",
            border: "1px solid #dc2626",
          },
          duration: 4000,
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      toast.success("Password reset email sent! Please check your inbox.", {
        style: {
          background: "#10b981",
          color: "#ffffff",
          border: "1px solid #059669",
        },
        duration: 4000,
      });

      setShowForgotPassword(false);
      setResetEmail("");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email", {
        style: {
          background: "#ef4444",
          color: "#ffffff",
          border: "1px solid #dc2626",
        },
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleIndividualSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!individualTerms || !individualGdpr) {
      toast.error("Please accept Terms & Conditions and GDPR consent", {
        style: {
          background: "#ef4444",
          color: "#ffffff",
          border: "1px solid #dc2626",
        },
        duration: 4000,
      });
      return;
    }

    setLoading(true);

    try {
      const validated = individualSchema.parse(individualData);

      const { data: signUpData, error } = await supabase.auth.signUp({
        email: validated.email,
        password: validated.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            account_type: "individual",
            first_name: validated.firstName,
            last_name: validated.lastName,
            phone: validated.phone,
            street_name: validated.streetName,
            street_no: validated.streetNo,
            post_bus: validated.postBus,
            city: validated.city,
            postal_code: validated.postalCode,
            username: validated.username,
          },
        },
      });

      if (error) throw error;

      // Create user record in users table with proper name
      if (signUpData.user) {
        const fullName = `${validated.firstName} ${validated.lastName}`.trim();
        const { error: userError } = await supabase
          .from("users")
          .insert({
            id: signUpData.user.id,
            email: validated.email,
            full_name: fullName,
            phone: validated.phone,
          });

        if (userError) {
          console.error("Error creating user record:", userError);
          // Don't fail signup if user record creation fails - it will be created on login
        }
      }

      toast.success("Account created! Please check your email to confirm.", {
        style: {
          background: "#10b981",
          color: "#ffffff",
          border: "1px solid #059669",
        },
        duration: 4000,
      });

      // Reset form
      setIndividualData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        streetName: "",
        streetNo: "",
        postBus: "",
        city: "",
        postalCode: "",
        username: "",
        password: "",
        repeatPassword: "",
      });
      setIndividualTerms(false);
      setIndividualGdpr(false);
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
        toast.error(error.message || "Failed to sign up", {
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

  const handleBusinessSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!businessTerms || !businessGdpr) {
      toast.error("Please accept Terms & Conditions and GDPR consent", {
        style: {
          background: "#ef4444",
          color: "#ffffff",
          border: "1px solid #dc2626",
        },
        duration: 4000,
      });
      return;
    }

    setLoading(true);

    try {
      const validated = businessSchema.parse(businessData);

      const { data: signUpData, error } = await supabase.auth.signUp({
        email: validated.businessEmail,
        password: validated.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            account_type: "business",
            business_name: validated.businessName,
            btw_no: validated.btwNo,
            business_phone: validated.businessPhone,
            street_name: validated.streetName,
            address: validated.address,
            city: validated.city,
            postal_code: validated.postalCode,
            username: validated.username,
          },
        },
      });

      if (error) throw error;

      // Create user record in users table with business name
      if (signUpData.user) {
        const { error: userError } = await supabase
          .from("users")
          .insert({
            id: signUpData.user.id,
            email: validated.businessEmail,
            business_name: validated.businessName,
            phone: validated.businessPhone,
            vat_number: validated.btwNo || null,
          });

        if (userError) {
          console.error("Error creating user record:", userError);
          // Don't fail signup if user record creation fails - it will be created on login
        }
      }

      toast.success("Business account created! Please check your email to confirm.", {
        style: {
          background: "#10b981",
          color: "#ffffff",
          border: "1px solid #059669",
        },
        duration: 4000,
      });

      // Reset form
      setBusinessData({
        businessName: "",
        btwNo: "",
        businessEmail: "",
        businessPhone: "",
        streetName: "",
        address: "",
        city: "",
        postalCode: "",
        username: "",
        password: "",
        repeatPassword: "",
      });
      setBusinessTerms(false);
      setBusinessGdpr(false);
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
        toast.error(error.message || "Failed to sign up", {
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

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      {/* Navigation Bar */}
      <nav className="border-b border-gray-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <img
                src="/logo.png"
                alt="Immoaura Logo"
                className="h-8 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>
        </div>
      </nav>

      {/* Auth Card */}
      <div className="flex-1 flex items-center justify-center bg-secondary/30 p-4">
        <Card className="w-full max-w-4xl">
          <CardHeader className="space-y-3 text-center">
            <CardTitle className="text-3xl">
              {activeTab === "signin" ? "Welcome Back" : "Create Your Account"}
            </CardTitle>
            <CardDescription>
              {activeTab === "signin"
                ? "Sign in to your Immoaura account to manage your orders"
                : "Join Immoaura to manage your real estate media orders"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as "signin" | "signup")}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50 h-9">
                <TabsTrigger
                  value="signin"
                  className="data-[state=active]:bg-[#243E8F] data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-sm py-1.5 px-3"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="data-[state=active]:bg-[#243E8F] data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-sm py-1.5 px-3"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>

              {/* Sign In Tab */}
              <TabsContent value="signin" className="mt-0">
                {!showForgotPassword ? (
                  <form onSubmit={handleSignIn} className="space-y-4 max-w-md mx-auto">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="your@email.com"
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="signin-password"
                          type={showSignInPassword ? "text" : "password"}
                          value={signInPassword}
                          onChange={(e) => setSignInPassword(e.target.value)}
                          required
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignInPassword(!showSignInPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showSignInPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-sm text-[#243E8F] hover:underline font-medium"
                        >
                          Forgot Password?
                        </button>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-[#243E8F] hover:bg-[#1E3268] text-white"
                      disabled={loading}
                    >
                      {loading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-4 max-w-md mx-auto">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">Email</Label>
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="your@email.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter your email address and we'll send you a link to reset your password.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setShowForgotPassword(false);
                          setResetEmail("");
                        }}
                        disabled={loading}
                      >
                        Back to Sign In
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 bg-[#243E8F] hover:bg-[#1E3268] text-white"
                        disabled={loading}
                      >
                        {loading ? "Sending..." : "Send Reset Link"}
                      </Button>
                    </div>
                  </form>
                )}
              </TabsContent>

              {/* Sign Up Tab */}
              <TabsContent value="signup" className="mt-0">
                <div className="space-y-4">
                  {/* Toggle between Individual and Business */}
                  <div className="flex gap-3 p-1 bg-muted/50 rounded-lg max-w-md mx-auto">
                    <button
                      type="button"
                      onClick={() => setSignupType("individual")}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-medium transition-all ${signupType === "individual"
                        ? "bg-[#243E8F] text-white shadow-md"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      <User className="h-4 w-4" />
                      Individual
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignupType("business")}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-medium transition-all ${signupType === "business"
                        ? "bg-[#243E8F] text-white shadow-md"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      <Building className="h-4 w-4" />
                      Business
                    </button>
                  </div>

                  {/* Individual Sign Up Form */}
                  {signupType === "individual" && (
                    <form onSubmit={handleIndividualSignUp} className="space-y-4 animate-fade-in">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name*</Label>
                          <Input
                            id="firstName"
                            type="text"
                            placeholder="John"
                            value={individualData.firstName}
                            onChange={(e) => setIndividualData({ ...individualData, firstName: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name*</Label>
                          <Input
                            id="lastName"
                            type="text"
                            placeholder="Doe"
                            value={individualData.lastName}
                            onChange={(e) => setIndividualData({ ...individualData, lastName: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email*</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="john@example.com"
                            value={individualData.email}
                            onChange={(e) => setIndividualData({ ...individualData, email: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone No*</Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+32 123 45 67 89"
                            value={individualData.phone}
                            onChange={(e) => setIndividualData({ ...individualData, phone: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="streetName">Street Name*</Label>
                          <Input
                            id="streetName"
                            type="text"
                            placeholder="Main Street"
                            value={individualData.streetName}
                            onChange={(e) => setIndividualData({ ...individualData, streetName: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="streetNo">No*</Label>
                          <Input
                            id="streetNo"
                            type="text"
                            placeholder="123"
                            value={individualData.streetNo}
                            onChange={(e) => setIndividualData({ ...individualData, streetNo: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="postBus">Post Bus (Optional)</Label>
                          <Input
                            id="postBus"
                            type="text"
                            placeholder="A"
                            value={individualData.postBus}
                            onChange={(e) => setIndividualData({ ...individualData, postBus: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="city">City*</Label>
                          <Input
                            id="city"
                            type="text"
                            placeholder="Brussels"
                            value={individualData.city}
                            onChange={(e) => setIndividualData({ ...individualData, city: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="postalCode">Postal Code*</Label>
                          <Input
                            id="postalCode"
                            type="text"
                            placeholder="1000"
                            value={individualData.postalCode}
                            onChange={(e) => setIndividualData({ ...individualData, postalCode: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="username">Username*</Label>
                        <Input
                          id="username"
                          type="text"
                          placeholder="Choose a username or use your email"
                          value={individualData.username}
                          onChange={(e) => setIndividualData({ ...individualData, username: e.target.value })}
                          required
                        />
                        <p className="text-xs text-muted-foreground">You can use your email or choose a custom username</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="password">Password*</Label>
                          <div className="relative">
                            <Input
                              id="password"
                              type={showIndividualPassword ? "text" : "password"}
                              value={individualData.password}
                              onChange={(e) => setIndividualData({ ...individualData, password: e.target.value })}
                              required
                              minLength={6}
                              className="pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowIndividualPassword(!showIndividualPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {showIndividualPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="repeatPassword">Repeat Password*</Label>
                          <div className="relative">
                            <Input
                              id="repeatPassword"
                              type={showIndividualRepeatPassword ? "text" : "password"}
                              value={individualData.repeatPassword}
                              onChange={(e) => setIndividualData({ ...individualData, repeatPassword: e.target.value })}
                              required
                              minLength={6}
                              className="pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowIndividualRepeatPassword(!showIndividualRepeatPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {showIndividualRepeatPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 pt-4 border-t">
                        <div className="flex items-start space-x-2">
                          <Checkbox
                            id="individualTerms"
                            checked={individualTerms}
                            onCheckedChange={(checked) => setIndividualTerms(checked as boolean)}
                          />
                          <label
                            htmlFor="individualTerms"
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            I accept the{" "}
                            <a href="https://immoaura.be/terms" target="_blank" rel="noopener noreferrer" className="text-[#243E8F] hover:underline font-medium">
                              Terms & Conditions
                            </a>
                          </label>
                        </div>
                        <div className="flex items-start space-x-2">
                          <Checkbox
                            id="individualGdpr"
                            checked={individualGdpr}
                            onCheckedChange={(checked) => setIndividualGdpr(checked as boolean)}
                          />
                          <label
                            htmlFor="individualGdpr"
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            I consent to the processing of my personal data as per{" "}
                            <a href="https://immoaura.be/gdpr" target="_blank" rel="noopener noreferrer" className="text-[#243E8F] hover:underline font-medium">
                              GDPR
                            </a>
                          </label>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-[#243E8F] hover:bg-[#1E3268] text-white"
                        disabled={loading || !individualTerms || !individualGdpr}
                      >
                        {loading ? "Creating Account..." : "Create Account"}
                      </Button>
                    </form>
                  )}

                  {/* Business Sign Up Form */}
                  {signupType === "business" && (
                    <form onSubmit={handleBusinessSignUp} className="space-y-4 animate-fade-in">
                      <div className="space-y-2">
                        <Label htmlFor="businessName">Business Name*</Label>
                        <Input
                          id="businessName"
                          type="text"
                          placeholder="Acme Real Estate Ltd."
                          value={businessData.businessName}
                          onChange={(e) => setBusinessData({ ...businessData, businessName: e.target.value })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="btwNo">BTW No*</Label>
                        <Input
                          id="btwNo"
                          type="text"
                          placeholder="BE0123456789"
                          value={businessData.btwNo}
                          onChange={(e) => setBusinessData({ ...businessData, btwNo: e.target.value })}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="businessEmail">Business Email*</Label>
                          <Input
                            id="businessEmail"
                            type="email"
                            placeholder="contact@acme.com"
                            value={businessData.businessEmail}
                            onChange={(e) => setBusinessData({ ...businessData, businessEmail: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="businessPhone">Business Phone Number*</Label>
                          <Input
                            id="businessPhone"
                            type="tel"
                            placeholder="+32 123 45 67 89"
                            value={businessData.businessPhone}
                            onChange={(e) => setBusinessData({ ...businessData, businessPhone: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="businessStreetName">Street Name*</Label>
                          <Input
                            id="businessStreetName"
                            type="text"
                            placeholder="Main Street"
                            value={businessData.streetName}
                            onChange={(e) => setBusinessData({ ...businessData, streetName: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="businessAddress">Address*</Label>
                          <Input
                            id="businessAddress"
                            type="text"
                            placeholder="123"
                            value={businessData.address}
                            onChange={(e) => setBusinessData({ ...businessData, address: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="businessCity">City*</Label>
                          <Input
                            id="businessCity"
                            type="text"
                            placeholder="Brussels"
                            value={businessData.city}
                            onChange={(e) => setBusinessData({ ...businessData, city: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="businessPostalCode">Postal Code*</Label>
                          <Input
                            id="businessPostalCode"
                            type="text"
                            placeholder="1000"
                            value={businessData.postalCode}
                            onChange={(e) => setBusinessData({ ...businessData, postalCode: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="businessUsername">Username*</Label>
                        <Input
                          id="businessUsername"
                          type="text"
                          placeholder="Choose a username or use your email"
                          value={businessData.username}
                          onChange={(e) => setBusinessData({ ...businessData, username: e.target.value })}
                          required
                        />
                        <p className="text-xs text-muted-foreground">You can use your email or choose a custom username</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="businessPassword">Password*</Label>
                          <div className="relative">
                            <Input
                              id="businessPassword"
                              type={showBusinessPassword ? "text" : "password"}
                              value={businessData.password}
                              onChange={(e) => setBusinessData({ ...businessData, password: e.target.value })}
                              required
                              minLength={6}
                              className="pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowBusinessPassword(!showBusinessPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {showBusinessPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="businessRepeatPassword">Repeat Password*</Label>
                          <div className="relative">
                            <Input
                              id="businessRepeatPassword"
                              type={showBusinessRepeatPassword ? "text" : "password"}
                              value={businessData.repeatPassword}
                              onChange={(e) => setBusinessData({ ...businessData, repeatPassword: e.target.value })}
                              required
                              minLength={6}
                              className="pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowBusinessRepeatPassword(!showBusinessRepeatPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {showBusinessRepeatPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 pt-4 border-t">
                        <div className="flex items-start space-x-2">
                          <Checkbox
                            id="businessTerms"
                            checked={businessTerms}
                            onCheckedChange={(checked) => setBusinessTerms(checked as boolean)}
                          />
                          <label
                            htmlFor="businessTerms"
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            I accept the{" "}
                            <a href="https://immoaura.be/terms" target="_blank" rel="noopener noreferrer" className="text-[#243E8F] hover:underline font-medium">
                              Terms & Conditions
                            </a>
                          </label>
                        </div>
                        <div className="flex items-start space-x-2">
                          <Checkbox
                            id="businessGdpr"
                            checked={businessGdpr}
                            onCheckedChange={(checked) => setBusinessGdpr(checked as boolean)}
                          />
                          <label
                            htmlFor="businessGdpr"
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            I consent to the processing of my business data as per{" "}
                            <a href="https://immoaura.be/gdpr" target="_blank" rel="noopener noreferrer" className="text-[#243E8F] hover:underline font-medium">
                              GDPR
                            </a>
                          </label>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-[#243E8F] hover:bg-[#1E3268] text-white"
                        disabled={loading || !businessTerms || !businessGdpr}
                      >
                        {loading ? "Creating Account..." : "Create Account"}
                      </Button>
                    </form>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            {activeTab === "signin" ? (
              <div className="text-center text-sm">
                <span className="text-muted-foreground">Don't have an account? </span>
                <button
                  type="button"
                  onClick={() => setActiveTab("signup")}
                  className="text-[#243E8F] hover:underline font-medium"
                >
                  Sign Up
                </button>
              </div>
            ) : (
              <div className="text-center text-sm">
                <span className="text-muted-foreground">Already have an account? </span>
                <button
                  type="button"
                  onClick={() => setActiveTab("signin")}
                  className="text-[#243E8F] hover:underline font-medium"
                >
                  Sign In
                </button>
              </div>
            )}
            {activeTab === "signup" && (
              <p className="text-center text-xs text-muted-foreground">
                By signing up, you agree to our Terms of Service and Privacy Policy
              </p>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
