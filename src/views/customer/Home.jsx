import React from "react";
import { Link } from "react-router-dom";
import Navigation from "../../components/navigation";
import Footer from "../../components/footer";
import { ShieldCheck, HardHat, PartyPopper, Scale, Lock, CheckCircle } from "lucide-react";

export default function CustomerHome() {
  return (
    <div className="page-wrapper">
      <Navigation />

      {/* =================================================
          1. THE UNIFIED HERO
          ================================================= */}
      <section className="hero-single">
        <div className="hero-bg-container">
          <img src="/hero-bg.webp" alt="Project Broker Hero" className="hero-img-bg" />
          <div className="hero-overlay-premium" />
        </div>

        <div className="hero-container">
          <div className="hero-content-left">
            <h1 className="luxury-headline" style={{ color: '#ffffff' }}>
              YOUR VISION, <br />
              OUR EXPERT OVERSIGHT.
            </h1>
            <p style={{ fontSize: '1.2rem', color: '#c5a059', marginBottom: '40px', maxWidth: '600px' }}>
              Specializing in elite construction management and bespoke event production.
              We vet the pros, secure your funds, and guarantee the result.
            </p>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <a href="#services" className="btn-luxury-gold">EXPLORE SERVICES</a>
              {/* ✅ Already logged in — go straight to dashboard */}
              <Link to="/customer/construction" className="btn-luxury-outline">MY DASHBOARD</Link>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================
          2. THE TRUST BAR
          ================================================= */}
      <div className="trust-bar">
        <div className="trust-item"><ShieldCheck size={20} /> 8+ YEARS INDUSTRY EXPERTISE</div>
        <div className="trust-item"><Scale size={20} /> TRADESAFE ESCROW PROTECTED</div>
        <div className="trust-item"><HardHat size={20} /> VETTED CONTRACTORS</div>
        <div className="trust-item"><PartyPopper size={20} /> ELITE EVENT VENDORS</div>
      </div>

      {/* =================================================
          3. DUAL SERVICE FOCUS
          ================================================= */}
      <section id="services" className="essence-section">
        <div className="essence-container">
          <div className="essence-header">
            <h2 className="essence-title">CHOOSE YOUR DIVISION</h2>
          </div>

          <div className="essence-grid">
            <div className="essence-card">
              <div className="card-img-wrapper">
                <video className="card-video" autoPlay muted loop playsInline>
                  <source src="/hero.mp4" type="video/mp4" />
                </video>
              </div>
              <div className="card-text">
                <span className="card-num">01</span>
                <h3>Construction & Services</h3>
                <p>From complex plumbing installations to full-scale renovations. Post your job and receive bids from verified contractors.</p>
                {/* ✅ FIXED: Logged-in customers go to their construction dashboard */}
                <Link to="/customer/construction" className="nav-register" style={{ display: 'inline-block', marginTop: '20px' }}>
                  Post a Project
                </Link>
              </div>
            </div>

            <div className="essence-card">
              <div className="card-img-wrapper">
                <video className="card-video" autoPlay muted loop playsInline>
                  <source src="/events.mp4" type="video/mp4" />
                </video>
              </div>
              <div className="card-text">
                <span className="card-num">02</span>
                <h3>Luxury Event Planning</h3>
                <p>Curating unforgettable moments. Book DJs, catering, and decor specialists with guaranteed financial security.</p>
                {/* ✅ FIXED: Logged-in customers go to their events dashboard */}
                <Link to="/customer/events" className="nav-register" style={{ display: 'inline-block', marginTop: '20px' }}>
                  Plan an Event
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================
          4. THE BROKERAGE PROCESS
          ================================================= */}
      <section className="op-blueprint">
        <div className="blueprint-container">
          <h2 className="luxury-headline central-title">HOW THE BROKERAGE PROTECTS YOU</h2>

          <div className="timeline-wrapper">
            <div className="blueprint-card">
              <div className="icon-box">01</div>
              <div className="blueprint-info">
                <h4>Verified Matching</h4>
                <p>Our 8 years of industry experience means we know how to spot a master. We only match you with pros who pass our rigorous vetting.</p>
              </div>
            </div>

            <div className="blueprint-card">
              <div className="icon-box">02</div>
              <div className="blueprint-info">
                <h4>Secure Funding</h4>
                <p>Your money is held in a secure trust. It is never paid to the professional until you are satisfied with the completed milestone.</p>
              </div>
            </div>

            <div className="blueprint-card">
              <div className="icon-box">03</div>
              <div className="blueprint-info">
                <h4>Managed Execution</h4>
                <p>Our brokers stay involved. If there's a dispute over scope or quality, we mediate to ensure the work is completed to your exact vision.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================
          5. THE MUTUAL PROTECTION FRAMEWORK
          ================================================= */}
      <section className="protection-section">
        <div className="protection-container">
          <div className="protection-header">
            <h2 className="luxury-headline">THE MUTUAL PROTECTION SHIELD</h2>
            <p className="protection-subtitle">A balanced ecosystem where clients feel safe spending, and professionals feel safe working.</p>
          </div>

          <div className="protection-grid">
            <div className="protection-card client-card">
              <div className="protection-icon">
                <Lock size={36} color="#ffffff" />
              </div>
              <h3 className="protection-title">For Our Clients</h3>
              <ul className="protection-list">
                <li>
                  <CheckCircle size={18} color="#c5a059" />
                  <span><strong>Zero Deposit Flight Risk:</strong> Your funds are held by TradeSafe Escrow, not paid directly upfront.</span>
                </li>
                <li>
                  <CheckCircle size={18} color="#c5a059" />
                  <span><strong>Milestone Control:</strong> You inspect and approve the work before any money is released.</span>
                </li>
                <li>
                  <CheckCircle size={18} color="#c5a059" />
                  <span><strong>Quality Assurance:</strong> You are protected from shoddy workmanship by our binding agreements.</span>
                </li>
              </ul>
            </div>

            <div className="protection-card pro-card">
              <div className="protection-icon">
                <ShieldCheck size={36} color="#0b0d17" />
              </div>
              <h3 className="protection-title" style={{ color: '#0b0d17' }}>For Our Professionals</h3>
              <ul className="protection-list pro-list">
                <li>
                  <CheckCircle size={18} color="#0b0d17" />
                  <span><strong>Guaranteed Compensation:</strong> The client's funds are secured in escrow <em>before</em> you arrive.</span>
                </li>
                <li>
                  <CheckCircle size={18} color="#0b0d17" />
                  <span><strong>No Scope Creep:</strong> Clear contracts protect you from clients demanding extra free work.</span>
                </li>
                <li>
                  <CheckCircle size={18} color="#0b0d17" />
                  <span><strong>End to Unpaid Invoices:</strong> Once approved, funds are automatically released.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}