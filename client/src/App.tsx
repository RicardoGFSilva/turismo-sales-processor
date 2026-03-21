import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import ValidationStats from "./pages/ValidationStats";
import InvoiceDetail from "./pages/InvoiceDetail";
import MetricsDashboard from "./pages/MetricsDashboard";
import AccountsPayable from "./pages/AccountsPayable";
import AccountsReceivable from "./pages/AccountsReceivable";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"\\"} component={Home} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/validation-stats"} component={ValidationStats} />
      <Route path={"/metrics-dashboard"} component={MetricsDashboard} />
      <Route path={"/accounts-payable"} component={AccountsPayable} />
      <Route path={"/accounts-receivable"} component={AccountsReceivable} />
      <Route path={"/invoice/:invoiceId"}>
        {(params: any) => {
          console.log('[Router] Invoice route params:', params);
          return <InvoiceDetail invoiceId={params.invoiceId} />;
        }}
      </Route>
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
