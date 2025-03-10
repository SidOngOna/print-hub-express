
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PricingProps {
  shopId: string;
  initialPricing?: any[];
}

export const ShopPricing = ({ shopId, initialPricing = [] }: PricingProps) => {
  const { toast } = useToast();
  const [pricing, setPricing] = useState(initialPricing);

  const handlePriceUpdate = async (id: string, field: string, value: number) => {
    try {
      const { error } = await supabase
        .from('print_pricing')
        .update({ [field]: value })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Price updated",
        description: "The pricing has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Print Pricing</CardTitle>
        <CardDescription>
          Set your prices for different print options
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pricing.map((price: any) => (
            <div key={price.id} className="grid grid-cols-3 gap-4 items-center">
              <div>
                <Label>Paper Size</Label>
                <p className="text-sm">{price.paper_size}</p>
              </div>
              <div>
                <Label htmlFor={`single-${price.id}`}>Single Sided</Label>
                <Input
                  id={`single-${price.id}`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={price.single_sided_price}
                  onChange={(e) => 
                    handlePriceUpdate(price.id, 'single_sided_price', parseFloat(e.target.value))
                  }
                />
              </div>
              <div>
                <Label htmlFor={`double-${price.id}`}>Double Sided</Label>
                <Input
                  id={`double-${price.id}`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={price.double_sided_price}
                  onChange={(e) => 
                    handlePriceUpdate(price.id, 'double_sided_price', parseFloat(e.target.value))
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
