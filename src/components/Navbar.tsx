
import { Button } from "@/components/ui/button";
import { Printer, User, LogOut, Shield } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Navbar = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchAuthState = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (session) {
        // Check metadata first for the role
        const metadataRole = session.user.user_metadata?.role;
        
        // Fetch profile data
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (!error && data) {
          // If metadata doesn't have the role but profile does, update metadata
          if (!metadataRole && data.role) {
            await supabase.auth.updateUser({
              data: { role: data.role }
            });
          }
          
          setProfile(data);
        }
      }

      setLoading(false);
    };

    fetchAuthState();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);

        if (session) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          setProfile(data || null);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getDashboardLink = () => {
    if (!profile) return "/dashboard";
    if (profile.role === "admin") return "/admin-dashboard";
    return profile.role === "shopkeeper" ? "/shop-dashboard" : "/dashboard";
  };

  const getRoleLabel = () => {
    if (!profile) return "";
    if (profile.role === "admin") return "System Administrator";
    return profile.role === "shopkeeper" ? "Print Shop Owner" : "Print User";
  };

  const getRoleIcon = () => {
    if (!profile) return <User className="h-5 w-5" />;
    if (profile.role === "admin") return <Shield className="h-5 w-5 text-purple-600" />;
    return <User className="h-5 w-5" />;
  };

  return (
    <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <Printer className="h-6 w-6 text-primary" />
          <span className="text-xl font-semibold">PrintHub</span>
        </Link>
        <div className="flex items-center space-x-4">
          {!loading && session ? (
            <div className="flex items-center space-x-4">
              <Button variant="outline" asChild>
                <Link to={getDashboardLink()}>Dashboard</Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    {getRoleIcon()}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5 text-sm font-medium">
                    {profile?.first_name} {profile?.last_name}
                  </div>
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    {session.user.email}
                  </div>
                  <div className={`px-2 py-1.5 text-xs font-medium rounded mx-2 ${
                    profile?.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                    profile?.role === 'shopkeeper' ? 'bg-primary/10 text-primary' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {getRoleLabel()}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={getDashboardLink()} className="cursor-pointer w-full">
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  {profile?.role === "user" && (
                    <DropdownMenuItem asChild>
                      <Link to="/new-order" className="cursor-pointer w-full">
                        New Order
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {profile?.role === "admin" && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin/system-settings" className="cursor-pointer w-full">
                        System Settings
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-500">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link to="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
