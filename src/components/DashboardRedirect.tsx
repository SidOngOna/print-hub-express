
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
        const userMetadata = session.user.user_metadata;
        let userRole = userMetadata?.role;
        console.log("DashboardRedirect: Role from metadata:", userRole);
        
        // If not found in metadata, check the database
        if (!userRole) {
          console.log("DashboardRedirect: Checking user role from database");
          const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .maybeSingle(); // Use maybeSingle instead of single to prevent errors

          if (error) {
            console.error("DashboardRedirect: Error fetching user profile:", error);
            throw error;
          }

          userRole = data?.role;
          console.log("DashboardRedirect: Database role:", userRole);
          
          // Update the metadata with the role from the database for future use
          if (userRole) {
            const { error: updateError } = await supabase.auth.updateUser({
              data: { role: userRole }
            });
            
            if (updateError) {
              console.error("DashboardRedirect: Error updating user metadata:", updateError);
            } else {
              console.log("DashboardRedirect: Updated user metadata with role:", userRole);
            }
          }
        }
        
        // Redirect based on role
        if (userRole === 'admin') {
          console.log("DashboardRedirect: User is an admin, redirecting to admin dashboard");
          setRedirectPath("/admin-dashboard");
        } else if (userRole === 'shopkeeper') {
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
          description: error.message || "Failed to verify your access",
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
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg">Redirecting to the right dashboard...</p>
      </div>
    );
  }

  console.log(`DashboardRedirect: Redirecting to: ${redirectPath}`);
  return <Navigate to={redirectPath} />;
};
