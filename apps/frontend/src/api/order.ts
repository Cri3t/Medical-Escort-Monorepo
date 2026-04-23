import request from "@/utils/request";

export interface CreateOrderPayload {
  escortId: string;
  hospitalName: string;
  serviceAt: string;
  amount: number;
  remark?: string;
}

export interface Order {
  id: string;
  customerId: string;
  escortId: string | null;
  orderNo: string;
  hospitalName: string;
  serviceAt: string;
  remark: string | null;
  amount: string | number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export function createOrder(data: CreateOrderPayload) {
  return request.post<unknown, Order>("/orders", data);
}
