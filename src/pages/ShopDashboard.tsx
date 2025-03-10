import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Building, FileText, Settings } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";

const ShopDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [shop, setShop] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
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
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        if (profileData.role !== 'shopkeeper') {
          navigate("/dashboard");
          return;
        }

        // Fetch shop info
        const { data: shopData, error: shopError } = await supabase
          .from('print_shops')
          .select('*')
          .eq('owner_id', session.user.id)
          .single();

        if (shopError && shopError.code !== 'PGRST116') {
          throw shopError;
        }
        
        setShop(shopData || null);

        if (shopData) {
          // Fetch orders for shop
          const { data: ordersData, error: ordersError } = await supabase
            .from('print_orders')
            .select(`
              *,
              profiles (first_name, last_name)
            `)
            .eq('shop_id', shopData.id)
            .order('created_at', { ascending: false });

          if (ordersError) throw ordersError;
          setOrders(ordersData);
        }
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

  // Redirect non-shopkeepers to user dashboard
  if (profile?.role !== 'shopkeeper') {
    navigate("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Shop Owner Dashboard</h1>
          <p className="text-gray-600">Manage your print shop and orders</p>
        </header>

        {!shop ? (
          <Card>
            <CardHeader>
              <CardTitle>Welcome to PrintHub!</CardTitle>
              <CardDescription>
                You haven't set up your print shop yet. Get started by creating your shop profile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/shop-setup")}>
                Set Up My Print Shop
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="orders" className="space-y-6">
            <TabsList>
              <TabsTrigger value="orders">Incoming Orders</TabsTrigger>
              <TabsTrigger value="shop">Shop Profile</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Order Management</CardTitle>
                  <CardDescription>
                    View and manage print orders from customers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-gray-500">No orders have been placed yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div 
                          key={order.id} 
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition cursor-pointer"
                          onClick={() => navigate(`/shop-order/${order.id}`)}
                        >
                          <div>
                            <h3 className="font-medium">{order.file_name}</h3>
                            <div className="text-sm text-gray-600">
                              {new Date(order.created_at).toLocaleDateString()}
                            </div>
                            <div className="text-sm">
                              By: {order.profiles.first_name} {order.profiles.last_name}
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <div className={`text-sm font-medium px-2 py-1 rounded ${
                              order.status === 'ready' ? 'bg-green-100 text-green-800' :
                              order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </div>
                            <div className="text-sm mt-1">${order.total_price.toFixed(2)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="shop">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Shop Profile</CardTitle>
                    <CardDescription>
                      Manage your print shop details
                    </CardDescription>
                  </div>
                  <Building className="h-6 w-6 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium">{shop.name}</h3>
                      <p className="text-gray-600">{shop.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium">Address</h4>
                        <p className="text-gray-600">
                          {shop.address}<br />
                          {shop.city}, {shop.state} {shop.postal_code}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium">Contact</h4>
                        <p className="text-gray-600">
                          {shop.phone}<br />
                          {shop.email}
                        </p>
                      </div>
                    </div>
                    
                    <Button onClick={() => navigate("/edit-shop")}>
                      <Settings className="mr-2 h-4 w-4" />
                      Edit Shop Information
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pricing">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Pricing Management</CardTitle>
                    <CardDescription>
                      Set your print service pricing
                    </CardDescription>
                  </div>
                  <FileText className="h-6 w-6 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button onClick={() => navigate("/pricing")}>
                      Manage Pricing
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default ShopDashboard;
