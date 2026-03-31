import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/lib/language-context";
import Home from "@/pages/Home";
import NotFound from "@/pages/not-found";
// Auth-related pages are kept in the codebase but not currently routed:
// import Login from "@/pages/Login";
// import Signup from "@/pages/Signup";
// import AdminDashboard from "@/pages/AdminDashboard";
// import UserDashboard from "@/pages/UserDashboard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <Toaster />
          <Router />
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
