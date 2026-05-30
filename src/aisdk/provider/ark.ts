import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export const ark = createOpenAICompatible({
  name: "ark",
  apiKey: process.env.ARK_API_KEY ?? "",
  baseURL:
    process.env.ARK_BASE_URL ?? "https://ark.cn-beijing.volces.com/api/v3",
});
