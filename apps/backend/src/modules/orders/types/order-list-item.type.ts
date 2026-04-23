import { OrderStatus } from '@medical-escort/database';

export interface OrderParticipant {
  nickname: string | null;
  phone?: string;
}

export interface OrderListItem {
  id: string;
  customerId: string;
  escortId: string | null;
  orderNo: string;
  hospitalName: string;
  serviceAt: Date;
  remark: string | null;
  amount: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  escort?: OrderParticipant | null;
  customer?: OrderParticipant;
}
