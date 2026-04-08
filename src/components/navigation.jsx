import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Sun, Moon } from "lucide-react"; // Import icons

// 🔥 THE FOOLPROOF IMPORT: This forces React to find the image in your assets folder
import logoImage from "../assets/logo.png"; 

export default function Navigation() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  // Theme state
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

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

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

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
        {/* THEME TOGGLE BUTTON */}
        <button 
          onClick={toggleTheme} 
          className="theme-toggle-btn"
          aria-label="Toggle theme"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'inherit' }}
        >
          {/* If current theme is light, show Moon to switch to dark. If dark, show Sun to switch to light. */}
          {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
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
              style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
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