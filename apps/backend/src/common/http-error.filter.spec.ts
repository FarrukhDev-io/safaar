import { ArgumentsHost, BadRequestException } from '@nestjs/common';
import { HttpErrorFilter } from './http-error.filter';

function hostWith(headers: Record<string, string> = {}) {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => ({ headers }),
    }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
}

describe('HttpErrorFilter (regression: H-5 malformed input -> 500 instead of 400)', () => {
  const filter = new HttpErrorFilter();

  it('turns a Postgres invalid-UUID error (22P02) into a 400, not a 500', () => {
    const { host, status, json } = hostWith();
    const pgError = Object.assign(
      new Error('invalid input syntax for type uuid: "not-a-uuid"'),
      { code: '22P02' },
    );

    filter.catch(pgError, host);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'INVALID_INPUT' }),
      }),
    );
  });

  it('turns any Postgres "22xxx" data-exception into a 400 (e.g. invalid date format)', () => {
    const { host, status } = hostWith();
    const pgError = Object.assign(new Error('invalid date format'), {
      code: '22007',
    });

    filter.catch(pgError, host);

    expect(status).toHaveBeenCalledWith(400);
  });

  it('still returns 500 for a genuinely unexpected error with no Postgres code', () => {
    const { host, status, json } = hostWith();

    filter.catch(new Error('kutilmagan xato'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'INTERNAL_ERROR' }),
      }),
    );
  });

  it('still respects a deliberately thrown HttpException as before', () => {
    const { host, status, json } = hostWith();

    filter.catch(
      new BadRequestException({ code: 'MY_CODE', message: 'aniq xato' }),
      host,
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'MY_CODE',
          message: 'aniq xato',
        }),
      }),
    );
  });
});
