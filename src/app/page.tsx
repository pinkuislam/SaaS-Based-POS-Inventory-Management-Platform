import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  Package,
  ShoppingCart,
  Shield,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: ShoppingCart,
    title: "Fast POS & Billing",
    description:
      "Barcode scanning, cart management, multiple payment methods, and thermal receipt printing.",
  },
  {
    icon: Package,
    title: "Inventory Management",
    description:
      "Real-time stock tracking, low stock alerts, batch tracking, and branch-wise inventory.",
  },
  {
    icon: Building2,
    title: "Multi-Tenant SaaS",
    description:
      "Secure data isolation per business with subscription packages and role-based access.",
  },
  {
    icon: BarChart3,
    title: "Reports & Analytics",
    description:
      "Sales, purchase, profit & loss, stock valuation, and branch performance reports.",
  },
  {
    icon: Shield,
    title: "Role Permissions",
    description:
      "Owner, manager, cashier, inventory manager, and accountant roles with granular access.",
  },
  {
    icon: Zap,
    title: "Scalable Platform",
    description:
      "Built for retail shops, supermarkets, pharmacies, restaurants, and wholesalers.",
  },
];

const packages = [
  { name: "Starter", price: "৳999", features: ["1 Branch", "2 Users", "POS & Basic Reports"] },
  { name: "Business", price: "৳2,499", features: ["3 Branches", "10 Users", "Full Inventory & Reports"], popular: true },
  { name: "Enterprise", price: "৳4,999", features: ["20 Branches", "100 Users", "API & Priority Support"] },
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold">
            Inventory<span className="text-primary">POS</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button>Start Free Trial</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="container mx-auto px-4 py-20 md:py-32 text-center">
        <Badge variant="secondary" className="mb-4">
          SaaS POS & Inventory Platform
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-4xl mx-auto">
          Manage Sales, Stock & Business Growth in One Platform
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          Cloud-based POS and inventory management for retail shops, supermarkets,
          pharmacies, and wholesalers. Multi-tenant, subscription-based, and
          built for scale.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register">
            <Button size="lg">
              Start 14-Day Free Trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/admin/login">
            <Button size="lg" variant="outline">
              Platform Admin
            </Button>
          </Link>
        </div>
      </section>

      <section id="features" className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything Your Business Needs
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <Card key={f.title}>
                <CardHeader>
                  <f.icon className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {f.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Simple Pricing</h2>
          <p className="text-center text-muted-foreground mb-12">
            Choose a plan that fits your business size
          </p>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {packages.map((pkg) => (
              <Card
                key={pkg.name}
                className={pkg.popular ? "border-primary shadow-lg scale-105" : ""}
              >
                <CardHeader>
                  {pkg.popular && <Badge className="w-fit mb-2">Popular</Badge>}
                  <CardTitle>{pkg.name}</CardTitle>
                  <div className="text-3xl font-bold">
                    {pkg.price}
                    <span className="text-sm font-normal text-muted-foreground">
                      /mo
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {pkg.features.map((f) => (
                      <li key={f}>✓ {f}</li>
                    ))}
                  </ul>
                  <Link href="/register" className="block mt-6">
                    <Button className="w-full" variant={pkg.popular ? "default" : "outline"}>
                      Get Started
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t py-8 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} InventoryPOS. SaaS POS & Inventory Management Platform.
        </div>
      </footer>
    </div>
  );
}
