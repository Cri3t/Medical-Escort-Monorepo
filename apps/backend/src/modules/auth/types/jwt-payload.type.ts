import { UserRole } from '@medical-escort/database';

export interface JwtPayload {
  sub: string;
  phone: string;
  role: UserRole;
}

