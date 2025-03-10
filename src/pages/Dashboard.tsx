import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { FileText, Printer, Upload } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
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

        // Fetch orders for user
        const { data: ordersData, error: ordersError } = await supabase
          .from('print_orders')
          .select(`
            *,
            print_shops (name, address, city, postal_code)
          `)
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;
        setOrders(ordersData);
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

  // Redirect shopkeepers to their dashboard
  if (profile?.role === 'shopkeeper') {
    navigate("/shop-dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Welcome, {profile?.first_name}!</h1>
          <p className="text-gray-600">Manage your print orders and create new ones</p>
        </header>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="orders">My Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    New Print Job
                  </CardTitle>
                  <Upload className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Upload & Print</div>
                  <p className="text-xs text-muted-foreground">
                    Send documents to a nearby print shop
                  </p>
                  <Button className="w-full mt-4" onClick={() => navigate("/new-order")}>
                    Start New Order
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Find Print Shops
                  </CardTitle>
                  <Printer className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Print Shops</div>
                  <p className="text-xs text-muted-foreground">
                    Discover print shops near you
                  </p>
                  <Button className="w-full mt-4" variant="outline" onClick={() => navigate("/shops")}>
                    Browse Shops
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Recent Orders
                  </CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{orders.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Total orders placed
                  </p>
                  <Button 
                    className="w-full mt-4" 
                    variant="outline"
                    disabled={orders.length === 0}
                    onClick={() => navigate(`/order/${orders[0]?.id}`)}
                  >
                    View Latest Order
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Order History</CardTitle>
                <CardDescription>
                  View all your print orders and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-gray-500">You haven't placed any orders yet</p>
                    <Button className="mt-4" onClick={() => navigate("/new-order")}>
                      Create Your First Order
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div 
                        key={order.id} 
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition cursor-pointer"
                        onClick={() => navigate(`/order/${order.id}`)}
                      >
                        <div>
                          <h3 className="font-medium">{order.file_name}</h3>
                          <div className="text-sm text-gray-600">
                            {new Date(order.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-sm">
                            {order.print_shops.name} ({order.print_shops.city})
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
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
