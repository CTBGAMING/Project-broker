import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import logo from "../assets/logo.png";

export default function TopBar() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);

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
    <header className="topbar">
      <Link to="/" className="topbar-logo" aria-label="Project Broker home">
        <img src={logo} alt="Project Broker" className="topbar-logo-img" />
        <span className="topbar-logo-text">Project Broker</span>
      </Link>

      <div className="topbar-actions">
        {session ? (
          <>
            <Link to="/dashboard" className="topbar-link">
              Dashboard
            </Link>
            <button type="button" className="topbar-btn" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/auth/login" className="topbar-link">
              Sign In
            </Link>
            <Link to="/auth/register" className="topbar-btn topbar-btn-gold">
              Register
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
