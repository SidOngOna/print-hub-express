
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export const DashboardRedirect = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [redirectPath, setRedirectPath] = useState<string>("/login");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("Checking authentication...");
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log("No session found, redirecting to login");
          setRedirectPath("/login");
          setLoading(false);
          return;
        }

        console.log("Session found, checking user role");
        // Check user role
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error("Error fetching user profile:", error);
          throw error;
        }

        // Redirect based on role
        if (data.role === 'shopkeeper') {
          console.log("User is a shopkeeper, redirecting to shop dashboard");
          setRedirectPath("/shop-dashboard");
        } else {
          console.log("User is a regular user, redirecting to user dashboard");
          setRedirectPath("/dashboard");
        }
      } catch (error: any) {
        console.error("Authentication error:", error);
        toast({
          title: "Authentication Error",
          description: error.message,
          variant: "destructive",
        });
        setRedirectPath("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Redirecting to the right dashboard...</p>
      </div>
    );
  }

  console.log(`Redirecting to: ${redirectPath}`);
  return <Navigate to={redirectPath} />;
};
