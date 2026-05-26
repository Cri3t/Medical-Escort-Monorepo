import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { UserService } from '../user/user.service';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

export interface OrderAssignmentEvent {
  orderId: string;
  orderNo: string;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: true,
  },
})
export class OrdersGateway implements OnGatewayConnection {
  @WebSocketServer()
  private server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    const token = this.getToken(client);

    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      const user = await this.userService.findSafeById(payload.sub);

      await client.join(this.userRoom(user.id));
    } catch {
      client.disconnect();
    }
  }

  notifyAssignmentPending(escortId: string, event: OrderAssignmentEvent): void {
    this.server.to(this.userRoom(escortId)).emit('orders:assignment-pending', event);
  }

  notifyAssignmentRejected(customerId: string, event: OrderAssignmentEvent): void {
    this.server.to(this.userRoom(customerId)).emit('orders:assignment-rejected', event);
  }

  private getToken(client: Socket): string | null {
    const token = client.handshake.auth?.token;

    return typeof token === 'string' && token.length > 0 ? token : null;
  }

  private userRoom(userId: string): string {
    return `user:${userId}`;
  }
}
