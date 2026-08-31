import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';

export interface RequestActor {
  actorId: string;
  requestId: string;
  correlationId: string;
}

type AuthenticatedRequest = FastifyRequest & { actor?: RequestActor };

@Injectable()
export class RequestContextGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const requestIdHeader = request.headers['x-request-id'];
    const correlationHeader = request.headers['x-correlation-id'];
    const actorHeader = request.headers['x-actor-id'];

    const requestId = Array.isArray(requestIdHeader) ? requestIdHeader[0] : requestIdHeader;
    const correlationId = Array.isArray(correlationHeader) ? correlationHeader[0] : correlationHeader;
    const actorId = Array.isArray(actorHeader) ? actorHeader[0] : actorHeader;

    if (!actorId) throw new UnauthorizedException('An authenticated actor is required.');
    if (!/^[0-9a-f-]{36}$/i.test(actorId)) throw new BadRequestException('Invalid actor identifier.');

    request.actor = {
      actorId,
      requestId: requestId || crypto.randomUUID(),
      correlationId: correlationId || requestId || crypto.randomUUID(),
    };
    return true;
  }
}

export const Actor = createParamDecorator(
  (_data: unknown, context: ExecutionContext): RequestActor => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.actor) throw new UnauthorizedException('Request context is unavailable.');
    return request.actor;
  },
);
