
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
        console.log("DashboardRedirect: Checking authentication...");
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log("DashboardRedirect: No session found, redirecting to login");
          setRedirectPath("/login");
          setLoading(false);
          return;
        }

        console.log("DashboardRedirect: Session found:", session.user.id);
        
        // First check if role is in user metadata (faster)
        const userRole = session.user.user_metadata?.role;
        console.log("DashboardRedirect: Role from metadata:", userRole);
        
        if (userRole === 'shopkeeper' || userRole === 'user') {
          console.log(`DashboardRedirect: Using role from metadata: ${userRole}`);
          setRedirectPath(userRole === 'shopkeeper' ? "/shop-dashboard" : "/dashboard");
          setLoading(false);
          return;
        }

        console.log("DashboardRedirect: Checking user role from database");
        // Check user role in database as fallback
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error("DashboardRedirect: Error fetching user profile:", error);
          throw error;
        }

        console.log("DashboardRedirect: Database role:", data.role);
        
        // Redirect based on role
        if (data.role === 'shopkeeper') {
          console.log("DashboardRedirect: User is a shopkeeper, redirecting to shop dashboard");
          setRedirectPath("/shop-dashboard");
        } else {
          console.log("DashboardRedirect: User is a regular user, redirecting to user dashboard");
          setRedirectPath("/dashboard");
        }
      } catch (error: any) {
        console.error("DashboardRedirect: Authentication error:", error);
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

  console.log(`DashboardRedirect: Redirecting to: ${redirectPath}`);
  return <Navigate to={redirectPath} />;
};
