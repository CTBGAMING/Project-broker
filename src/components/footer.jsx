import React from "react";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-contact">
          <span className="contact-label">CONTACT US</span>
          <a href="mailto:admin@projectbroker.co.za" className="contact-email">
            admin@projectbroker.co.za
          </a>
        </div>
        
        <div className="footer-text">
          © 2026 PROJECT BROKER. ALL RIGHTS RESERVED.
        </div>
      </div>
    </footer>
  );
}