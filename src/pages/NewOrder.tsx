import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";
import { Check, Upload } from "lucide-react";

const paperSizes = [
  { value: "a4", label: "A4" },
  { value: "a3", label: "A3" },
  { value: "letter", label: "Letter" },
  { value: "legal", label: "Legal" },
];

const NewOrder = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [shops, setShops] = useState<any[]>([]);
  const [selectedShop, setSelectedShop] = useState<string | null>(null);
  const [shopPricing, setShopPricing] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState("upload");
  const [orderDetails, setOrderDetails] = useState({
    paperSize: "a4",
    colorMode: "black_and_white",
    copies: 1,
    doubleSided: false,
    stapled: false,
    specialInstructions: "",
  });
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate("/login");
          return;
        }

        setUserId(session.user.id);

        // Fetch all active print shops
        const { data: shopsData, error: shopsError } = await supabase
          .from('print_shops')
          .select('*')
          .eq('status', 'active');

        if (shopsError) throw shopsError;
        
        setShops(shopsData);
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

  useEffect(() => {
    if (!selectedShop) {
      setShopPricing([]);
      setTotalPrice(0);
      return;
    }

    const fetchPricing = async () => {
      const { data, error } = await supabase
        .from('print_pricing')
        .select('*')
        .eq('shop_id', selectedShop);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch pricing information.",
          variant: "destructive",
        });
        return;
      }

      setShopPricing(data);
      calculatePrice(data);
    };

    fetchPricing();
  }, [selectedShop, toast]);

  useEffect(() => {
    if (shopPricing.length > 0) {
      calculatePrice(shopPricing);
    }
  }, [orderDetails, shopPricing]);

  const calculatePrice = (pricing: any[]) => {
    const priceItem = pricing.find(
      (p) => p.paper_size === orderDetails.paperSize && p.color_mode === orderDetails.colorMode
    );

    if (priceItem) {
      const basePrice = orderDetails.doubleSided 
        ? priceItem.double_sided_price 
        : priceItem.single_sided_price;
      
      // Add stapling cost if needed (optional, can be adjusted)
      const staplingCost = orderDetails.stapled ? 0.5 : 0;
      
      const total = (basePrice + staplingCost) * orderDetails.copies;
      setTotalPrice(total);
    } else {
      setTotalPrice(0);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setActiveTab("details");
    }
  };

  const handleOrderDetailsChange = (key: string, value: any) => {
    setOrderDetails((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!file || !selectedShop || !userId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setUploadLoading(true);

    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('print_documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create signed URL for the file
      const { data: urlData } = await supabase.storage
        .from('print_documents')
        .createSignedUrl(filePath, 60 * 60 * 24); // URL valid for 24 hours

      if (!urlData || !urlData.signedUrl) {
        throw new Error("Failed to create signed URL");
      }

      // Create order record
      const { data: orderData, error: orderError } = await supabase
        .from('print_orders')
        .insert({
          user_id: userId,
          shop_id: selectedShop,
          document_url: urlData.signedUrl,
          file_name: file.name,
          paper_size: orderDetails.paperSize,
          color_mode: orderDetails.colorMode,
          copies: orderDetails.copies,
          double_sided: orderDetails.doubleSided,
          stapled: orderDetails.stapled,
          special_instructions: orderDetails.specialInstructions,
          total_price: totalPrice,
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      toast({
        title: "Success!",
        description: "Your print order has been submitted.",
      });

      navigate(`/order/${orderData.id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploadLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  const selectedShopData = shops.find(shop => shop.id === selectedShop);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">New Print Order</h1>
          <p className="text-gray-600">Upload your document and set printing preferences</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Create Your Print Order</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-6">
                    <TabsTrigger value="upload">
                      <div className="flex items-center">
                        <div className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center mr-2">
                          1
                        </div>
                        Upload Document
                      </div>
                    </TabsTrigger>
                    <TabsTrigger value="details" disabled={!file}>
                      <div className="flex items-center">
                        <div className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center mr-2">
                          2
                        </div>
                        Print Details
                      </div>
                    </TabsTrigger>
                    <TabsTrigger value="shop" disabled={!file}>
                      <div className="flex items-center">
                        <div className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center mr-2">
                          3
                        </div>
                        Select Shop
                      </div>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload" className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                      <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium mb-2">Upload Your Document</h3>
                      <p className="text-gray-500 mb-4">
                        Supported formats: PDF, DOC, DOCX, JPG, PNG
                      </p>
                      <Input
                        type="file"
                        id="document"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                      />
                      <Label htmlFor="document" className="cursor-pointer">
                        <Button asChild>
                          <span>Select File</span>
                        </Button>
                      </Label>
                    </div>
                  </TabsContent>

                  <TabsContent value="details" className="space-y-4">
                    {file && (
                      <div className="bg-green-50 p-4 rounded-lg mb-6 flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-2" />
                        <div>
                          <p className="font-medium">File Selected: {file.name}</p>
                          <p className="text-sm text-gray-600">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="paperSize">Paper Size</Label>
                        <Select 
                          value={orderDetails.paperSize}
                          onValueChange={(value) => handleOrderDetailsChange("paperSize", value)}
                        >
                          <SelectTrigger id="paperSize">
                            <SelectValue placeholder="Select paper size" />
                          </SelectTrigger>
                          <SelectContent>
                            {paperSizes.map((size) => (
                              <SelectItem key={size.value} value={size.value}>
                                {size.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="colorMode">Color Mode</Label>
                        <Select 
                          value={orderDetails.colorMode}
                          onValueChange={(value) => handleOrderDetailsChange("colorMode", value)}
                        >
                          <SelectTrigger id="colorMode">
                            <SelectValue placeholder="Select color mode" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="black_and_white">Black & White</SelectItem>
                            <SelectItem value="color">Color</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="copies">Number of Copies</Label>
                        <Input
                          id="copies"
                          type="number"
                          min={1}
                          max={100}
                          value={orderDetails.copies}
                          onChange={(e) => handleOrderDetailsChange("copies", parseInt(e.target.value) || 1)}
                        />
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="doubleSided" className="cursor-pointer">Double-sided printing</Label>
                          <Switch
                            id="doubleSided"
                            checked={orderDetails.doubleSided}
                            onCheckedChange={(checked) => handleOrderDetailsChange("doubleSided", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="stapled" className="cursor-pointer">Stapled</Label>
                          <Switch
                            id="stapled"
                            checked={orderDetails.stapled}
                            onCheckedChange={(checked) => handleOrderDetailsChange("stapled", checked)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="specialInstructions">Special Instructions (Optional)</Label>
                      <Textarea
                        id="specialInstructions"
                        placeholder="Any specific instructions for the print shop..."
                        value={orderDetails.specialInstructions}
                        onChange={(e) => handleOrderDetailsChange("specialInstructions", e.target.value)}
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={() => setActiveTab("shop")}>
                        Continue to Shop Selection
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="shop" className="space-y-4">
                    <div className="space-y-2">
                      <Label>Select a Print Shop</Label>
                      <div className="grid grid-cols-1 gap-4">
                        {shops.length === 0 ? (
                          <p className="text-center text-gray-500 py-4">No print shops available</p>
                        ) : (
                          shops.map((shop) => (
                            <div 
                              key={shop.id}
                              className={`border rounded-lg p-4 cursor-pointer transition ${
                                selectedShop === shop.id ? 'border-primary bg-blue-50' : 'hover:border-gray-400'
                              }`}
                              onClick={() => setSelectedShop(shop.id)}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-medium">{shop.name}</h3>
                                  <p className="text-sm text-gray-600">
                                    {shop.address}, {shop.city}, {shop.postal_code}
                                  </p>
                                </div>
                                {selectedShop === shop.id && (
                                  <div className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center">
                                    <Check className="h-4 w-4" />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {file && (
                    <div>
                      <h3 className="font-medium">Document</h3>
                      <p className="text-gray-600">{file.name}</p>
                    </div>
                  )}

                  {Object.keys(orderDetails).length > 0 && (
                    <div>
                      <h3 className="font-medium">Print Details</h3>
                      <ul className="text-gray-600 space-y-1">
                        <li>Paper: {paperSizes.find(p => p.value === orderDetails.paperSize)?.label || orderDetails.paperSize}</li>
                        <li>Color: {orderDetails.colorMode === 'black_and_white' ? 'Black & White' : 'Color'}</li>
                        <li>Copies: {orderDetails.copies}</li>
                        <li>{orderDetails.doubleSided ? 'Double-sided' : 'Single-sided'}</li>
                        {orderDetails.stapled && <li>Stapled</li>}
                      </ul>
                    </div>
                  )}

                  {selectedShopData && (
                    <div>
                      <h3 className="font-medium">Print Shop</h3>
                      <p className="text-gray-600">{selectedShopData.name}</p>
                      <p className="text-sm text-gray-500">{selectedShopData.address}</p>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center font-medium">
                      <span>Total Price:</span>
                      <span>${totalPrice.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    disabled={!file || !selectedShop || uploadLoading}
                    onClick={handleSubmit}
                  >
                    {uploadLoading ? "Processing..." : "Place Order"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewOrder;
