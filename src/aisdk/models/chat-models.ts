// Volcengine Ark 现行模型 ID 命名带日期后缀。账号需先在 ARK 控制台
// "模型广场" 开通对应模型才能使用，否则会返回 ModelNotOpen。
// Doubao-Seed-2.0-lite (2026-04-28)：全模态理解，256K 上下文，性价比最高。
const FALLBACK_MODEL_ID = "doubao-seed-2-0-lite-260428";

// Server-only resolver for the API route.
export function resolveServerDefaultModel(): string {
  return (
    process.env.NEXT_PUBLIC_DEFAULT_CHAT_MODEL ||
    process.env.TEXT_MODEL ||
    FALLBACK_MODEL_ID
  );
}
