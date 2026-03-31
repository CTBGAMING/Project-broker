import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Sun, Moon } from "lucide-react";
import logoImage from "../assets/logo.png";

export default function Navigation() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [darkMode, setDarkMode] = useState(true); // always starts in dark mode

  // Apply theme to root element whenever it changes
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (isMounted) setSession(data?.session ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession ?? null);
      }
    );

    return () => {
      isMounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  }

  return (
    <nav className="nav">
      <Link to="/" className="logo" aria-label="Project Broker home">
        <img src={logoImage} alt="Project Broker" className="logo-img-main" />
      </Link>

      <div className="nav-links">
        {/* Dark/Light Toggle — sits before auth links so it doesn't crowd logout/dashboard */}
        <button
          type="button"
          onClick={() => setDarkMode((prev) => !prev)}
          className="theme-toggle"
          aria-label="Toggle theme"
          title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          {darkMode ? "Light" : "Dark"}
        </button>

        {session ? (
          <>
            <Link to="/dashboard" className="nav-login">
              Dashboard
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="nav-logout"
              style={{ background: "transparent", border: "none", cursor: "pointer" }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/auth/login" className="nav-login">
              Sign In
            </Link>
            <Link to="/auth/register" className="nav-register">
              GET STARTED
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}