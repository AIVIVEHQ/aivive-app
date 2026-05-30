import Script from "next/script";

const CUBISM_CORE_URL =
  "https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js";

export default function AvatarScripts() {
  return <Script src={CUBISM_CORE_URL} strategy="afterInteractive" />;
}
