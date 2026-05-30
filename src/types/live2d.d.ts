// Cubism Core SDK loaded via CDN <script>, exposes a global. We only need to
// know it exists so `pixi-live2d-display` can pick it up at runtime.
declare global {
  interface Window {
    Live2DCubismCore?: unknown;
  }
}

export {};
