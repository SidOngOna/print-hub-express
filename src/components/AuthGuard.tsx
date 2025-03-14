
import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: ReactNode;
  requiredRole?: "user" | "shopkeeper" | "admin" | undefined;
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

        if (userRole === requiredRole || (requiredRole === 'user' && !userRole)) {
          setAuthorized(true);
        } else {
          // Redirect to appropriate dashboard based on actual role
          if (userRole === 'admin') {
            setRedirectPath("/admin-dashboard");
            toast({
              title: "Access Denied",
              description: `${requiredRole === 'user' ? 'User' : 'Shopkeeper'} access only. Redirecting to admin dashboard.`,
              variant: "destructive",
            });
          } else if (userRole === 'shopkeeper') {
            setRedirectPath("/shop-dashboard");
            toast({
              title: "Access Denied",
              description: `${requiredRole === 'user' ? 'User' : 'Admin'} access only. Redirecting to shop dashboard.`,
              variant: "destructive",
            });
          } else if (userRole === 'user') {
            setRedirectPath("/dashboard");
            toast({
              title: "Access Denied",
              description: `${requiredRole === 'shopkeeper' ? 'Shopkeeper' : 'Admin'} access only. Redirecting to user dashboard.`,
              variant: "destructive",
            });
          } else {
            setRedirectPath("/login");
          }
          setAuthorized(false);
        }
      } catch (error: any) {
        console.error("AuthGuard error:", error);
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
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg">Verifying access...</p>
      </div>
    );
  }

  return authorized ? <>{children}</> : <Navigate to={redirectPath} />;
};
