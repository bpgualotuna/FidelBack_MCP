import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthPayload {
  sub: string;
  email: string;
  role: string;
  typ: 'access' | 'refresh';
}

export const CurrentUser = createParamDecorator(
  (data: keyof AuthPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthPayload | undefined;
    return data ? user?.[data] : user;
  },
);
