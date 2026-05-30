# AI 模块架构

> 本文档是 chat 模块的活契约。代码改动如果违反这里的约定，应该同步更新本文档或讨论后再改。
>
> 锚定的版本：`ai@6.0.193`、`@ai-sdk/react@3.0.195`、Next.js 15 (App Router, Turbopack)、AI SDK v6。
>
> 最后核对：见 `git log -- docs/ai-architecture.md`。

---

## 1. 概览：三层心智

整个 chat 由三层构成，互相之间通过 **UIMessage parts 协议**解耦：

```
┌─────────────────────────────────────────────────────────────┐
│  Agent 层    定义"做什么"和"怎么循环"                            │
│  src/aisdk/agents/*  (尚未提取，当前散在 route.ts)             │
│                                                              │
│  Tools 层    一个个独立能力 (search, generateImage, ...)       │
│  src/aisdk/tools/*   (尚未建立)                                │
│                                                              │
│  UI/Parts 层 把 UIMessage parts 翻译成像素                      │
│  src/components/ai-elements/* + 各 part 渲染分支                │
└─────────────────────────────────────────────────────────────┘
```

v6 一句话：**一切围绕 `UIMessage.parts` 流转**。每个 part 是 `{ type, ...payload }`，agent 流式产出 parts，UI 按 `part.type` 字面量分发渲染。

当前实现里 Agent 层是隐式的（`streamText` + 散落的配置），目标是显式化为 `ToolLoopAgent` 实例。Tools 层尚未启动（没有 chat 用的 tool）。UI/Parts 层只覆盖 `text` 和 `reasoning`。

---

## 2. 数据形状：UIMessage 与 parts

```ts
type UIMessage = {
  id: string;                          // 稳定标识，前端按 id 做 React key
  role: "user" | "assistant" | "system";
  parts: Part[];                       // 不是 string content，是异构 part 流
};

type Part =
  | { type: "text"; text: string }
  | { type: "reasoning"; text: string }
  | { type: "file"; mediaType: string; url: string }
  | {
      type: `tool-${string}`;                      // 字面量类型，每个 tool 一个
      toolCallId: string;
      state: "input-streaming" | "input-available" | "output-available" | "output-error";
      input?: unknown;                             // 取决于 tool.inputSchema
      output?: unknown;                            // 取决于 tool.execute 返回
      errorText?: string;
    }
  | { type: "source-url"; url: string; title?: string }
  | { type: "data"; data: unknown };               // 自定义数据 part
```

### 当前我们用到的 part type

| type             | 出现位置                                  | 持久化 |
|------------------|-----------------------------------------|------|
| `text`           | assistant 主要输出 / user 输入            | ✅   |
| `reasoning`      | doubao seed 系列的思维链                   | ✅   |
| `file`           | （未实现）将来用于图像、附件                  | -    |
| `tool-<name>`    | （未实现）将来用于 generateImage 等         | -    |

代码锚点：`src/app/[locale]/(default)/chat/chat-client.tsx:368-393` 是 parts 渲染循环。

### 反例

- ❌ 用 `message.content` 取文字。v6 里没有这个字段；只通过 parts。
- ❌ 在 parts 循环里假设 `part.input` 存在。要先检 `part.state === "input-available" || "output-available"`，否则 TS18048。
- ❌ 用 `tool-invocation` 这种泛型 type。v6 是 `tool-<具体名字>` 字面量类型，type-narrowing 才能拿到正确 input/output 类型。

---

## 3. Agent：单点定义

### 目标形态

```ts
// src/aisdk/agents/chat-agent.ts
import { ToolLoopAgent, stepCountIs, type InferAgentUIMessage } from "ai";
import { ark } from "@/aisdk/provider/ark";
import { resolveServerDefaultModel } from "@/aisdk/models/chat-models";
import { generateImageTool } from "@/aisdk/tools/generate-image";

export const chatAgent = new ToolLoopAgent({
  model: ark(resolveServerDefaultModel()),
  instructions: [
    "You are a helpful, concise assistant.",
    "Reply in the same language the user writes in.",
    "Use Markdown when it improves clarity.",
    "When the user asks you to generate or draw an image, call generateImage. Never write 'Image not available' or describe an image as if you produced one inline.",
  ].join(" "),
  tools: {
    generateImage: generateImageTool,
  },
  stopWhen: stepCountIs(20),  // 默认值，明示更好维护
});

export type ChatAgentUIMessage = InferAgentUIMessage<typeof chatAgent>;
```

### 为什么用类，不用函数

- **复用**：HTTP 路由、cron、CLI、batch eval 都拿同一个 `chatAgent` 实例，model/system/tools/stopWhen 只有一份真相。
- **类型推导**：`InferAgentUIMessage<typeof chatAgent>` 自动把每个 tool 的 input/output schema 翻成 `tool-<name>` part 类型。改 tool 立即在 UI 编译错误。
- **多步循环内置**：默认 `stepCountIs(20)`，model 可以 tool → 看 output → 再 tool → 总结。手写 `streamText` 默认只跑一步。

### 当前差距

`src/app/api/chat/route.ts:60` 现在是裸 `streamText`，没有 `ToolLoopAgent`。等价于把 agent 配置散在路由里，且强制单步。

### 扩 tool 的 5 步 checklist

1. 在 `src/aisdk/tools/<name>.ts` 写 `tool({ inputSchema, execute })`，同时导出 `UIToolInvocation<typeof xxxTool>` 类型
2. 在 `chat-agent.ts` 的 `tools` 字典里加一条
3. 在 system prompt 里加一句"什么场景调它"
4. 在 `src/app/[locale]/(default)/chat/parts/` 加渲染组件，import 第一步的 invocation type
5. 在 `chat-client.tsx` 的 part switch 里加一条 `case "tool-<name>":`

---

## 4. Tools：单文件 + invocation type

### 单文件模板

```ts
// src/aisdk/tools/generate-image.ts
import "server-only";
import { tool, type UIToolInvocation } from "ai";
import { z } from "zod";
import { generateImage as arkGenerateImage } from "@/services/volcengineService";
import { newStorage } from "@/lib/storage";
import { getUuid } from "@/lib/hash";

export const generateImageTool = tool({
  description:
    "Generate a single image from a text prompt. Use when the user asks to draw, paint, or generate a picture.",
  inputSchema: z.object({
    prompt: z.string().describe("English or Chinese, describes what to draw"),
    aspectRatio: z
      .enum(["1:1", "16:9", "9:16", "3:4"])
      .default("1:1")
      .describe("Aspect ratio of the output image"),
  }),
  execute: async ({ prompt, aspectRatio }, { abortSignal }) => {
    const dataUrl = await arkGenerateImage({ prompt, aspectRatio });
    const base64 = dataUrl.split(",")[1] ?? "";
    const body = Buffer.from(base64, "base64");
    const key = `aivive/chat/${getUuid()}.png`;
    const { url } = await newStorage().uploadFile({
      key,
      body,
      contentType: "image/png",
      disposition: "inline",
    });
    return { url, prompt, aspectRatio };
  },
});

export type GenerateImageToolInvocation = UIToolInvocation<typeof generateImageTool>;
```

### 约定

- **`"server-only"`**：tool 文件必须服务端 only。`execute` 里有密钥/blob 访问，绝不能被打进客户端 bundle。
- **`inputSchema` 用 zod**：`description` 不是装饰，model 直接读它决定要不要调、传什么值。写清楚。
- **`execute` 拿到的第二个参数**：`{ abortSignal, toolCallId, messages }`。`abortSignal` 长任务一定要透传给 fetch/sdk。
- **返回值要可序列化**：会进 message parts 持久化进 JSONB，不要塞 Buffer、Date 对象、循环引用。返回 URL/字符串/数字/普通对象。
- **错误处理**：能恢复的（API 限流）→ 返回结构化对象 `{ ok: false, reason }`；不能恢复的（API 失败）→ throw，AI SDK 会把它包成 `output-error` part。
- **`UIToolInvocation` 类型必须导出**：`parts/<name>-part.tsx` 只 import 这个类型，**不要 import tool 实例**，否则 server-only 代码会被 React Server Component 边界泄漏。

### 反例

- ❌ tool 文件里写 `"use client"` 或 `"use server"`。它既不是 RSC 边界也不是 server action，是普通服务端模块，用 `"server-only"` 防御。
- ❌ `execute` 里读 `process.env.SOMETHING` 但没在文件顶部 assert。环境变量没设时要在模块加载就报错，不要等到 model 调用时才崩。
- ❌ 在 `execute` 里写业务规则（"如果 user 是 vip 就生成 4 张"）。业务规则属于服务层（`src/services/`），tool 是薄包装。

---

## 5. 路由层：薄壳

### 目标形态

```ts
// src/app/api/chat/route.ts
import { validateUIMessages, type UIMessage } from "ai";
import { auth } from "@/auth";
import { chatAgent } from "@/aisdk/agents/chat-agent";
import { upsertUserChatConversation } from "@/models/chat";

export const maxDuration = 90;  // 提到 90，图像生成可能 15-20s

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.uuid) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { messages?: UIMessage[]; conversationId?: string };
  if (!Array.isArray(body.messages) || !body.conversationId) {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const messages = await validateUIMessages({
    messages: body.messages,
    tools: chatAgent.tools,
  });

  return chatAgent.toUIMessageStreamResponse({
    messages,
    sendReasoning: true,
    onFinish: async ({ messages: finalMessages, isAborted }) => {
      if (isAborted) return;
      await upsertUserChatConversation({
        uuid: body.conversationId!,
        userUuid: session.user.uuid!,
        messages: finalMessages,
      });
    },
  });
}
```

### 路由的职责边界

路由层只做四件事：
1. **认证**：`auth()` 拒未登录
2. **入参校验**：JSON shape + `validateUIMessages` 校验 parts 兼容当前 tool schema
3. **委托**：把校验过的消息丢给 `chatAgent`
4. **持久化触发**：`onFinish` 调 `upsertUserChatConversation`

路由层**不**决定：
- 用什么模型 → `chat-agent.ts`
- 用什么 system prompt → `chat-agent.ts`
- 暴露哪些 tools → `chat-agent.ts`
- 多步停止条件 → `chat-agent.ts`

### 当前差距

`src/app/api/chat/route.ts:14-18` 把 `SYSTEM_PROMPT` 写在路由里，第 60-64 行裸 `streamText`。这些应该上移到 `chat-agent.ts`。

### 为什么需要 `validateUIMessages`

老消息从 DB 加载回来时，里面的 tool parts 可能引用了已经删掉/改 schema 的 tool。直接喂给 agent 会让 model 看到不合法的 tool input/output，行为不可预测。`validateUIMessages` 用当前 tool 字典逐条校验，不兼容的会抛错（或按降级策略转 text，见第 7 节）。

### 反例

- ❌ 在路由里直接 `streamText({ tools: { ... } })`。tool 字典应该住在 agent 里。
- ❌ 用 `toDataStreamResponse()`。v6 给 useChat 用必须 `toUIMessageStreamResponse()`，前者已弃用。
- ❌ `onFinish` 里 throw。throw 会污染流，应该 `try/catch` 然后 `console.error`，让消息已经发完的部分活下去。

---

## 6. UI 渲染：parts 分发到组件

### 目标目录

```
src/app/[locale]/(default)/chat/parts/
  text-part.tsx
  reasoning-part.tsx
  generate-image-part.tsx
  index.ts            // 仅 re-export
```

### 类型驱动的分发

```tsx
// chat-client.tsx 节选（目标形态）
import type { ChatAgentUIMessage } from "@/aisdk/agents/chat-agent";

const { messages, sendMessage, status } = useChat<ChatAgentUIMessage>({...});

messages.map((message, idx) => (
  <Message key={message.id || `msg-${idx}`} from={message.role}>
    <MessageContent>
      {message.parts.map((part, i) => {
        switch (part.type) {
          case "text":               return <TextPart key={i} part={part} />;
          case "reasoning":          return <ReasoningPart key={i} part={part} ... />;
          case "tool-generateImage": return <GenerateImagePart key={i} invocation={part} />;
          default: return null;
        }
      })}
    </MessageContent>
  </Message>
));
```

`useChat<ChatAgentUIMessage>` 让 TS 知道 part.type 的字面量集合。`case "tool-generateImage":` 之后 `part` 已经收窄到 `GenerateImageToolInvocation`，`part.input`/`part.output` 全部类型化。

### Tool part 的四态渲染

| state                | 含义                       | UI 建议                                |
|----------------------|--------------------------|--------------------------------------|
| `input-streaming`    | model 正在生成参数（流式）       | 骨架屏 / "准备中…"                       |
| `input-available`    | 参数定型，准备执行              | 加载动画 + "正在生成图片…"                  |
| `output-available`   | 执行成功                   | 渲染 `<img src={part.output.url}>`     |
| `output-error`       | 执行失败                   | 错误 chip + `part.errorText`            |

每个 tool 组件都应该显式处理这 4 态。漏一态 = UI 卡在空白。

### 当前差距

- `chat-client.tsx:368-393` parts 逻辑直接写在 `messages.map` 内部，未拆 parts/*。
- 没有 `useChat<...>(...)` 泛型，messages 是裸 `UIMessage[]`，tool part 字面量没法类型收窄。

### 反例

- ❌ 在 part 组件里 import tool 文件本体。Tool 是 server-only，泄漏到 client bundle 会构建失败或泄露密钥。**只 import `UIToolInvocation` 类型**。
- ❌ React key 用 `part.toolCallId` 之外的随机值。同一条消息流式更新时，key 不稳就闪烁。
- ❌ 在 `output-available` 之前访问 `part.output`。TS 会报，但更危险的是运行时 `undefined`。

---

## 7. 持久化：JSON 整存 + 加载时校验

### Schema

`src/db/schema.ts` 的 `chat_conversations` 表：

| 列             | 类型      | 说明                              |
|----------------|---------|---------------------------------|
| `uuid`         | text PK | 会话 ID（前端 `draftId`/`activeId`）  |
| `user_uuid`    | text    | 谁的会话                            |
| `title`        | text    | 默认从第一条 user 消息派生                 |
| `messages`     | jsonb   | 整个 `UIMessage[]` 序列化整存          |
| `model_id`     | text    | 用过的模型                           |
| `created_at`   | timestamp |                                  |
| `updated_at`   | timestamp |                                  |

代码锚点：`src/models/chat.ts:38`（upsert）/ `:21`（按 uuid 取）。

### 写入时机

服务端 `onFinish` 拿到完整 `finalMessages`（包含 assistant 回复 + tool parts）→ `upsertUserChatConversation` 整覆盖。**不增量更新**，每次完整重写整个 messages JSON。

### 加载时机

`openConversation` 点击会话 → `/api/chat/conversations/[uuid]` → 把 `row.messages` 设为 `useChat({ messages: initialMessages })`。

**这里应该补一步**：加载时跑 `validateUIMessages({ messages, tools: chatAgent.tools })`，理由：
- 老消息可能引用已删掉的 tool → 渲染时报错
- tool inputSchema 升级后老 input 不符合新 schema → model 看到会困惑

### 降级策略

当前未实现。建议：catch `validateUIMessages` 的错误后，把不兼容的 `tool-*` part 替换为一个 fallback `text` part（写明"[此工具调用已失效]"），保住消息历史可读，不丢会话。

### Blob 文件生命周期

- 生成图片 → `aivive/chat/<uuid>.png` 上传 Vercel Blob
- 删除会话 → DB row 删除，**Blob 文件不删**（孤儿）

v1 接受这个 leak。生产化前应该加：
- 删会话时遍历 messages、收集 `tool-generateImage.output.url`、批量删 blob
- 或者：daily cron 扫描 blob 与 DB 引用差集，删孤儿

### 反例

- ❌ 把 base64 image 直接塞进 message part 持久化。单条消息可能 1-3 MB → JSONB 行膨胀、加载慢、PG 不开心。一定先 upload → 存 URL。
- ❌ 用 row-per-message 设计。看上去更"规范"，但 v6 messages 是 parts 数组，拆 row 后流式更新/重写复杂度爆炸。整存整取目前规模没问题。

---

## 8. 模型注册表

### 当前

`src/aisdk/models/chat-models.ts`：

```ts
const FALLBACK_MODEL_ID = "doubao-seed-2-0-lite-260428";

export function resolveServerDefaultModel(): string {
  return (
    process.env.NEXT_PUBLIC_DEFAULT_CHAT_MODEL ||
    process.env.TEXT_MODEL ||
    FALLBACK_MODEL_ID
  );
}
```

只解析 chat 模型。图像模型在 `src/services/volcengineService.ts:18-19` 单独读 `process.env.IMAGE_MODEL`。

### 建议扩展形态

```ts
// src/aisdk/models/chat-models.ts
export const models = {
  default: process.env.TEXT_MODEL || "doubao-seed-2-0-lite-260428",
  image: process.env.IMAGE_MODEL || "doubao-seedream-5-0-260128",
  // 未来：vision, code, ...
} as const;
```

让所有"我们用什么模型"集中一处。tools/agents 都从 `models` 读，env 改一处生效。

### Provider 选择

- 当前 chat：`createOpenAICompatible` → 火山方舟。**保持**，因为 Gateway 不含火山方舟。
- Anthropic / OpenAI / Google：若将来要用，按 [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) 推荐用 `"provider/model"` 字符串而不是 `@ai-sdk/anthropic` 之类直连包。
- 多 provider 并存时按"哪个模型走哪条路"在 `chat-agent.ts` 里显式分发。

---

## 9. v6 已知陷阱（节选自官方 common-errors）

这些是从 v5 → v6 升级时最容易踩的点。当前仓库没有触发，但任何改动都要警觉：

| 错误用法                                       | 正确用法                                        |
|--------------------------------------------|---------------------------------------------|
| `maxTokens: 512`                            | `maxOutputTokens: 512`                       |
| `maxSteps: 5`                               | `stopWhen: stepCountIs(5)`                   |
| `parameters: z.object({...})` (tool)        | `inputSchema: z.object({...})`               |
| `generateObject({ schema })`                | `generateText({ output: Output.object({ schema }) })` |
| `toDataStreamResponse()` (给 useChat)         | `toUIMessageStreamResponse()`                |
| `useChat({ api: "/api/chat" })`             | `useChat({ transport: new DefaultChatTransport({ api: "/api/chat" }) })` |
| `useChat` 返回的 `input`/`handleInputChange`/`handleSubmit` | 自己 `useState` 管输入，调 `sendMessage({ text })` |
| `case "tool-invocation":`                   | `case "tool-<具体名字>":`                     |
| `part.toolInvocation.args` / `.result`      | `part.input` / `part.output`                 |
| `part.toolInvocation.toolCallId`            | `part.toolCallId`                            |
| tool state `"partial-call"`/`"call"`/`"result"` | `"input-streaming"`/`"input-available"`/`"output-available"` |
| `addToolResult({ result })`                  | `addToolOutput({ tool, toolCallId, output })` |

完整列表见 `node_modules/ai/docs/` 和 `.claude/plugins/cache/.../ai-sdk/references/common-errors.md`。

### Streamdown / markdown 渲染陷阱（项目特定）

- Streamdown 默认 `img` 组件用 `<div>` 包裹 → 在 `<p>` 里非法嵌套。**已在 `src/components/ai-elements/message.tsx` 用 `SafeMarkdownImage` 覆盖**。改组件覆盖时不要回到默认。
- `rehype-unwrap-images` 只能拆"只含图的段落"。文字+图同段落仍然要靠组件覆盖兜底。

### useChat id 稳定性陷阱（项目特定）

`useChat({ id })` 的 id 变了等于换会话，messages 重置。在新会话从 `draftId` 切到 `activeId` 时，**两者必须是同一个 uuid**，否则丢消息。详见 `src/app/[locale]/(default)/chat/chat-client.tsx:139-142` 的注释。

---

## Appendix A：当前代码锚点速查

| 关注点                  | 文件                                                             | 行     |
|---------------------|----------------------------------------------------------------|-------|
| Provider             | `src/aisdk/provider/ark.ts`                                     | 1-8   |
| 模型解析                 | `src/aisdk/models/chat-models.ts`                               | 4-13  |
| 路由（含 system+stream）  | `src/app/api/chat/route.ts`                                     | 14-89 |
| useChat 配置          | `src/app/[locale]/(default)/chat/chat-client.tsx`               | 131-157 |
| Transport            | 同上                                                              | 122-129 |
| parts 渲染            | 同上                                                              | 368-393 |
| 持久化 upsert           | `src/models/chat.ts`                                            | 38-67 |
| 持久化 load            | `src/models/chat.ts`                                            | 21-37 |
| Streamdown 包装       | `src/components/ai-elements/message.tsx`                         | 24-67 |
| 图像生成（火山）             | `src/services/volcengineService.ts`                              | 67-102 |
| 存储抽象                 | `src/lib/storage.ts`、`src/lib/storage-vercel-blob.ts`            | -     |

## Appendix B：扩展示例 — 加一个 "搜索" 工具

完整流程，给未来的人/agent 一个执行模板：

1. **新建 tool**：`src/aisdk/tools/web-search.ts`，`inputSchema` 是 `{ query: string }`，`execute` 调你选的搜索 API，返回 `{ results: Array<{ title, url, snippet }> }`，同时 `export type WebSearchToolInvocation = UIToolInvocation<typeof webSearchTool>`。
2. **挂到 agent**：`src/aisdk/agents/chat-agent.ts` 的 `tools` 字典加 `webSearch: webSearchTool`，instructions 里加一句"当问到实时信息或'最近'时调 webSearch"。
3. **UI 组件**：`src/app/[locale]/(default)/chat/parts/web-search-part.tsx`，import `WebSearchToolInvocation` 类型，按 4 态渲染（streaming → "搜索中…"；available → 结果列表；error → 错误 chip）。
4. **分发**：`chat-client.tsx` 的 part switch 加 `case "tool-webSearch": return <WebSearchPart invocation={part} />`。
5. **i18n**：`src/i18n/messages/{en,zh}.json` 加 `chat.searching` / `chat.searchFailed`。
6. **验证**：`npx tsc --noEmit` 通过；`pnpm dev` 问"最近的 OpenAI 发布"看是否触发；断网看错误态。

无 DB schema 变更。

## Appendix C：何时该重构到 v6-native

本文档描述的目标形态当前**未落地**。触发重构的信号：

- 加第二个 tool 时（说明散在 route.ts 的 system prompt + tools 已经变成维护负担）
- chat-client.tsx 单文件超过 600 行时（parts 应该拆出去）
- 第一次因为 part type 不匹配上线 bug 时（缺类型保护）

之前满足任一条，建议执行 `docs/ai-architecture.md` Appendix B 的模板做一次完整重构（约 11 个文件，30 分钟内可回滚）。
