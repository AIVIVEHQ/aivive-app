// Generation types
export type GenerationStatus = "pending" | "processing" | "success" | "failed";

export type AspectRatio = "1:1" | "16:9" | "9:16" | "3:4";

export interface Generation {
  id: number;
  uuid: string;
  user_uuid: string;
  created_at: Date | null;

  // Generation parameters
  prompt: string;
  negative_prompt: string | null;
  aspect_ratio: AspectRatio;
  size: string;
  style_preset: string | null;
  num_variations: number;

  // Kling API tracking
  kling_task_id: string | null;
  kling_model_id: string;

  // Results & status
  status: GenerationStatus;
  error_message: string | null;
  image_url: string | null;
  thumbnail_url: string | null;
  image_width: number | null;
  image_height: number | null;
  file_size: number | null;

  // Cost & visibility
  credits_used: number;
  is_public: boolean;
  like_count: number;
  view_count: number;

  // Metadata
  generation_time_ms: number | null;
  user_agent: string | null;
  ip_address: string | null;
}

export interface ClientGeneration {
  uuid: string;
  prompt: string;
  aspectRatio: AspectRatio;
  status: GenerationStatus;
  imageUrl?: string;
  thumbnailUrl?: string;
  creditsUsed: number;
  createdAt: string;
  generationTimeMs?: number;
  isPublic: boolean;
  likeCount: number;
  errorMessage?: string;
}

export interface GenerationFilters {
  status?: GenerationStatus | "all";
  aspect_ratio?: AspectRatio;
  is_public?: boolean;
  date_from?: Date;
  date_to?: Date;
}

export interface GenerationListResponse {
  generations: Generation[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface GenerationCreateRequest {
  prompt: string;
  aspect_ratio: AspectRatio;
  style_preset?: string;
  negative_prompt?: string;
}

export interface GenerationCreateResponse {
  generation_uuid: string;
  status: GenerationStatus;
  estimated_time_ms: number;
  credits_required: number;
}

export interface GenerationStatusResponse {
  uuid: string;
  status: GenerationStatus;
  image_url?: string;
  thumbnail_url?: string;
  generation_time_ms?: number;
  credits_used?: number;
  error_message?: string;
  error_type?: string;
}

export interface GenerationLike {
  id: number;
  generation_uuid: string;
  user_uuid: string;
  created_at: Date | null;
}

export interface AspectRatioConfig {
  width: number;
  height: number;
  credits: number;
  label: string;
}

export interface StylePreset {
  id: string;
  title: string;
  description: string;
  category: "pet-portrait" | "professional-avatar" | "atmospheric-scene" | "beauty-portrait";
  prompt_suffix: string;
  thumbnail_url?: string;
}
