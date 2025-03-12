
import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: ReactNode;
  requiredRole?: "user" | "shopkeeper" | undefined;
  redirectTo?: string;
}

export const AuthGuard = ({ 
  children, 
  requiredRole, 
  redirectTo = "/login" 
}: AuthGuardProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [redirectPath, setRedirectPath] = useState(redirectTo);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setRedirectPath("/login");
          setAuthorized(false);
          setLoading(false);
          return;
        }

        // If we don't need a specific role, just authentication
        if (!requiredRole) {
          setAuthorized(true);
          setLoading(false);
          return;
        }

        // First check user metadata for role (faster)
        let userRole = session.user.user_metadata?.role;
        
        // If not in metadata, check the profiles table
        if (!userRole) {
          const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .maybeSingle(); // Using maybeSingle instead of single

          if (error) throw error;
          
          userRole = data?.role;
          
          // Update metadata for future use if we found a role
          if (userRole) {
            await supabase.auth.updateUser({
              data: { role: userRole }
            });
          }
        }

        if (userRole === requiredRole) {
          setAuthorized(true);
        } else {
          // Redirect to appropriate dashboard based on actual role
          if (userRole === 'shopkeeper') {
            setRedirectPath("/shop-dashboard");
            toast({
              title: "Access Denied",
              description: "Shopkeepers should use the shop dashboard.",
              variant: "destructive",
            });
          } else if (userRole === 'user') {
            setRedirectPath("/dashboard");
            toast({
              title: "Access Denied",
              description: "This area is for shopkeepers only.",
              variant: "destructive",
            });
          } else {
            setRedirectPath("/login");
          }
          setAuthorized(false);
        }
      } catch (error: any) {
        toast({
          title: "Authentication Error",
          description: error.message,
          variant: "destructive",
        });
        setAuthorized(false);
        setRedirectPath("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [requiredRole, toast, redirectTo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Verifying access...</p>
      </div>
    );
  }

  return authorized ? <>{children}</> : <Navigate to={redirectPath} />;
};
