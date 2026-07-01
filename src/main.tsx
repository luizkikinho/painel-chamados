import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router"
import App from "./pages/App.tsx"
import "./index.css"
import { ThemeProvider } from "./components/theme-provider.tsx"
import { TooltipProvider } from "@/components/ui/tooltip"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <TooltipProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </React.StrictMode>
)
