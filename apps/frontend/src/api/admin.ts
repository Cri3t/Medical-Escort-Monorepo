import request from "@/utils/request";

export type EscortProfileStatus = "PENDING" | "APPROVED" | "REJECTED";
export type ReviewAction = "APPROVE" | "REJECT";

export interface PendingEscortProfile {
  id: string;
  userId: string;
  idCardNo: string;
  status: EscortProfileStatus;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    nickname: string | null;
    phone: string;
  };
}

export interface PendingEscortProfilePage {
  list: PendingEscortProfile[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ReviewEscortProfilePayload {
  action: ReviewAction;
  reason?: string;
}

export function getPendingEscortProfiles(params: {
  page: number;
  pageSize: number;
}) {
  return request.get<unknown, PendingEscortProfilePage>(
    "/admin/escort-profiles/pending",
    { params },
  );
}

export function reviewEscortProfile(
  profileId: string,
  data: ReviewEscortProfilePayload,
) {
  return request.post<unknown, PendingEscortProfile>(
    `/admin/escort-profiles/${profileId}/review`,
    data,
  );
}
