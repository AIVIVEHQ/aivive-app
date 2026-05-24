"use client";

import { useState, useEffect } from "react";

export default function BackgroundEffects() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const snowflakes = isClient ? [...Array(60)].map((_, i) => {
    const size = Math.random() * 3 + 1;
    const duration = Math.random() * 15 + 10;
    const delay = Math.random() * 15;
    const drift = Math.random() * 50 - 25;

    return {
      id: i,
      left: `${Math.random() * 100}%`,
      width: `${size}px`,
      height: `${size}px`,
      animationDuration: `${duration}s`,
      animationDelay: `${delay}s`,
      opacity: Math.random() * 0.6 + 0.2,
      drift: drift
    };
  }) : [];

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* AIVIVE aurora — aqua + coral + amber over deep ink-green */}
      <div
        className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] animate-blob mix-blend-screen"
        style={{ background: 'radial-gradient(circle, oklch(0.902 0.152 174.5 / 0.16), transparent 70%)' }}
      />
      <div
        className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] animate-blob animation-delay-2000 mix-blend-screen"
        style={{ background: 'radial-gradient(circle, oklch(0.753 0.155 41.6 / 0.10), transparent 70%)' }}
      />
      <div
        className="absolute bottom-[-10%] left-[20%] w-[60%] h-[50%] rounded-full blur-[120px] animate-blob animation-delay-4000 mix-blend-screen"
        style={{ background: 'radial-gradient(circle, oklch(0.87 0.13 85 / 0.08), transparent 70%)' }}
      />
      <div
        className="absolute top-[40%] left-[10%] w-[40%] h-[40%] rounded-full blur-[100px] animate-blob animation-delay-6000 mix-blend-screen"
        style={{ background: 'radial-gradient(circle, oklch(0.624 0.118 172.6 / 0.18), transparent 70%)' }}
      />
      <div
        className="absolute top-[60%] right-[20%] w-[45%] h-[45%] rounded-full blur-[110px] animate-blob animation-delay-8000 mix-blend-screen"
        style={{ background: 'radial-gradient(circle, oklch(0.805 0.117 42.7 / 0.10), transparent 70%)' }}
      />

      {/* Drifting particles — softened to aqua */}
      {isClient && snowflakes.map((snowflake) => (
        <div
          key={snowflake.id}
          className="absolute rounded-full animate-snow"
          style={{
            left: snowflake.left,
            top: `-20px`,
            width: snowflake.width,
            height: snowflake.height,
            opacity: snowflake.opacity * 0.6,
            background: 'oklch(0.902 0.152 174.5)',
            boxShadow: '0 0 6px oklch(0.902 0.152 174.5 / 0.6)',
            animationDuration: snowflake.animationDuration,
            animationDelay: snowflake.animationDelay,
            animationTimingFunction: 'linear',
            willChange: 'transform'
          }}
        />
      ))}
    </div>
  );
}