export default function Bg() {
  return (
    <div className="absolute inset-0 -z-50 overflow-hidden pointer-events-none">
      {/* Aurora Gradients */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--aurora-1)] rounded-full blur-[120px] animate-aurora-rotate" />
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-[var(--aurora-2)] rounded-full blur-[100px] animate-aurora-rotate" style={{ animationDelay: "5s" }} />
        <div className="absolute bottom-1/4 left-1/2 w-72 h-72 bg-[var(--aurora-3)] rounded-full blur-[90px] animate-aurora-rotate" style={{ animationDelay: "10s" }} />
      </div>

      {/* Floating Blobs */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-primary/40 rounded-full blur-[80px] animate-blob-float" />
        <div className="absolute top-2/3 right-1/3 w-56 h-56 bg-accent/40 rounded-full blur-[70px] animate-blob-float" style={{ animationDelay: "3s" }} />
        <div className="absolute bottom-1/3 left-2/3 w-48 h-48 bg-primary/30 rounded-full blur-[60px] animate-blob-float" style={{ animationDelay: "6s" }} />
      </div>

      {/* Snow Particles */}
      <div className="snowflakes" aria-hidden="true">
        {Array.from({ length: 50 }).map((_, i) => (
          <div key={i} className="snowflake" style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 10}s`,
            animationDuration: `${Math.random() * 5 + 5}s`,
            opacity: Math.random() * 0.5 + 0.2,
            fontSize: `${Math.random() * 10 + 10}px`
          }}>
            ❄
          </div>
        ))}
      </div>

      <style jsx>{`
        .snowflake {
          position: absolute;
          top: -10px;
          color: #fff;
          user-select: none;
          z-index: 1000;
          animation-name: snowfall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        @keyframes snowfall {
          0% { transform: translateY(0); }
          100% { transform: translateY(100vh); }
        }
      `}</style>
    </div>
  );
}
