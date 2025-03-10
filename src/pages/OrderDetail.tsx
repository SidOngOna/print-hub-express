
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Download, MapPin, Printer } from "lucide-react";

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (!id) return;

        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate("/login");
          return;
        }

        // Fetch order details
        const { data, error } = await supabase
          .from('print_orders')
          .select(`
            *,
            print_shops (
              id,
              name,
              address,
              city,
              state,
              postal_code,
              phone,
              email
            )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        
        // Check if user owns this order
        if (data.user_id !== session.user.id) {
          navigate("/dashboard");
          return;
        }

        setOrder(data);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, navigate, toast]);

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Order not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="mb-8">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Order Details</CardTitle>
                  <CardDescription>
                    Order #{order.id.slice(0, 8)}
                  </CardDescription>
                </div>
                <Badge className={getOrderStatusColor(order.status)}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Document Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-medium">{order.file_name}</p>
                      <p className="text-sm text-gray-600">
                        Uploaded on {formatDate(order.created_at)}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={order.document_url} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </a>
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Print Specifications</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">Paper Size</p>
                      <p className="font-medium">{order.paper_size.toUpperCase()}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">Color Mode</p>
                      <p className="font-medium">
                        {order.color_mode === 'black_and_white' ? 'Black & White' : 'Color'}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">Copies</p>
                      <p className="font-medium">{order.copies}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">Printing</p>
                      <p className="font-medium">
                        {order.double_sided ? 'Double-sided' : 'Single-sided'}
                      </p>
                    </div>
                  </div>
                  {order.stapled && (
                    <div className="mt-2 bg-blue-50 p-2 rounded-lg inline-block">
                      <p className="text-sm font-medium text-blue-700">Stapled</p>
                    </div>
                  )}
                  {order.special_instructions && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600">Special Instructions:</p>
                      <p className="italic">{order.special_instructions}</p>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Order Timeline</h3>
                  <div className="relative pl-6 border-l-2 border-gray-200 space-y-4">
                    <div className="relative">
                      <div className="absolute -left-[25px] w-4 h-4 rounded-full bg-green-500"></div>
                      <p className="font-medium">Order Placed</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    {order.status !== 'pending' && (
                      <div className="relative">
                        <div className="absolute -left-[25px] w-4 h-4 rounded-full bg-blue-500"></div>
                        <p className="font-medium">Order Approved</p>
                        <p className="text-sm text-gray-600">
                          Your order has been approved by the print shop
                        </p>
                      </div>
                    )}
                    {(order.status === 'processing' || order.status === 'ready' || order.status === 'completed') && (
                      <div className="relative">
                        <div className="absolute -left-[25px] w-4 h-4 rounded-full bg-blue-500"></div>
                        <p className="font-medium">Processing</p>
                        <p className="text-sm text-gray-600">
                          Your document is being printed
                        </p>
                      </div>
                    )}
                    {(order.status === 'ready' || order.status === 'completed') && (
                      <div className="relative">
                        <div className="absolute -left-[25px] w-4 h-4 rounded-full bg-green-500"></div>
                        <p className="font-medium">Ready for Pickup</p>
                        <p className="text-sm text-gray-600">
                          Your prints are ready to be picked up
                        </p>
                      </div>
                    )}
                    {order.status === 'completed' && (
                      <div className="relative">
                        <div className="absolute -left-[25px] w-4 h-4 rounded-full bg-purple-500"></div>
                        <p className="font-medium">Completed</p>
                        <p className="text-sm text-gray-600">
                          Order has been picked up
                        </p>
                      </div>
                    )}
                    {order.status === 'cancelled' && (
                      <div className="relative">
                        <div className="absolute -left-[25px] w-4 h-4 rounded-full bg-red-500"></div>
                        <p className="font-medium">Cancelled</p>
                        <p className="text-sm text-gray-600">
                          This order has been cancelled
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Print Shop</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Printer className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-medium">{order.print_shops.name}</h3>
                    <p className="text-sm text-gray-600">{order.print_shops.email}</p>
                    <p className="text-sm text-gray-600">{order.print_shops.phone}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">{order.print_shops.address}</p>
                    <p className="text-sm text-gray-600">
                      {order.print_shops.city}, {order.print_shops.state} {order.print_shops.postal_code}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>${order.total_price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center font-medium">
                    <span>Total:</span>
                    <span>${order.total_price.toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Payment will be collected at pickup
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
