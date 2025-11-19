import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      {/* Navigation Bar */}
      <nav className="border-b border-gray-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <img
                src="/immoaura-logo.png"
                alt="Immoaura Logo"
                className="h-8 w-auto object-contain"
              />
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/auth")}
                className="text-gray-700 dark:text-gray-300 hover:text-[#243E8F] dark:hover:text-[#5B7FD8]"
              >
                Sign In
              </Button>
              <Button
                onClick={() => navigate("/auth")}
                className="bg-[#243E8F] hover:bg-[#1E3268] text-white"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Centered */}
      <section className="flex-1 flex items-center justify-center relative overflow-hidden bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
            Professional Real Estate
            <span className="block text-[#243E8F] dark:text-[#5B7FD8] mt-2">
              Media Solutions
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed">
            Streamline your property marketing with professional videos, floor plans, and comprehensive order management. Built for real estate professionals who demand excellence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/auth?tab=signup")}
              className="bg-[#243E8F] hover:bg-[#1E3268] text-white px-8 py-6 text-base font-semibold shadow-lg hover:shadow-xl transition-shadow"
            >
              Start Your First Order
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/auth")}
              className="border-2 border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 px-8 py-6 text-base font-semibold hover:bg-transparent hover:text-gray-700 dark:hover:text-gray-300"
            >
              Sign In to Account
            </Button>
          </div>
        </div>

        {/* Subtle background pattern */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-40"></div>
        </div>
      </section>
    </div>
  );
};

export default Index;
