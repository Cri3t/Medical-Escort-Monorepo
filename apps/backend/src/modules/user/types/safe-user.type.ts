import { User } from '@medical-escort/database';

export type SafeUser = Omit<User, 'password'>;

