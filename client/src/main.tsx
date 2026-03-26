import { hydrateRoot } from "react-dom/client";
import { Router } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { HydrationBoundary } from "@tanstack/react-query";
import App from "./App";
import { queryClient } from "./lib/queryClient";
import "./index.css";

declare global {
  interface Window {
    __TANSTACK_QUERY_STATE__?: unknown;
  }
}

hydrateRoot(
  document.getElementById("root")!,
  <QueryClientProvider client={queryClient}>
    <HydrationBoundary state={window.__TANSTACK_QUERY_STATE__}>
      <Router>
        <App />
      </Router>
    </HydrationBoundary>
  </QueryClientProvider>
);
