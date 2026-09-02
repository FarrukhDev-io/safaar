import { of, throwError } from 'rxjs';
import { HttpException } from '@nestjs/common';
import type { CallHandler, ExecutionContext } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { PerformanceInterceptor } from './performance.interceptor';

/**
 * Regression for a production report: a rejected `POST /v1/auth/oauth/register`
 * (invalid registration token) was logged as `status_code: 201` — the route's
 * bare `@Post()` default — instead of the real 401 the client received.
 * Root cause: the interceptor read `response.statusCode` in the error
 * branch, before NestJS's exception filter had applied the real status.
 */
describe('PerformanceInterceptor (logged status_code on thrown errors)', () => {
  const config = { get: () => undefined } as unknown as ConfigService;

  function buildContext(defaultStatusCode: number) {
    const response = { statusCode: defaultStatusCode, setHeader: jest.fn() };
    const request = {
      method: 'POST',
      originalUrl: '/v1/auth/oauth/register',
      headers: {},
    };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as unknown as ExecutionContext;
    return { context, response, request };
  }

  function loggedEventFor(handler: CallHandler, level: 'warn' | 'log') {
    const interceptor = new PerformanceInterceptor(config);
    const spy = jest.spyOn(
      (interceptor as unknown as { logger: Record<'warn' | 'log', jest.Mock> })
        .logger,
      level,
    );
    const { context } = buildContext(201);

    return new Promise<Record<string, unknown>>((resolve) => {
      interceptor.intercept(context, handler).subscribe({
        next: () => resolve(JSON.parse(spy.mock.calls[0][0] as string)),
        error: () => resolve(JSON.parse(spy.mock.calls[0][0] as string)),
      });
    });
  }

  it('logs the real status for a thrown HttpException(401)', async () => {
    const handler: CallHandler = {
      handle: () =>
        throwError(
          () => new HttpException({ code: 'OAUTH_REGISTRATION_EXPIRED' }, 401),
        ),
    };
    const logged = await loggedEventFor(handler, 'warn');
    expect(logged.status_code).toBe(401);
  });

  it('logs the real status for a thrown HttpException(400)', async () => {
    const handler: CallHandler = {
      handle: () =>
        throwError(
          () =>
            new HttpException({ code: 'OAUTH_ACCOUNT_ALREADY_LINKED' }, 400),
        ),
    };
    const logged = await loggedEventFor(handler, 'warn');
    expect(logged.status_code).toBe(400);
  });

  it('logs 500 for a thrown generic (non-Http) Error', async () => {
    const handler: CallHandler = {
      handle: () => throwError(() => new Error('unexpected')),
    };
    const logged = await loggedEventFor(handler, 'warn');
    expect(logged.status_code).toBe(500);
  });

  it('preserves existing behavior for a successful response (uses response.statusCode)', async () => {
    const handler: CallHandler = { handle: () => of({ ok: true }) };
    const logged = await loggedEventFor(handler, 'log');
    expect(logged.status_code).toBe(201);
  });
});
