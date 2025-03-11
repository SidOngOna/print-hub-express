
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
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setRedirectPath("/login");
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

        // Redirect based on role
        if (data.role === 'shopkeeper') {
          setRedirectPath("/shop-dashboard");
        } else {
          setRedirectPath("/dashboard");
        }
      } catch (error: any) {
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

  return <Navigate to={redirectPath} />;
};
