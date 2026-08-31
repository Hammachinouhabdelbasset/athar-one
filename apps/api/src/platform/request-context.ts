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

function bearerSubject(header: string | string[] | undefined): string | undefined {
  const value = Array.isArray(header) ? header[0] : header;
  if (!value?.startsWith('Bearer ')) return undefined;
  return value.slice('Bearer '.length).trim();
}

@Injectable()
export class RequestContextGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const requestIdHeader = request.headers['x-request-id'];
    const correlationHeader = request.headers['x-correlation-id'];
    const demoActorHeader = request.headers['x-actor-id'];

    const requestId = Array.isArray(requestIdHeader) ? requestIdHeader[0] : requestIdHeader;
    const correlationId = Array.isArray(correlationHeader) ? correlationHeader[0] : correlationHeader;
    const demoActorId = Array.isArray(demoActorHeader) ? demoActorHeader[0] : demoActorHeader;

    // The production auth adapter will verify the OIDC JWT and put its `sub` here.
    // Direct actor headers are intentionally restricted to non-production fixtures.
    const actorId =
      bearerSubject(request.headers.authorization) ??
      (process.env.NODE_ENV !== 'production' ? demoActorId : undefined);

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
