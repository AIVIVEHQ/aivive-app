export const CacheKey = {
  Theme: "THEME",
  InviteCode: "INVITE_CODE",
};

export const AffiliateStatus = {
  Pending: "pending",
  Completed: "completed",
};

export const AffiliateRewardPercent = {
  Invited: 0,
  Paied: 20, // 20%
};

export const AffiliateRewardAmount = {
  Invited: 0,
  Paied: 5000, // $50
};

export const GenerationCredits = {
  "1:1": 10,
  "16:9": 15,
  "9:16": 15,
  "3:4": 12,
} as const;

export const GenerationLimits = {
  FreeUserHourly: 20, // Users with <500 credits
  PaidUserHourly: 100, // Users with >=500 credits
  MaxConcurrent: 3, // Max simultaneous generations per user
} as const;

export const NewUserBonus = {
  SignupCredits: 100, // Welcome bonus for new users
  EmailVerifyCredits: 50, // Bonus for email verification
  GenerationWelcome: 100, // Same as signup for now
} as const;
