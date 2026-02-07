import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  LineChart, 
  MessageSquareText, 
  PieChart, 
  Settings, 
  WalletCards,
  Menu
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { label: "Fund Explorer", icon: LayoutDashboard, href: "/" },
  { label: "Simulator", icon: LineChart, href: "/simulator" },
  { label: "AI Advisor", icon: MessageSquareText, href: "/advisor" },
];

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card/50 backdrop-blur-xl fixed h-full z-30">
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
              F
            </div>
            <h1 className="font-display text-xl font-bold tracking-tight">FundFlow AI</h1>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer group",
                  location === item.href 
                    ? "bg-primary/10 text-primary shadow-sm" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 transition-colors",
                  location === item.href ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )} />
                {item.label}
              </div>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-border/50">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/10">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <WalletCards className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Pro Plan</p>
              <p className="text-[10px] text-muted-foreground">Active until Dec 2025</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-md border-b border-border z-40 flex items-center px-4 justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
            F
          </div>
          <span className="font-display font-bold">FundFlow</span>
        </div>
        
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
             <div className="p-6 border-b border-border/50">
              <h1 className="font-display text-xl font-bold tracking-tight">FundFlow AI</h1>
            </div>
            <nav className="flex-1 p-4 space-y-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer",
                      location === item.href 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </div>
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pt-16 md:pt-0 min-h-screen transition-all duration-300">
        <div className="container max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
