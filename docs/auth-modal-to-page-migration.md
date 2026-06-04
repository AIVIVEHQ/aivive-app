# 迁移指南：登录弹窗 → 独立登录页面

> 适用于基于 **ShipAny / shipany-template-one**(Next.js App Router + next-intl + next-auth + shadcn/ui）的项目。
> 目标：把"弹窗式登录（Dialog/Drawer Modal）"改造成"带 header + footer 的独立登录页面 `/auth/signin`"，左表单右配图，自适应手机/电脑端，逻辑完全沿用原弹窗（邮箱密码登录 / 邮箱验证码注册 / 忘记密码 / OAuth）。

---

## 一、直接可用的提示词（复制给另一个产品的 Claude Code）

```
我的项目用的是 ShipAny 模板，当前登录是弹窗形式（SignModal，桌面 Dialog + 移动 Drawer，
由 app context 的 showSignModal/setShowSignModal 控制）。我要把它改成一个独立的登录页面，
要求如下：

1. 新页面放在 (default) 路由组下，URL 保持 /auth/signin，从而自带站点 header 和 footer。
2. 页面逻辑必须和现在的弹窗完全一致：邮箱密码登录、邮箱验证码注册、忘记密码(reset)、
   以及按 env 条件显示的 Google/GitHub OAuth。不要改任何后端 API 和 next-auth 配置。
3. 布局参考 skillboss：桌面端左表单右配图（grid 两列），移动端配图在上、表单在下，
   整页可自然滚动，彻底避免弹窗在移动端被键盘顶起 / 被 max-h 截断的问题。
4. 把现在弹窗里的 AuthForm 抽成一个自包含的共享组件 src/components/sign/auth-form.tsx，
   自己管理 mode 状态、自己渲染标题/副标题，新增 props { defaultMode?, callbackUrl? }，
   登录成功后跳转用 callbackUrl || "/generate"（原来可能硬编码某个路径）。
5. 在 app context 里用 gotoSignIn(callbackUrl?) 取代 showSignModal/setShowSignModal：
   内部用 next-intl 的 useRouter/usePathname，把当前路径作为 callbackUrl，
   router.push(`/auth/signin?callbackUrl=<encodeURIComponent(当前路径)>`)。
6. 把所有调用 setShowSignModal(true) 的地方改成 gotoSignIn(...)。
7. 删除旧的 SignModal 弹窗组件、旧的裸 /auth/signin 页面（如果存在、会和新页面冲突）、
   以及它专用的旧 form 组件；并移除 app context 和 theme provider 里重复挂载的 <SignModal/>。
8. 复用现有的 i18n 命名空间（通常是 sign_modal），不要新增 key，避免多语言漏翻。
9. 右侧配图用一个项目里已有的展示图，定义成页面顶部的常量 SHOWCASE_IMAGE 方便替换。

实现前先 grep 一遍：setShowSignModal / showSignModal / SignModal / sign/modal，
确认所有调用点都迁移到位。完成后跑 pnpm build 验证路由和类型。
不要碰数据库 / API / next-auth 配置，保证纯前端可回滚。
```

---

## 二、改动清单（按文件）

### 新建 2 个文件

**1. `src/components/sign/auth-form.tsx`** —— 共享表单组件
- 把原 `modal.tsx` 里内嵌的 `AuthForm` 抽出来，改为**自包含**：
  - 自己用 `useState<AuthMode>(defaultMode)` 管理 `mode`（"signin" | "signup" | "reset"）。
  - 自己渲染 `<h1>` 标题 + 副标题（用 `t(titleKey)` / `t(descKey)`），不再依赖父级传 mode。
  - 新增 props：`{ className?, defaultMode?: AuthMode, callbackUrl?: string }`。
  - 关键：登录/注册/reset 成功后跳转目标统一为 `const redirectTarget = callbackUrl || "/generate"`，
    `signIn(..., { callbackUrl: redirectTarget })` 和 `window.location.href = redirectTarget` 都用它。
  - OAuth 按钮也传 `signIn("google", { callbackUrl: redirectTarget })`。
- 其余逻辑（`handleSendCode` 验证码冷却倒计时、`handleSubmit` 三分支、邮箱校验、错误/提示展示）
  从原弹窗**原样搬过来**，不改。

**2. `src/app/[locale]/(default)/auth/signin/page.tsx`** —— 新页面（server component）
- 放在 `(default)` 组内 → 自动套用 `(default)/layout.tsx` 的 Header + Footer。
- 守卫逻辑：
  ```ts
  if (!isAuthEnabled()) redirect({ href: "/", locale });
  const session = await auth();
  if (session) redirect({ href: callbackUrl || "/", locale });
  ```
  （`redirect` 用 `@/i18n/navigation`，需要 `locale`，由 `getLocale()` 取。）
- 读取 `searchParams` 的 `callbackUrl` 和 `mode`，把 `mode` 收敛成 `AuthMode` 传给 `<AuthForm defaultMode callbackUrl />`。
- 布局：外层 `grid lg:grid-cols-2`，配图列 `order-1 lg:order-2`（移动在上、桌面在右），
  表单列 `order-2 lg:order-1`，配图用 `<img className="absolute inset-0 h-full w-full object-cover">`。
- 顶部定义 `const SHOWCASE_IMAGE = "/imgs/gallery/001.jpg";`（换成你项目的图）。

### 修改 8 个文件

| 文件 | 改动 |
|---|---|
| `src/contexts/app.tsx` | 删 `showSignModal` state、删 `import SignModal` 和 `<SignModal/>` 挂载；新增 `gotoSignIn`（用 `@/i18n/navigation` 的 `useRouter`/`usePathname`）；context value 里 `showSignModal/setShowSignModal` → `gotoSignIn` |
| `src/providers/theme.tsx` | 删除**重复**的 `import SignModal` 和 `<SignModal/>` 挂载（模板里常被挂两次） |
| `src/components/sign/sign_in.tsx` | `setShowSignModal(true)` → `gotoSignIn()` |
| `src/app/[locale]/(default)/page-client.tsx` | `setShowSignModal(true)` → `gotoSignIn("/generate")` |
| `src/components/blocks/pricing/index.tsx` | 2 处 `setShowSignModal(true)` → `gotoSignIn("/pricing")` |
| `src/components/landing/HeroSection.tsx` | `setShowSignModal(true)` → `gotoSignIn("/generate")` |
| `src/components/feedback/index.tsx` | `setShowSignModal(true)` → `gotoSignIn()` |
| `src/components/dashboard/sidebar/user.tsx` | `setShowSignModal(true)` → `gotoSignIn()` |

> 注意：调用点的数量和文件名因项目而异，**务必 grep 实际项目**，不要照搬这张表。

### 删除 3 个文件

- `src/components/sign/modal.tsx` —— 弹窗本体
- `src/app/[locale]/auth/signin/page.tsx` —— 旧的**裸**登录页（不在 default 组、无 header/footer）。如果存在会和新页面 URL 冲突，必须删。
- `src/components/sign/form.tsx` —— 旧裸页专用的表单组件（若存在）

---

## 三、核心代码片段（参考）

### `gotoSignIn`（contexts/app.tsx）

```tsx
import { usePathname, useRouter } from "@/i18n/navigation";

// 组件内：
const router = useRouter();
const pathname = usePathname();

const gotoSignIn = (callbackUrl?: string) => {
  const target = callbackUrl || pathname || "/";
  router.push(`/auth/signin?callbackUrl=${encodeURIComponent(target)}`);
};

// provider value 里暴露 gotoSignIn，移除 showSignModal/setShowSignModal
```

### 页面布局骨架（page.tsx）

```tsx
<section className="container py-10 lg:py-16">
  <div className="mx-auto grid w-full max-w-6xl items-stretch gap-8 overflow-hidden
                  rounded-2xl border bg-card shadow-sm lg:grid-cols-2 lg:gap-0">
    {/* 配图：移动在上、桌面在右 */}
    <div className="relative order-1 h-48 w-full sm:h-64 lg:order-2 lg:h-auto lg:min-h-[560px]">
      <img src={SHOWCASE_IMAGE} alt="" className="absolute inset-0 h-full w-full object-cover" />
    </div>
    {/* 表单：移动在下、桌面在左 */}
    <div className="order-2 flex items-center justify-center p-6 sm:p-10 lg:order-1">
      <div className="w-full max-w-sm">
        <AuthForm defaultMode={defaultMode} callbackUrl={callbackUrl} />
      </div>
    </div>
  </div>
</section>
```

---

## 四、验证清单

```bash
# 1. 确认没有遗漏的调用点（应无输出，注释除外）
grep -rn "setShowSignModal\|showSignModal\|SignModal\|sign/modal\|sign/form" src --include="*.tsx" --include="*.ts"

# 2. 构建（会重建 .next/types，验证路由 + 类型）
rm -rf .next/types && pnpm build
# 期望：✓ Compiled successfully，路由表里出现 /[locale]/auth/signin
```

手动验证：
- 桌面访问 `/auth/signin`：左表单右图。
- 手机视口：图在上、表单在下、整页可滚动（注册多一行验证码也不会被截断）。
- 三条流程：邮箱登录 / 邮箱验证码注册 / 忘记密码。
- 入口跳转：header "Sign In"、定价页 CTA、未登录访问受保护页 → 登录后跳回原页（callbackUrl 生效）。
- 已登录访问 `/auth/signin` → 自动跳走。
- OAuth（若 env 开启）正常。

---

## 五、坑位提醒

1. **`tsc --noEmit` 会残留旧路由报错**：删页面后 `.next/types/validator.ts` 仍引用旧路径，
   报 `Cannot find module '.../auth/signin/page.js'`。这是缓存，`rm -rf .next/types && pnpm build` 即可消除，非代码错误。
2. **`SignModal` 常被挂载两次**：模板里 `contexts/app.tsx` 和 `providers/theme.tsx` 可能都挂了 `<SignModal/>`，两处都要删。
3. **跳转必须用 `@/i18n/navigation` 而非 `next/navigation`**：否则会丢 locale 前缀。
4. **不新增 i18n key**：复用 `sign_modal` 命名空间，避免另一个产品的多语言文件漏翻。
5. **纯前端改动**：不碰 DB / API / next-auth，`git revert` 可完全回退。
6. **唯一的设计前提**：本方案假设"登录时离开当前页不会丢失未保存输入"。若某入口是用户填到一半表单才要求登录（如生成页填了 prompt），跳走会丢数据——这类入口需保留弹窗或先存草稿。ShipAny 默认没有这种流程。
```
