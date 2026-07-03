import request from "@/utils/request";
import type { OrderStatus } from "@/api/order";

export type EscortProfileStatus = "PENDING" | "APPROVED" | "REJECTED";
export type ReviewAction = "APPROVE" | "REJECT";

export interface PendingEscortProfile {
  id: string;
  userId: string;
  idCardNo: string;
  tags: string[];
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
  tags?: string[];
  reason?: string;
}

export interface AdminOrderParticipant {
  id: string;
  nickname: string | null;
  phone: string;
}

export interface AdminOrder {
  id: string;
  orderNo: string;
  customerId: string;
  escortId: string | null;
  hospitalName: string;
  serviceAt: string;
  remark: string | null;
  amount: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  customer: AdminOrderParticipant;
  escort: AdminOrderParticipant | null;
}

export interface AdminOrderPage {
  list: AdminOrder[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminOrdersQuery {
  page: number;
  pageSize: number;
  status?: OrderStatus;
}

export function getAdminOrders(params: AdminOrdersQuery) {
  return request.get<unknown, AdminOrderPage>("/admin/orders", { params });
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
