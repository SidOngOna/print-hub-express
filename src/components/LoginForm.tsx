
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useState } from "react";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export function LoginForm() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true);
      
      // Try to sign in with the provided credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        throw error;
      }
      
      console.log("LoginForm: Authentication successful, user:", data.user?.id);
      
      // First check user metadata for role (faster)
      const userRole = data.user.user_metadata?.role;
      
      if (userRole) {
        console.log("LoginForm: User role from metadata:", userRole);
        toast({
          title: "Welcome back!",
          description: "You have successfully logged in.",
        });
        
        // Redirect based on role from metadata
        if (userRole === 'admin') {
          navigate('/admin-dashboard');
        } else if (userRole === 'shopkeeper') {
          navigate('/shop-dashboard');
        } else {
          navigate('/dashboard');
        }
        return;
      }
      
      // If role not in metadata, check the profiles table
      console.log("LoginForm: Checking user role from database");
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle();
        
      if (profileError) {
        console.error("LoginForm: Error fetching user profile:", profileError);
        // If we can't determine the role, go to the redirect handler
        navigate('/dashboard-redirect');
        return;
      }
      
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });

      console.log("LoginForm: User role from database:", profileData?.role);
      
      // Update user metadata with role from database for future use
      if (profileData?.role) {
        await supabase.auth.updateUser({
          data: { role: profileData.role }
        });
      }
      
      // Redirect based on role from database
      if (profileData?.role === 'admin') {
        navigate('/admin-dashboard');
      } else if (profileData?.role === 'shopkeeper') {
        navigate('/shop-dashboard');
      } else {
        navigate('/dashboard');
      }
      
    } catch (error: any) {
      console.error("LoginForm: Authentication error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to sign in",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="your@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </Form>
  );
}
