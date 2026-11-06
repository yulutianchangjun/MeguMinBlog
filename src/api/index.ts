import { http, type ApiError } from '@/lib/http'

export interface ApiUser {
  id: number
  username: string
  nickname?: string
  avatar?: string
}

export interface ApiPost {
  id: number
  slug: string
  title: string
  subtitle?: string
  excerpt?: string
  tags?: string[]
  content?: string
  cover?: string
  pinned: boolean
  status: 'published' | 'hidden' | 'draft'
  publishedAt?: string
  views?: number
  categories: string[]
  collections: string[]
  prevSlug?: string
  prevTitle?: string
  nextSlug?: string
  nextTitle?: string
}

export interface ApiCollection {
  id: number
  slug: string
  title: string
  subtitle?: string
  description?: string
  cover?: string
  runes?: string
  sort: number
  postCount: number
}

export interface ApiMessage {
  id: number
  author: string
  content: string
  wall: 'top' | 'left' | 'right'
  bgColor: string
  fontColor: string
  texture: 'none' | 'paper' | 'grid' | 'stars'
  rotation: number
  pinned: boolean
  status?: string
  createdAt: string
}

export interface ApiComment {
  id: number
  postId: number
  author: string
  content: string
  status?: string
  createdAt: string
}

export interface CommentPayload {
  author: string
  content: string
  turnstileToken?: string
}

export interface ApiMusic {
  id: number
  title: string
  artist?: string
  cover?: string
  url: string
  kind: string
  size?: number
  sort?: number
}

export interface ApiCheckin {
  total: number
  streak: number
  checkedToday: boolean
  dates: string[]
}

export interface ApiUvDay {
  date: string
  label: string
  pv: number
  uv: number
}

export interface ApiUv {
  pv: number
  uv: number
  todayPv: number
  todayUv: number
  activeDays: number
  topPages: { path: string; count: number }[]
  series: ApiUvDay[]
}

export interface ApiAnniversary {
  id: number
  label: string
  date: string
  note?: string
  sort: number
}

export interface ApiSiteInfo {
  startDate: string
  anniversaries: ApiAnniversary[]
}

export interface AnniversaryPayload {
  label: string
  date: string
  note?: string
  sort?: number
}

export interface LoginResult {
  token: string
  user: ApiUser
}

export interface PostPayload {
  id?: number
  slug?: string
  title: string
  subtitle?: string
  excerpt?: string
  tags?: string[]
  content: string
  cover?: string
  status?: 'published' | 'hidden' | 'draft'
  pinned?: boolean
  publishedAt?: string
  categories?: string[]
  collections?: string[]
}

export interface CollectionPayload {
  id?: number
  slug?: string
  title: string
  subtitle?: string
  description?: string
  cover?: string
  runes?: string
  sort?: number
}

export interface MessagePayload {
  author: string
  content: string
  wall: string
  bgColor: string
  fontColor: string
  texture: string
  turnstileToken?: string
}

export type { ApiError }

export const authApi = {
  login: (username: string, password: string) =>
    http.post<LoginResult>('/auth/login', { username, password }),
  logout: () => http.post<void>('/auth/logout'),
  me: () => http.get<ApiUser>('/auth/me'),
}

export const publicApi = {
  posts: (params?: { category?: string; keyword?: string; sort?: string }) =>
    http.get<ApiPost[]>('/posts', params),
  post: (slug: string) => http.get<ApiPost>(`/posts/${encodeURIComponent(slug)}`),
  comments: (slug: string) => http.get<ApiComment[]>(`/posts/${encodeURIComponent(slug)}/comments`),
  createComment: (slug: string, payload: CommentPayload) =>
    http.post<ApiComment>(`/posts/${encodeURIComponent(slug)}/comments`, payload),
  categories: () => http.get<{ name: string; count: number }[]>('/categories'),
  collections: () => http.get<ApiCollection[]>('/collections'),
  collection: (slug: string) =>
    http.get<{ collection: ApiCollection; posts: ApiPost[] }>(`/collections/${encodeURIComponent(slug)}`),
  messages: () => http.get<ApiMessage[]>('/messages'),
  createMessage: (payload: MessagePayload) => http.post<ApiMessage>('/messages', payload),
  music: () => http.get<ApiMusic[]>('/music'),
  site: () => http.get<ApiSiteInfo>('/site'),
  checkin: () => http.get<ApiCheckin>('/checkin'),
  track: (path: string, slug?: string) => http.post<void>('/track', { path, slug }),
}

export const adminApi = {
  posts: () => http.get<ApiPost[]>('/admin/posts'),
  createPost: (payload: PostPayload) => http.post<ApiPost>('/admin/posts', payload),
  updatePost: (id: number, payload: PostPayload) => http.put<ApiPost>(`/admin/posts/${id}`, payload),
  deletePost: (id: number) => http.del<void>(`/admin/posts/${id}`),
  flags: (id: number, params: { pinned?: boolean; status?: string }) =>
    http.patch<ApiPost>(`/admin/posts/${id}/flags`, undefined, params),
  collections: () => http.get<ApiCollection[]>('/admin/collections'),
  createCollection: (payload: CollectionPayload) => http.post<ApiCollection>('/admin/collections', payload),
  updateCollection: (id: number, payload: CollectionPayload) =>
    http.put<ApiCollection>(`/admin/collections/${id}`, payload),
  deleteCollection: (id: number) => http.del<void>(`/admin/collections/${id}`),
  messages: () => http.get<ApiMessage[]>('/admin/messages'),
  pinMessage: (id: number, value: boolean) =>
    http.patch<ApiMessage>(`/admin/messages/${id}/pin`, undefined, { value }),
  messageStatus: (id: number, value: 'approved' | 'hidden') =>
    http.patch<ApiMessage>(`/admin/messages/${id}/status`, undefined, { value }),
  deleteMessage: (id: number) => http.del<void>(`/admin/messages/${id}`),
  comments: () => http.get<ApiComment[]>('/admin/comments'),
  deleteComment: (id: number) => http.del<void>(`/admin/comments/${id}`),
  createMusic: (payload: Partial<ApiMusic>) => http.post<ApiMusic>('/admin/music', payload),
  deleteMusic: (id: number) => http.del<void>(`/admin/music/${id}`),
  anniversaries: () => http.get<ApiAnniversary[]>('/admin/anniversaries'),
  createAnniversary: (payload: AnniversaryPayload) =>
    http.post<ApiAnniversary>('/admin/anniversaries', payload),
  updateAnniversary: (id: number, payload: AnniversaryPayload) =>
    http.put<ApiAnniversary>(`/admin/anniversaries/${id}`, payload),
  deleteAnniversary: (id: number) => http.del<void>(`/admin/anniversaries/${id}`),
  updateStartDate: (startDate: string) =>
    http.put<void>('/admin/site-config', { startDate }),
  uv: () => http.get<ApiUv>('/admin/stats/uv'),
  checkin: () => http.post<ApiCheckin>('/admin/checkin'),
  upload: (file: File) => http.upload<{ url: string }>('/admin/upload', file),
  uploadAudio: (file: File) => http.upload<{ url: string }>('/admin/upload/audio', file),
}
