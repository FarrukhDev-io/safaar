import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

interface ErrorBody {
  code?: string;
  message?: string | string[];
  error?: string;
  fields?: unknown;
}

function normalizeError(exception: unknown): {
  status: number;
  code: string;
  message: string;
  fields: unknown;
} {
  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    const response = exception.getResponse();

    if (typeof response === 'object' && response !== null) {
      const body = response as ErrorBody;
      const message = Array.isArray(body.message)
        ? body.message.join(', ')
        : (body.message ?? exception.message);

      return {
        status,
        code: body.code ?? body.error ?? 'REQUEST_ERROR',
        message,
        fields:
          body.fields ?? (Array.isArray(body.message) ? body.message : null),
      };
    }

    return {
      status,
      code: 'REQUEST_ERROR',
      message: String(response),
      fields: null,
    };
  }

  return {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    code: 'INTERNAL_ERROR',
    message: 'Kutilmagan server xatosi',
    fields: null,
  };
}

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    if (!(exception instanceof HttpException)) {
      // Kutilmagan (nazoratsiz) xatolar — sabab bilinmasa production'da
      // debug qilib bo'lmaydi, shuning uchun to'liq stack trace logga
      // yoziladi.
      this.logger.error(
        exception instanceof Error ? exception.stack : exception,
      );
    }
    const context = host.switchToHttp();
    const response = context.getResponse<{
      status: (code: number) => { json: (body: unknown) => void };
    }>();
    const request = context.getRequest<{
      headers: Record<string, string | string[] | undefined>;
    }>();
    const requestIdHeader = request.headers['x-request-id'];
    const requestId = Array.isArray(requestIdHeader)
      ? requestIdHeader[0]
      : (requestIdHeader ?? 'local-request');
    const error = normalizeError(exception);

    if (
      request.headers['x-legacy-api-prefix'] === 'true' ||
      (request as { legacyApiPrefix?: boolean; originalUrl?: string })
        .legacyApiPrefix ||
      (request as { originalUrl?: string }).originalUrl?.startsWith('/api')
    ) {
      response.status(error.status).json({
        statusCode: error.status,
        code: error.code,
        message: error.message,
        fields: error.fields,
        meta: {
          request_id: requestId,
        },
      });
      return;
    }

    response.status(error.status).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        fields: error.fields,
      },
      meta: {
        request_id: requestId,
      },
    });
  }
}
