import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { Observable, tap } from 'rxjs';

type RequestWithPerformance = {
  method?: string;
  originalUrl?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  requestId?: string;
};

type ResponseWithPerformance = {
  statusCode?: number;
  setHeader?: (name: string, value: string) => void;
};

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PerformanceInterceptor.name);
  private readonly slowRequestMs: number;

  constructor(config: ConfigService) {
    this.slowRequestMs = toPositiveInt(
      config.get<string>('SLOW_REQUEST_MS'),
      1000,
    );
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<RequestWithPerformance>();
    const response = http.getResponse<ResponseWithPerformance>();
    const requestId = this.requestId(request);
    const startedAt = performance.now();

    request.requestId = requestId;
    response.setHeader?.('x-request-id', requestId);

    return next.handle().pipe(
      tap({
        next: () =>
          this.logRequest(request, response, startedAt, requestId, undefined),
        error: (error: unknown) =>
          this.logRequest(request, response, startedAt, requestId, error),
      }),
    );
  }

  private requestId(request: RequestWithPerformance): string {
    const header = request.headers['x-request-id'];
    const requestId = Array.isArray(header) ? header[0] : header;
    return requestId || randomUUID();
  }

  private logRequest(
    request: RequestWithPerformance,
    response: ResponseWithPerformance,
    startedAt: number,
    requestId: string,
    error: unknown,
  ) {
    const durationMs = Math.round(performance.now() - startedAt);
    const statusCode = this.statusCodeFor(response, error);
    const event = {
      event: durationMs >= this.slowRequestMs ? 'slow_request' : 'request',
      request_id: requestId,
      method: request.method,
      path: request.originalUrl ?? request.url,
      status_code: statusCode,
      duration_ms: durationMs,
    };

    const line = JSON.stringify(event);
    if (durationMs >= this.slowRequestMs || error) {
      this.logger.warn(line);
      return;
    }

    this.logger.log(line);
  }

  /**
   * `response.statusCode` is only authoritative once NestJS's exception
   * filter has actually written the real status — for a thrown error, this
   * hook runs earlier (as the error propagates through the RxJS pipeline),
   * while `response.statusCode` still holds the route's default optimistic
   * status (e.g. 201 for a bare `@Post()`). Using it for the error branch
   * silently logged successful-looking status codes for real 4xx/5xx
   * responses. The thrown error itself is the only reliable source there.
   */
  private statusCodeFor(
    response: ResponseWithPerformance,
    error: unknown,
  ): number {
    if (error) {
      return error instanceof HttpException ? error.getStatus() : 500;
    }
    return response.statusCode ?? 200;
  }
}

function toPositiveInt(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
