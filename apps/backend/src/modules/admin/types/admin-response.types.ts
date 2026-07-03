import type { EscortProfileStatus } from '@medical-escort/database';

export interface AdminEscortProfileUserResponse {
  id: string;
  nickname: string | null;
  phone: string;
}

export interface AdminEscortProfileResponse {
  id: string;
  userId: string;
  idCardNo: string;
  tags: string[];
  status: EscortProfileStatus;
  createdAt: Date;
  updatedAt: Date;
  user: AdminEscortProfileUserResponse;
}

export interface PendingEscortProfilesResponse {
  list: AdminEscortProfileResponse[];
  total: number;
  page: number;
  pageSize: number;
}
