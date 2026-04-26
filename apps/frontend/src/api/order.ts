import request from "@/utils/request";

export interface CreateOrderPayload {
  escortId: string;
  hospitalName: string;
  serviceAt: string;
  amount: number;
  remark?: string;
}

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PENDING_ACCEPT"
  | "IN_SERVICE"
  | "COMPLETED"
  | "CANCELLED";

export interface Order {
  id: string;
  customerId: string;
  escortId: string | null;
  escort?: {
    nickname: string | null;
  };
  customer?: {
    nickname: string | null;
    phone?: string;
  };
  orderNo: string;
  hospitalName: string;
  serviceAt: string;
  remark: string | null;
  amount: string | number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export function createOrder(data: CreateOrderPayload) {
  return request.post<unknown, Order>("/orders", data);
}

export function getMyOrders() {
  return request.get<unknown, Order[]>("/orders/my");
}

export function payOrder(id: string) {
  return request.post<unknown, Order>(`/orders/${id}/pay`);
}

export function acceptOrder(id: string) {
  return request.post<unknown, Order>(`/orders/${id}/accept`);
}

export function completeOrder(id: string) {
  return request.post<unknown, Order>(`/orders/${id}/complete`);
}
