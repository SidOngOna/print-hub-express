
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, MapPin, Printer, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";

const features = [
  {
    icon: FileText,
    title: "Easy Upload",
    description: "Upload your documents securely with just a few clicks",
  },
  {
    icon: MapPin,
    title: "Find Nearby Shops",
    description: "Locate the closest print shops in your area",
  },
  {
    icon: Printer,
    title: "Custom Printing",
    description: "Choose from various printing options to match your needs",
  },
  {
    icon: Truck,
    title: "Quick Pickup",
    description: "Get notified when your prints are ready for collection",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      <Navbar />
      <main className="container mx-auto px-4 pt-32 pb-16">
        <section className="text-center max-w-3xl mx-auto animate-fade-in">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Print Documents from
            <span className="text-primary"> Anywhere</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Connect with local print shops and get your documents printed hassle-free
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/signup">Get Started</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/shops">Find Print Shops</Link>
            </Button>
          </div>
        </section>

        <section className="mt-24">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <Card key={feature.title} className="p-6 hover:shadow-lg transition-shadow">
                <div className="mb-4">
                  <feature.icon className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
