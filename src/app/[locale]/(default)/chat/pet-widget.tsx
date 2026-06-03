"use client";

import { useEffect, useRef, useState } from "react";

// A floating, draggable desktop-pet that plays a petdex-format sprite sheet.
// Everything (frame size, grid, row→state mapping, timing) is driven by the
// pet's manifest so swapping in a different sheet never touches this code.

export type PetState = "idle" | "run" | "wave" | "failed";

type StateDef = { row: number; frames: number };

type PetManifest = {
  id: string;
  displayName: string;
  spritesheetPath: string;
  frame: { w: number; h: number };
  cols: number;
  frameDurationMs: number;
  states: Record<PetState, StateDef>;
};

const PET_BASE = "/pets/aivive";
// On-screen size of the pet. Sprite frames are 192×208; we render smaller.
const DISPLAY_SCALE = 0.62;

export default function PetWidget({ state = "idle" }: { state?: PetState }) {
  const [manifest, setManifest] = useState<PetManifest | null>(null);
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);

  // One-shot wave on click takes priority over the prop-driven state briefly.
  const [oneShot, setOneShot] = useState<PetState | null>(null);
  const effectiveState = oneShot ?? state;

  // Load manifest once.
  useEffect(() => {
    let cancelled = false;
    fetch(`${PET_BASE}/pet.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((m: PetManifest) => {
        if (cancelled) return;
        setManifest(m);
        setSheetUrl(`${PET_BASE}/${m.spritesheetPath}`);
      })
      .catch((err) => console.error("[pet] failed to load manifest:", err));
    return () => {
      cancelled = true;
    };
  }, []);

  // Frame stepper. Steps background-position through the active row's frames.
  useEffect(() => {
    const el = frameRef.current;
    if (!el || !manifest) return;

    const def = manifest.states[effectiveState] ?? manifest.states.idle;
    const { w, h } = manifest.frame;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const place = (frame: number) => {
      el.style.backgroundPosition = `-${frame * w}px -${def.row * h}px`;
    };

    place(0);
    if (reduce || def.frames <= 1) return;

    let frame = 0;
    let raf = 0;
    let last = 0;
    const step = (ts: number) => {
      if (!last) last = ts;
      if (ts - last >= manifest.frameDurationMs) {
        last = ts;
        frame = (frame + 1) % def.frames;
        place(frame);
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [manifest, effectiveState]);

  // Clear a one-shot reaction after it has played a couple of loops.
  useEffect(() => {
    if (!oneShot || !manifest) return;
    const def = manifest.states[oneShot];
    const ms = manifest.frameDurationMs * def.frames * 2;
    const id = setTimeout(() => setOneShot(null), ms);
    return () => clearTimeout(id);
  }, [oneShot, manifest]);

  // ---- dragging --------------------------------------------------------
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{
    dx: number;
    dy: number;
    moved: boolean;
  } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    dragRef.current = {
      dx: e.clientX - rect.left,
      dy: e.clientY - rect.top,
      moved: false,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    d.moved = true;
    setPos({
      x: Math.max(8, e.clientX - d.dx),
      y: Math.max(8, e.clientY - d.dy),
    });
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const d = dragRef.current;
    dragRef.current = null;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    // A click (no drag) makes the pet wave.
    if (d && !d.moved) setOneShot("wave");
  };

  if (!manifest || !sheetUrl) return null;

  const fw = manifest.frame.w;
  const fh = manifest.frame.h;
  const sheetCols = manifest.cols;
  // Background sized to the full sheet so background-position can index frames.
  const bgW = fw * sheetCols;

  const placement = pos
    ? { left: pos.x, top: pos.y }
    : { right: 24, bottom: 24 };

  return (
    <div
      aria-label={`${manifest.displayName} companion`}
      role="img"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        position: "fixed",
        zIndex: 50,
        width: fw * DISPLAY_SCALE,
        height: fh * DISPLAY_SCALE,
        cursor: "grab",
        touchAction: "none",
        userSelect: "none",
        ...placement,
      }}
      className="drop-shadow-[0_8px_16px_rgba(0,0,0,0.25)]"
    >
      <div
        ref={frameRef}
        style={{
          width: fw,
          height: fh,
          transform: `scale(${DISPLAY_SCALE})`,
          transformOrigin: "top left",
          backgroundImage: `url(${sheetUrl})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: `${bgW}px auto`,
          imageRendering: "auto",
        }}
      />
    </div>
  );
}
