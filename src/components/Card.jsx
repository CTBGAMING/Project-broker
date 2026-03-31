export default function Card({ children, style }) {
    return (
      <div
        style={{
          background: "var(--card-dark)",
          borderRadius: "16px",
          padding: "32px",
          boxShadow: "var(--shadow)",
          border: "1px solid rgba(255,255,255,0.06)",
          ...style,
        }}
      >
        {children}
      </div>
    );
  }
  