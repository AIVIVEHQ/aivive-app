import {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  unique,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// Users table
export const users = pgTable(
  "users",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    uuid: varchar({ length: 255 }).notNull().unique(),
    email: varchar({ length: 255 }).notNull(),
    created_at: timestamp({ withTimezone: true }),
    nickname: varchar({ length: 255 }),
    avatar_url: varchar({ length: 255 }),
    locale: varchar({ length: 50 }),
    signin_type: varchar({ length: 50 }),
    signin_ip: varchar({ length: 255 }),
    signin_provider: varchar({ length: 50 }),
    signin_openid: varchar({ length: 255 }),
    invite_code: varchar({ length: 255 }).notNull().default(""),
    updated_at: timestamp({ withTimezone: true }),
    invited_by: varchar({ length: 255 }).notNull().default(""),
    is_affiliate: boolean().notNull().default(false),
    creem_customer_id: varchar({ length: 255 }),
    total_generations: integer().notNull().default(0),
    public_generations: integer().notNull().default(0),
    last_generation_at: timestamp({ withTimezone: true }),
    password_hash: varchar({ length: 255 }),
  },
  (table) => [
    uniqueIndex("email_provider_unique_idx").on(
      table.email,
      table.signin_provider
    ),
  ]
);

export const twitterAccounts = pgTable(
  "twitter_accounts",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    user_uuid: varchar({ length: 255 }).notNull().unique(),
    twitter_user_id: varchar({ length: 255 }).notNull(),
    twitter_username: varchar({ length: 255 }).notNull(),
    access_token: text().notNull(),
    refresh_token: text(),
    token_type: varchar({ length: 50 }).notNull().default("bearer"),
    scope: text(),
    expires_at: timestamp({ withTimezone: true }),
    status: varchar({ length: 50 }).notNull().default("active"),
    created_at: timestamp({ withTimezone: true }).defaultNow(),
    updated_at: timestamp({ withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_twitter_accounts_user_uuid").on(table.user_uuid),
    index("idx_twitter_accounts_status").on(table.status),
  ]
);

export const twitterPosts = pgTable(
  "twitter_posts",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    uuid: varchar({ length: 255 }).notNull().unique(),
    user_uuid: varchar({ length: 255 }).notNull(),
    created_at: timestamp({ withTimezone: true }).defaultNow(),
    updated_at: timestamp({ withTimezone: true }).defaultNow(),
    input_text: text().notNull(),
    tweet_text: text(),
    image_prompt: text(),
    image_url: varchar({ length: 500 }),
    image_width: integer(),
    image_height: integer(),
    file_size: integer(),
    status: varchar({ length: 50 }).notNull().default("draft"),
    twitter_tweet_id: varchar({ length: 255 }),
    twitter_tweet_url: varchar({ length: 500 }),
    twitter_media_id: varchar({ length: 255 }),
    error_message: text(),
    published_at: timestamp({ withTimezone: true }),
  },
  (table) => [
    index("idx_twitter_posts_user_uuid").on(table.user_uuid),
    index("idx_twitter_posts_created_at").on(table.created_at),
    index("idx_twitter_posts_status").on(table.status),
  ]
);

// Orders table
export const orders = pgTable("orders", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  order_no: varchar({ length: 255 }).notNull().unique(),
  created_at: timestamp({ withTimezone: true }),
  user_uuid: varchar({ length: 255 }).notNull().default(""),
  user_email: varchar({ length: 255 }).notNull().default(""),
  amount: integer().notNull(),
  interval: varchar({ length: 50 }),
  expired_at: timestamp({ withTimezone: true }),
  status: varchar({ length: 50 }).notNull(),
  stripe_session_id: varchar({ length: 255 }),
  credits: integer().notNull(),
  currency: varchar({ length: 50 }),
  sub_id: varchar({ length: 255 }),
  sub_interval_count: integer(),
  sub_cycle_anchor: integer(),
  sub_period_end: integer(),
  sub_period_start: integer(),
  sub_times: integer(),
  product_id: varchar({ length: 255 }),
  product_name: varchar({ length: 255 }),
  valid_months: integer(),
  order_detail: text(),
  paid_at: timestamp({ withTimezone: true }),
  paid_email: varchar({ length: 255 }),
  paid_detail: text(),
  creem_subscription_id: varchar({ length: 255 }),
  creem_product_id: varchar({ length: 255 }),
  creem_customer_id: varchar({ length: 255 }),
});

// API Keys table
export const apikeys = pgTable("apikeys", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  api_key: varchar({ length: 255 }).notNull().unique(),
  title: varchar({ length: 100 }),
  user_uuid: varchar({ length: 255 }).notNull(),
  created_at: timestamp({ withTimezone: true }),
  status: varchar({ length: 50 }),
});

// Credits table
export const credits = pgTable("credits", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  trans_no: varchar({ length: 255 }).notNull().unique(),
  created_at: timestamp({ withTimezone: true }),
  user_uuid: varchar({ length: 255 }).notNull(),
  trans_type: varchar({ length: 50 }).notNull(),
  credits: integer().notNull(),
  order_no: varchar({ length: 255 }),
  expired_at: timestamp({ withTimezone: true }),
});

// Posts table
export const posts = pgTable("posts", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  uuid: varchar({ length: 255 }).notNull().unique(),
  slug: varchar({ length: 255 }),
  title: varchar({ length: 255 }),
  description: text(),
  content: text(),
  created_at: timestamp({ withTimezone: true }),
  updated_at: timestamp({ withTimezone: true }),
  status: varchar({ length: 50 }),
  cover_url: varchar({ length: 255 }),
  author_name: varchar({ length: 255 }),
  author_avatar_url: varchar({ length: 255 }),
  locale: varchar({ length: 50 }),
});

// Affiliates table
export const affiliates = pgTable("affiliates", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  user_uuid: varchar({ length: 255 }).notNull(),
  created_at: timestamp({ withTimezone: true }),
  status: varchar({ length: 50 }).notNull().default(""),
  invited_by: varchar({ length: 255 }).notNull(),
  paid_order_no: varchar({ length: 255 }).notNull().default(""),
  paid_amount: integer().notNull().default(0),
  reward_percent: integer().notNull().default(0),
  reward_amount: integer().notNull().default(0),
});

// Feedbacks table
export const feedbacks = pgTable("feedbacks", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  created_at: timestamp({ withTimezone: true }),
  status: varchar({ length: 50 }),
  user_uuid: varchar({ length: 255 }),
  content: text(),
  rating: integer(),
});

// Generations table
export const generations = pgTable(
  "generations",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    uuid: varchar({ length: 255 }).notNull().unique(),
    user_uuid: varchar({ length: 255 }).notNull(),
    created_at: timestamp({ withTimezone: true }).defaultNow(),

    // Generation parameters
    prompt: text().notNull(),
    negative_prompt: text(),
    aspect_ratio: varchar({ length: 20 }).notNull(),
    size: varchar({ length: 50 }).notNull(),
    style_preset: varchar({ length: 100 }),
    num_variations: integer().notNull().default(1),

    // Kling API tracking
    kling_task_id: varchar({ length: 255 }),
    kling_model_id: varchar({ length: 50 }).notNull().default("kling-v1"),

    // Results & status
    status: varchar({ length: 50 }).notNull().default("pending"),
    error_message: text(),
    image_url: varchar({ length: 500 }),
    thumbnail_url: varchar({ length: 500 }),
    image_width: integer(),
    image_height: integer(),
    file_size: integer(),

    // Cost & visibility
    credits_used: integer().notNull(),
    is_public: boolean().notNull().default(false),
    like_count: integer().notNull().default(0),
    view_count: integer().notNull().default(0),

    // Metadata
    generation_time_ms: integer(),
    user_agent: varchar({ length: 500 }),
    ip_address: varchar({ length: 100 }),
  },
  (table) => [
    index("idx_generations_user_uuid").on(table.user_uuid),
    index("idx_generations_created_at").on(table.created_at),
    index("idx_generations_status").on(table.status),
    index("idx_generations_public_gallery").on(table.created_at, table.is_public),
  ]
);

// Verification codes table (email registration + password reset)
export const verificationCodes = pgTable(
  "verification_codes",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    email: varchar({ length: 255 }).notNull(),
    code: varchar({ length: 10 }).notNull(),
    purpose: varchar({ length: 32 }).notNull(),
    expires_at: timestamp({ withTimezone: true }).notNull(),
    attempts: integer().notNull().default(0),
    used_at: timestamp({ withTimezone: true }),
    ip: varchar({ length: 64 }),
    created_at: timestamp({ withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_verification_codes_email_purpose").on(
      table.email,
      table.purpose
    ),
    index("idx_verification_codes_ip_created").on(table.ip, table.created_at),
  ]
);

// Generation Likes table (Phase 2)
export const generation_likes = pgTable(
  "generation_likes",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    generation_uuid: varchar({ length: 255 }).notNull(),
    user_uuid: varchar({ length: 255 }).notNull(),
    created_at: timestamp({ withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_unique_like").on(table.generation_uuid, table.user_uuid),
    index("idx_likes_generation").on(table.generation_uuid),
    index("idx_likes_user").on(table.user_uuid),
  ]
);
