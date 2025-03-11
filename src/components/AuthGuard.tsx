
import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

        // Check user role
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;

        if (data.role === requiredRole) {
          setAuthorized(true);
        } else {
          // Redirect to appropriate dashboard based on actual role
          if (data.role === 'shopkeeper') {
            setRedirectPath("/shop-dashboard");
            toast({
              title: "Access Denied",
              description: "You do not have permission to access this page.",
              variant: "destructive",
            });
          } else if (data.role === 'user') {
            setRedirectPath("/dashboard");
            toast({
              title: "Access Denied",
              description: "You do not have permission to access this page.",
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
        <p>Loading...</p>
      </div>
    );
  }

  return authorized ? <>{children}</> : <Navigate to={redirectPath} />;
};
