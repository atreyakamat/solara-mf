import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import FundDetail from "@/pages/FundDetail";
import Simulator from "@/pages/Simulator";
import Advisor from "@/pages/Advisor";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/funds/:id" component={FundDetail} />
      <Route path="/simulator" component={Simulator} />
      <Route path="/advisor" component={Advisor} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={0}>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
