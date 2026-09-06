"use client";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export type BackendRole = "USER" | "CREATOR" | "ADMIN";

export const ROLE_LABELS: Record<BackendRole, string> = {
  USER: "Viewer",
  CREATOR: "Creator",
  ADMIN: "Admin",
};

export const ROLE_OPTIONS: { value: BackendRole; label: string }[] = [
  { value: "USER", label: "Viewer" },
  { value: "CREATOR", label: "Creator" },
  { value: "ADMIN", label: "Admin" },
];

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  role: "USER" | "CREATOR" | "ADMIN";
  status: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
}

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "USER" | "CREATOR" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED";
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  creatorProfile?: {
    id: string;
    isVerified: boolean;
    channel?: { id: string; name: string; slug: string } | null;
  } | null;
}

export interface AdminCreator {
  id: string;
  email: string;
  name: string;
  status: "ACTIVE" | "SUSPENDED";
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  creatorProfile: {
    id: string;
    bio: string | null;
    isVerified: boolean;
    channel: { id: string; name: string; slug: string; isSuspended: boolean } | null;
  } | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  featured: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { videos?: number; channels?: number };
}

export interface AdminChannel {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  websiteUrl: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  twitterUrl: string | null;
  categoryId: string | null;
  isSuspended: boolean;
  createdAt: string;
  updatedAt: string;
  category?: Category | null;
  creator?: {
    user: { id: string; name: string; email: string; status: "ACTIVE" | "SUSPENDED" };
  };
  _count?: { videos?: number };
}

export interface Video {
  id: string;
  channelId: string;
  categoryId: string | null;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  status: "DRAFT" | "PUBLISHED" | "HIDDEN";
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  sourceOriginalName?: string | null;
  sourceMimeType?: string | null;
  sourceFileSize?: number | null;
  processingStatus?: "UPLOADED" | "PROCESSING" | "READY" | "FAILED" | null;
  // P2-4 processing artifacts (provider-relative storage keys).
  hlsMasterKey?: string | null;
  posterThumbnailKey?: string | null;
  processError?: string | null;
  durationSeconds?: number | null;
  category?: Category | null;
  channel?: { id: string; name: string; slug: string };
}

export interface AdminDashboardStats {
  totalUsers: number;
  totalCreators: number;
  totalChannels: number;
  totalVideos: number;
  totalCategories: number;
  recentVideos: {
    id: string;
    title: string;
    status: string;
    createdAt: string;
    channel: { id: string; name: string };
    category: { id: string; name: string } | null;
    _count: { likes: number; comments: number };
  }[];
  recentCreators: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
    creatorProfile: {
      id: string;
      isVerified: boolean;
      channel: { id: string; name: string; slug: string } | null;
    } | null;
  }[];
}

export interface PlatformPolicy {
  id: string;
  title: string;
  slug: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlaybackQuality {
  label: string;
  width: number | null;
  height: number | null;
  bitrateKbps: number | null;
}

export interface VideoPlayback {
  id: string;
  title: string;
  description: string | null;
  durationSeconds: number | null;
  posterUrl: string | null;
  hlsMasterUrl: string | null;
  processingStatus: "UPLOADED" | "PROCESSING" | "READY" | "FAILED" | null;
  publicationStatus: "DRAFT" | "PUBLISHED" | "HIDDEN";
  publishedAt: string | null;
  availableQualities: PlaybackQuality[];
  channel: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

// ---- P2-7 social types (real backend/database-backed viewer state) ----

export interface SocialSummary {
  videoId: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  channelFollowerCount: number;
  isLiked: boolean;
  isSaved: boolean;
  isFollowing: boolean;
}

export interface CommentUser {
  id: string;
  name: string;
}

export interface VideoComment {
  id: string;
  content: string;
  videoId: string;
  parentId: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user: CommentUser;
  _count: { replies: number };
}

/** A channel as returned by /me/following. */
export interface ViewerChannel {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
}

/**
 * A video as returned by /me/likes and /me/saved (channel + category included).
 * The backend returns a trimmed shape distinct from the admin `Video` type.
 */
export interface LibraryVideo {
  id: string;
  channelId: string;
  categoryId: string | null;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  posterThumbnailKey?: string | null;
  hlsMasterKey?: string | null;
  durationSeconds?: number | null;
  processingStatus?: string | null;
  status?: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  channel?: { id: string; name: string; slug: string } | null;
  category?: { id: string; name: string; slug: string } | null;
}

/** A single watch-history row as returned by /me/history. */
export interface WatchHistoryItem {
  positionSeconds: number;
  progressPercent: number;
  watchedAt: string;
  video: LibraryVideo;
}

export interface LikeResult {
  liked: boolean;
  likeCount: number;
}

export interface SaveResult {
  saved: boolean;
}

export interface FollowResult {
  following: boolean;
  followerCount: number;
  channel?: { id: string; name: string; slug: string };
}

export interface ShareResult {
  shared: boolean;
  shareCount: number;
}

export interface CommentListQuery {
  page?: number;
  pageSize?: number;
  parentId?: string;
}

export interface CollectionQuery {
  page?: number;
  pageSize?: number;
}

// ---- P2-9 public discovery feed types (real backend contracts) ----

/**
 * A video as returned by the public discovery feed (/api/feed, /feed/latest,
 * /feed/trending, /feed/search). The backend serializes a safe, minimal shape:
 * READY + PUBLISHED only, with a pre-resolved posterUrl (API-relative).
 */
export interface PublicVideoCard {
  id: string;
  title: string;
  description: string | null;
  durationSeconds: number | null;
  posterUrl: string | null;
  publishedAt: string | null;
  channel: { id: string; name: string; slug: string } | null;
  category: { id: string; name: string; slug: string } | null;
}

/** Query params accepted by every public feed endpoint (FeedQueryDto). */
export interface FeedQuery {
  page?: number;
  pageSize?: number;
  /** Category id or slug to narrow the feed to a single category. */
  category?: string;
  /** Free-text search over video title and channel name. */
  q?: string;
}

function buildQuery<P extends object>(params: P): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params) as [string, unknown][]) {
    if (value !== undefined && value !== "") qs.set(key, String(value));
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export class ApiError extends Error {
  status: number;
  details?: string[];

  constructor(message: string, status: number, details?: string[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

const ACCESS_TOKEN_KEY = "evo_access_token";
const REFRESH_TOKEN_KEY = "evo_refresh_token";
const USER_KEY = "evo_user";
const AUTH_COOKIE = "evo_authed=1; path=/; SameSite=Lax";

function setAuthCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = AUTH_COOKIE;
}

function clearAuthCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = "evo_authed=; path=/; SameSite=Lax; Max-Age=0";
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredUser(): SafeUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as SafeUser) : null;
  } catch {
    return null;
  }
}

export function storeSession(data: AuthResponse): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
  window.localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  setAuthCookie();
}

export function storeTokens(
  accessToken: string,
  refreshToken: string,
  user: SafeUser,
): void {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  setAuthCookie();
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  clearAuthCookie();
}

function parseError(payload: unknown): { message: string; details?: string[] } {
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.message)) {
      return {
        message: "Validation failed",
        details: (obj.message as string[]).map((m) =>
          String(m).replace(/^[^:]+:\s*/, ""),
        ),
      };
    }
    if (typeof obj.message === "string") {
      return { message: obj.message };
    }
  }
  return { message: "Something went wrong. Please try again." };
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers: Record<string, string> = {
    // Only force JSON on JSON bodies. For FormData (e.g. file uploads) we leave
    // the Content-Type unset so the browser sets the correct multipart boundary.
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    let payload: unknown = null;
    try {
      payload = await res.json();
    } catch {
      payload = null;
    }
    const parsed = parseError(payload);
    throw new ApiError(parsed.message, res.status, parsed.details);
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

/**
 * Performs an authenticated request. If the access token is expired and a
 * refresh token exists, transparently refreshes and retries once.
 */
export async function authenticatedRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const access = getAccessToken();
  try {
    return await request<T>(path, options, access ?? undefined);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) {
      throw error;
    }
    const refresh = getRefreshToken();
    if (!refresh) {
      clearSession();
      throw error;
    }
    try {
      const refreshed = await api.refresh(refresh);
      const user = getStoredUser();
      if (user) storeTokens(refreshed.accessToken, refreshed.refreshToken, user);
      else clearSession();
      return await request<T>(path, options, refreshed.accessToken);
    } catch {
      clearSession();
      throw error;
    }
  }
}

export interface CreatorDashboardStats {
  totalVideos: number;
  draftCount: number;
  publishedCount: number;
  hiddenCount: number;
  processingCount: number;
  followersCount: number;
}

export interface CreatorDashboardData {
  user: { id: string; name: string; email: string };
  profile: { id: string; bio: string | null; isVerified: boolean };
  channel: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    logoUrl: string | null;
    bannerUrl: string | null;
    websiteUrl: string | null;
    instagramUrl: string | null;
    youtubeUrl: string | null;
    twitterUrl: string | null;
    isSuspended: boolean;
    category: { id: string; name: string; slug: string } | null;
  } | null;
  stats: CreatorDashboardStats;
  recentVideos: {
    id: string;
    title: string;
    status: "DRAFT" | "PUBLISHED" | "HIDDEN";
    processingStatus: "UPLOADED" | "PROCESSING" | "READY" | "FAILED" | null;
    thumbnailUrl: string | null;
    durationSeconds: number | null;
    createdAt: string;
    publishedAt: string | null;
    category: { id: string; name: string; slug: string } | null;
  }[];
}

export const api = {
  register: (
    name: string,
    email: string,
    password: string,
    accountType: "USER" | "CREATOR",
  ) =>
    request<{ user: SafeUser; verificationCode: string | null }>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify({ name, email, password, accountType }),
      },
    ),

  login: (email: string, password: string) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: (refreshToken: string) =>
    request<{ message: string }>("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }),

  refresh: (refreshToken: string) =>
    request<{ accessToken: string; refreshToken: string }>(
      "/auth/refresh",
      { method: "POST", body: JSON.stringify({ refreshToken }) },
    ),

  me: () => authenticatedRequest<SafeUser>("/auth/me"),

  verifyEmail: (email: string, code: string) =>
    request<{ message: string; emailVerified: boolean }>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    }),

  resendVerification: (email: string) =>
    request<{ message: string; verificationCode: string | null }>(
      "/auth/resend-verification",
      { method: "POST", body: JSON.stringify({ email }) },
    ),

  forgotPassword: (email: string) =>
    request<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, password: string) =>
    request<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    }),

  // ---- Categories ----
  listCategories: () => request<Category[]>("/categories"),

  // ---- Creator: channel ----
  getChannel: () => authenticatedRequest<{ channel: AdminChannel | null }>("/creator/channel"),
  getCreatorDashboard: () =>
    authenticatedRequest<CreatorDashboardData>("/creator/dashboard"),
  createChannel: (data: Record<string, unknown>) =>
    authenticatedRequest<AdminChannel>("/creator/channel", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateChannel: (data: Record<string, unknown>) =>
    authenticatedRequest<AdminChannel>("/creator/channel", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // ---- Creator: videos ----
  listMyVideos: (status?: string) =>
    authenticatedRequest<{ items: Video[] }>(
      `/creator/videos${status ? `?status=${status}` : ""}`,
    ),
  getMyVideo: (id: string) => authenticatedRequest<Video>(`/creator/videos/${id}`),
  createVideo: (data: Record<string, unknown>) =>
    authenticatedRequest<Video>("/creator/videos", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  uploadVideo: (id: string, formData: FormData) =>
    authenticatedRequest<Video>(`/creator/videos/${id}/upload`, {
      method: "POST",
      body: formData,
    }),
  updateVideo: (id: string, data: Record<string, unknown>) =>
    authenticatedRequest<Video>(`/creator/videos/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteVideo: (id: string) =>
    authenticatedRequest<{ message: string }>(`/creator/videos/${id}`, {
      method: "DELETE",
    }),

  // ---- Admin: users ----
  adminListUsers: (params: {
    page?: number;
    pageSize?: number;
    search?: string;
    role?: string;
    status?: string;
  }) => authenticatedRequest<Paginated<AdminUser>>(`/admin/users${buildQuery(params)}`),
  adminGetUser: (id: string) => authenticatedRequest<AdminUser>(`/admin/users/${id}`),
  adminGetDashboard: () => authenticatedRequest<AdminDashboardStats>(`/admin/users/dashboard`),
  adminUpdateUserStatus: (id: string, status: string) =>
    authenticatedRequest<AdminUser>(`/admin/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  adminUpdateUserRole: (id: string, role: string) =>
    authenticatedRequest<AdminUser>(`/admin/users/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),

  // ---- Admin: creators ----
  adminListCreators: (params: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    verified?: string;
  }) => authenticatedRequest<Paginated<AdminCreator>>(`/admin/creators${buildQuery(params)}`),
  adminGetCreator: (id: string) => authenticatedRequest<AdminCreator>(`/admin/creators/${id}`),
  adminUpdateCreatorStatus: (id: string, status: string) =>
    authenticatedRequest<AdminCreator>(`/admin/creators/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  adminUpdateCreatorVerification: (id: string, isVerified: boolean) =>
    authenticatedRequest<AdminCreator>(`/admin/creators/${id}/verification`, {
      method: "PATCH",
      body: JSON.stringify({ isVerified }),
    }),

  // ---- Admin: channels ----
  adminListChannels: (params: {
    page?: number;
    pageSize?: number;
    search?: string;
    isSuspended?: string;
  }) => authenticatedRequest<Paginated<AdminChannel>>(`/admin/channels${buildQuery(params)}`),
  adminGetChannel: (id: string) => authenticatedRequest<AdminChannel>(`/admin/channels/${id}`),
  adminUpdateChannelStatus: (id: string, isSuspended: boolean) =>
    authenticatedRequest<AdminChannel>(`/admin/channels/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isSuspended }),
    }),

  // ---- Admin: categories ----
  adminListCategories: (params: {
    page?: number;
    pageSize?: number;
    search?: string;
  }) => authenticatedRequest<Paginated<Category>>(`/admin/categories${buildQuery(params)}`),
  adminCreateCategory: (data: Record<string, unknown>) =>
    authenticatedRequest<Category>("/admin/categories", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  adminUpdateCategory: (id: string, data: Record<string, unknown>) =>
    authenticatedRequest<Category>(`/admin/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  adminDeleteCategory: (id: string) =>
    authenticatedRequest<{ message: string }>(`/admin/categories/${id}`, {
      method: "DELETE",
    }),

  // ---- Admin: videos ----
  adminListVideos: (params: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
  }) => authenticatedRequest<Paginated<Video>>(`/admin/videos${buildQuery(params)}`),
  adminGetVideo: (id: string) => authenticatedRequest<Video>(`/admin/videos/${id}`),
  adminUpdateVideoStatus: (id: string, status: string) =>
    authenticatedRequest<Video>(`/admin/videos/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  // ---- Admin: policies ----
  adminListPolicies: (params: {
    page?: number;
    pageSize?: number;
    search?: string;
  }) => authenticatedRequest<Paginated<PlatformPolicy>>(`/admin/policies${buildQuery(params)}`),
  adminCreatePolicy: (data: Record<string, unknown>) =>
    authenticatedRequest<PlatformPolicy>("/admin/policies", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  adminUpdatePolicy: (id: string, data: Record<string, unknown>) =>
    authenticatedRequest<PlatformPolicy>(`/admin/policies/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  adminDeletePolicy: (id: string) =>
    authenticatedRequest<{ message: string }>(`/admin/policies/${id}`, {
      method: "DELETE",
    }),

  // ---- Public: video playback ----
  getVideoPlayback: (id: string) =>
    request<VideoPlayback>(`/videos/${id}/playback`),
  getPublicVideo: (id: string) =>
    request<VideoPlayback>(`/videos/${id}`),

  // ---- Public: discovery feed (P2-9) ----
  /** Default feed: newest eligible videos (publishedAt DESC). */
  getFeed: (query: FeedQuery = {}) =>
    request<Paginated<PublicVideoCard>>(`/feed${buildQuery(query)}`),
  /** Latest eligible videos. */
  getFeedLatest: (query: FeedQuery = {}) =>
    request<Paginated<PublicVideoCard>>(`/feed/latest${buildQuery(query)}`),
  /** MVP deterministic trending (engagement + recency). */
  getFeedTrending: (query: FeedQuery = {}) =>
    request<Paginated<PublicVideoCard>>(`/feed/trending${buildQuery(query)}`),
  /** Free-text search over video titles and channel names. */
  searchVideos: (query: FeedQuery = {}) =>
    request<Paginated<PublicVideoCard>>(`/feed/search${buildQuery(query)}`),

  // ---- P2-7 viewer social ----

  /** Public + optional-auth: counts for everyone, viewer flags when authed. */
  getSocialSummary: (videoId: string) =>
    authenticatedRequest<SocialSummary>(`/videos/${videoId}/social-summary`),
  likeVideo: (videoId: string) =>
    authenticatedRequest<LikeResult>(`/videos/${videoId}/like`, {
      method: "POST",
    }),
  unlikeVideo: (videoId: string) =>
    authenticatedRequest<LikeResult>(`/videos/${videoId}/like`, {
      method: "DELETE",
    }),
  listComments: (videoId: string, query: CommentListQuery = {}) =>
    request<Paginated<VideoComment>>(
      `/videos/${videoId}/comments${buildQuery(query)}`,
    ),
  createComment: (videoId: string, content: string, parentId?: string) =>
    authenticatedRequest<VideoComment>(`/videos/${videoId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content, parentId: parentId ?? undefined }),
    }),
  updateComment: (commentId: string, content: string) =>
    authenticatedRequest<VideoComment>(`/comments/${commentId}`, {
      method: "PATCH",
      body: JSON.stringify({ content }),
    }),
  deleteComment: (commentId: string) =>
    authenticatedRequest<{ message: string }>(`/comments/${commentId}`, {
      method: "DELETE",
    }),
  followChannel: (channelId: string) =>
    authenticatedRequest<FollowResult>(`/channels/${channelId}/follow`, {
      method: "POST",
    }),
  unfollowChannel: (channelId: string) =>
    authenticatedRequest<FollowResult>(`/channels/${channelId}/follow`, {
      method: "DELETE",
    }),
  saveVideo: (videoId: string) =>
    authenticatedRequest<SaveResult>(`/videos/${videoId}/save`, {
      method: "POST",
    }),
  unsaveVideo: (videoId: string) =>
    authenticatedRequest<SaveResult>(`/videos/${videoId}/save`, {
      method: "DELETE",
    }),
  shareVideo: (videoId: string) =>
    authenticatedRequest<ShareResult>(`/videos/${videoId}/share`, {
      method: "POST",
    }),
  recordProgress: (
    videoId: string,
    positionSeconds: number,
    progressPercent: number,
  ) =>
    authenticatedRequest(`/videos/${videoId}/progress`, {
      method: "POST",
      body: JSON.stringify({ positionSeconds, progressPercent }),
    }),
  getLikedVideos: (query: CollectionQuery = {}) =>
    authenticatedRequest<Paginated<LibraryVideo>>(
      `/me/likes${buildQuery(query)}`,
    ),
  getSavedVideos: (query: CollectionQuery = {}) =>
    authenticatedRequest<Paginated<LibraryVideo>>(
      `/me/saved${buildQuery(query)}`,
    ),
  getWatchHistory: (query: CollectionQuery = {}) =>
    authenticatedRequest<Paginated<WatchHistoryItem>>(
      `/me/history${buildQuery(query)}`,
    ),
  removeHistoryItem: (videoId: string) =>
    authenticatedRequest<{ message: string }>(`/me/history/${videoId}`, {
      method: "DELETE",
    }),
  getFollowingChannels: (query: CollectionQuery = {}) =>
    authenticatedRequest<Paginated<ViewerChannel>>(
      `/me/following${buildQuery(query)}`,
    ),
};

/**
 * Backend API origin (scheme + host + port), derived from API_BASE.
 * Used to turn backend-relative media URLs (e.g. "/api/media/{id}/...") into
 * absolute URLs the browser can load when the player runs on a different
 * origin than the API (dev: frontend :3000 vs backend :4000).
 */
export function getApiOrigin(): string {
  try {
    const base = process.env.NEXT_PUBLIC_API_URL ?? API_BASE;
    const url = new URL(base);
    return url.origin;
  } catch {
    return "http://localhost:4000";
  }
}

/**
 * Resolve a backend-relative media URL (poster/hls master) to an absolute URL
 * pointing at the API origin. Backend responses are authoritative; the frontend
 * never reconstructs storage paths itself.
 */
export function resolveMediaUrl(relativeOrAbsolute: string | null | undefined): string {
  if (!relativeOrAbsolute) return "";
  try {
    const parsed = new URL(relativeOrAbsolute);
    // Already absolute — return as-is.
    return parsed.href;
  } catch {
    // Assume backend-relative (e.g. "/api/media/{id}/hls/master.m3u8").
    return `${getApiOrigin()}${relativeOrAbsolute.startsWith("/") ? "" : "/"}${relativeOrAbsolute}`;
  }
}
