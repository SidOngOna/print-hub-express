
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Shield, Users, Building, Settings } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate("/login");
          return;
        }

        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileError) throw profileError;
        setProfile(profileData);

        // Enforce role check - redirect non-admins
        if (profileData?.role !== 'admin') {
          toast({
            title: "Access Denied",
            description: "Only admins can access this dashboard.",
            variant: "destructive",
          });
          navigate("/dashboard-redirect");
          return;
        }

        // Fetch all users
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('*');

        if (usersError) throw usersError;
        setUsers(usersData || []);

        // Fetch all shops
        const { data: shopsData, error: shopsError } = await supabase
          .from('print_shops')
          .select('*');

        if (shopsError) throw shopsError;
        setShops(shopsData || []);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  // Secondary check to ensure only admins can access
  if (profile?.role !== 'admin') {
    navigate("/dashboard-redirect");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600">Manage users, print shops, and system settings</p>
        </header>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="shops">Print Shops</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    View and manage all users in the system
                  </CardDescription>
                </div>
                <Users className="h-6 w-6 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex justify-between items-center">
                  <h3 className="text-lg font-medium">All Users</h3>
                  <Button onClick={() => navigate("/admin/add-user")}>
                    Add New User
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2">Name</th>
                        <th className="text-left py-2 px-2">Email</th>
                        <th className="text-left py-2 px-2">Role</th>
                        <th className="text-right py-2 px-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-2">
                            {user.first_name} {user.last_name}
                          </td>
                          <td className="py-2 px-2">{user.email}</td>
                          <td className="py-2 px-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                              user.role === 'shopkeeper' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {user.role === 'admin' ? 'Admin' :
                               user.role === 'shopkeeper' ? 'Shop Owner' :
                               'Customer'}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-right">
                            <Button variant="outline" size="sm" onClick={() => navigate(`/admin/edit-user/${user.id}`)}>
                              Edit
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shops" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Print Shop Management</CardTitle>
                  <CardDescription>
                    View and manage all print shops in the system
                  </CardDescription>
                </div>
                <Building className="h-6 w-6 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex justify-between items-center">
                  <h3 className="text-lg font-medium">All Print Shops</h3>
                  <Button onClick={() => navigate("/admin/add-shop")}>
                    Add New Shop
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2">Shop Name</th>
                        <th className="text-left py-2 px-2">Location</th>
                        <th className="text-left py-2 px-2">Status</th>
                        <th className="text-right py-2 px-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shops.map((shop) => (
                        <tr key={shop.id} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-2">{shop.name}</td>
                          <td className="py-2 px-2">
                            {shop.city}, {shop.state}
                          </td>
                          <td className="py-2 px-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              shop.status === 'active' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {shop.status === 'active' ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-right">
                            <Button variant="outline" size="sm" className="mr-2" onClick={() => navigate(`/admin/edit-shop/${shop.id}`)}>
                              Edit
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => navigate(`/admin/shop-pricing/${shop.id}`)}>
                              Pricing
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>System Settings</CardTitle>
                  <CardDescription>
                    Configure global system settings
                  </CardDescription>
                </div>
                <Settings className="h-6 w-6 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button onClick={() => navigate("/admin/system-settings")}>
                    Manage System Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
