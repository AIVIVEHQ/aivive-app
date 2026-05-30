"use client";

import { useEffect, useRef } from "react";

const MODEL_URL =
  "https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/haru/haru_greeter_t03.model3.json";

// Live2D parameter IDs used by haru (Cubism 4 standard naming).
const PARAM = {
  angleX: "ParamAngleX",
  angleY: "ParamAngleY",
  angleZ: "ParamAngleZ",
  eyeBallX: "ParamEyeBallX",
  eyeBallY: "ParamEyeBallY",
  eyeLOpen: "ParamEyeLOpen",
  eyeROpen: "ParamEyeROpen",
  breath: "ParamBreath",
  bodyAngleX: "ParamBodyAngleX",
} as const;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

async function waitForCubismCore(timeoutMs = 6000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (typeof window !== "undefined" && window.Live2DCubismCore) return true;
    await new Promise((r) => setTimeout(r, 100));
  }
  return false;
}

export default function AvatarPanel() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | null = null;

    (async () => {
      const ready = await waitForCubismCore();
      if (!ready || disposed) return;

      const PIXI = await import("pixi.js");
      const { Live2DModel } = await import("pixi-live2d-display/cubism4");

      // pixi-live2d-display registers itself onto a global PIXI namespace.
      (window as unknown as { PIXI: typeof PIXI }).PIXI = PIXI;

      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container || disposed) return;

      const app = new PIXI.Application({
        view: canvas,
        autoStart: true,
        resizeTo: container,
        backgroundAlpha: 0,
        antialias: true,
        resolution: 1,
        autoDensity: false,
      });

      let model: Awaited<ReturnType<typeof Live2DModel.from>> | null = null;
      try {
        model = await Live2DModel.from(MODEL_URL, { autoInteract: false });
      } catch (err) {
        console.error("[avatar] failed to load Live2D model:", err);
        app.destroy(true);
        return;
      }
      if (disposed || !model) {
        if (model) model.destroy();
        app.destroy(true);
        return;
      }

      app.stage.addChild(model);

      const fit = () => {
        if (!model || !container) return;
        const cw = container.clientWidth;
        const ch = container.clientHeight;
        const mw = model.internalModel.originalWidth;
        const mh = model.internalModel.originalHeight;
        const scale = Math.min(cw / mw, ch / mh) * 0.95;
        model.scale.set(scale);
        model.x = (cw - mw * scale) / 2;
        model.y = (ch - mh * scale) / 2;
      };
      fit();

      const ro = new ResizeObserver(fit);
      ro.observe(container);

      const setParam = (id: string, value: number) => {
        try {
          const core = model!.internalModel.coreModel as unknown as {
            setParameterValueById?: (id: string, value: number) => void;
          };
          core.setParameterValueById?.(id, value);
        } catch {
          // some haru rigs use different param names; ignore silently
        }
      };

      const mouseTarget = { angleX: 0, angleY: 0, eyeX: 0, eyeY: 0 };
      const idleTarget = { angleX: 0, angleY: 0 };
      let nextIdleAt = performance.now();
      let nextBlinkAt = performance.now() + 2000 + Math.random() * 3000;
      let blinkUntil = 0;
      let isMouseOver = false;

      const onMouseMove = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        const dx = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
        const dy = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
        mouseTarget.angleX = clamp(dx, -1, 1) * 22;
        mouseTarget.angleY = clamp(-dy, -1, 1) * 18;
        mouseTarget.eyeX = clamp(dx, -1, 1);
        mouseTarget.eyeY = clamp(-dy, -1, 1);
        isMouseOver = true;
      };
      const onMouseLeave = () => {
        isMouseOver = false;
      };
      container.addEventListener("mousemove", onMouseMove);
      container.addEventListener("mouseleave", onMouseLeave);

      const state = {
        angleX: 0,
        angleY: 0,
        eyeX: 0,
        eyeY: 0,
        eyeOpen: 1,
      };

      const tick = () => {
        const now = performance.now();

        // breath: ~4s period
        const breath = (Math.sin((now / 1000) * (Math.PI * 2) * 0.25) + 1) / 2;
        setParam(PARAM.breath, breath);
        setParam(PARAM.bodyAngleX, (breath - 0.5) * 4);

        // idle target refresh
        if (now >= nextIdleAt) {
          idleTarget.angleX = (Math.random() - 0.5) * 20;
          idleTarget.angleY = (Math.random() - 0.5) * 14;
          nextIdleAt = now + 900 + Math.random() * 1400;
        }

        // weighted blend: mouse dominates when hovering, idle when not
        const w = isMouseOver ? 0.75 : 0.0;
        const targetAngleX =
          mouseTarget.angleX * w + idleTarget.angleX * (1 - w);
        const targetAngleY =
          mouseTarget.angleY * w + idleTarget.angleY * (1 - w);
        const targetEyeX = mouseTarget.eyeX * (isMouseOver ? 1 : 0);
        const targetEyeY = mouseTarget.eyeY * (isMouseOver ? 1 : 0);

        state.angleX = lerp(state.angleX, targetAngleX, 0.08);
        state.angleY = lerp(state.angleY, targetAngleY, 0.08);
        state.eyeX = lerp(state.eyeX, targetEyeX, 0.15);
        state.eyeY = lerp(state.eyeY, targetEyeY, 0.15);

        setParam(PARAM.angleX, state.angleX);
        setParam(PARAM.angleY, state.angleY);
        setParam(PARAM.angleZ, state.angleX * 0.3);
        setParam(PARAM.eyeBallX, state.eyeX);
        setParam(PARAM.eyeBallY, state.eyeY);

        // blink
        if (now >= nextBlinkAt && blinkUntil === 0) {
          blinkUntil = now + 180;
        }
        if (blinkUntil > 0) {
          if (now >= blinkUntil) {
            state.eyeOpen = lerp(state.eyeOpen, 1, 0.35);
            if (state.eyeOpen > 0.97) {
              state.eyeOpen = 1;
              blinkUntil = 0;
              nextBlinkAt = now + 2500 + Math.random() * 3500;
            }
          } else {
            state.eyeOpen = lerp(state.eyeOpen, 0, 0.5);
          }
        }
        setParam(PARAM.eyeLOpen, state.eyeOpen);
        setParam(PARAM.eyeROpen, state.eyeOpen);
      };

      app.ticker.add(tick);

      cleanup = () => {
        app.ticker.remove(tick);
        container.removeEventListener("mousemove", onMouseMove);
        container.removeEventListener("mouseleave", onMouseLeave);
        ro.disconnect();
        if (model) {
          app.stage.removeChild(model);
          model.destroy();
        }
        app.destroy(true);
      };
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden rounded-lg"
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        aria-hidden="true"
      />
    </div>
  );
}
