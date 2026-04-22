import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SafeUser } from '../../user/types/safe-user.type';

interface RequestWithUser {
  user?: SafeUser;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SafeUser | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();

    return request.user;
  },
);

