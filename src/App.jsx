import { Outlet, useLocation } from "react-router-dom";
import TopBar from "./components/TopBar";

export default function App() {
  const location = useLocation();
  const path = location.pathname || "/";

  // Identify our different page types
  const isHome = path === "/";
  const isDashboardRoute = path.startsWith("/dashboard");
  const isAuthRoute = path.startsWith("/auth"); 
  const isCustomerRoute = path.startsWith("/customer"); // 🔥 THE FIX: Identifies the customer portals

  // If the path matches any of the above, DO NOT show the old TopBar.
  const hideTopBar = isHome || isDashboardRoute || isAuthRoute || isCustomerRoute;

  return (
    <>
      {/* Only show the old TopBar on pages that actually need it 
        (like standard content pages, if you have any).
      */}
      {!hideTopBar && <TopBar />}
      
      <Outlet />
    </>
  );
}