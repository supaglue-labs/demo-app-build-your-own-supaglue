type ErrorOrigin = 'supaglue' | 'remote-provider'
type ErrorParams = {
  detail: string
  status: number
  code: string
  origin?: ErrorOrigin
  cause?: any
}

export class SGError extends Error {
  status: number
  code: string
  detail: string
  meta: {origin: ErrorOrigin; cause?: any}
  httpCode = 500
  constructor(
    message: string,
    {detail, status, code, origin, cause}: ErrorParams,
  ) {
    super(message)
    this.name = this.constructor.name
    this.status = status
    this.code = code
    this.detail = detail
    this.meta = {origin: origin ?? 'supaglue', cause}
    this.cause = cause
  }
}

export class HTTPError extends SGError {
  constructor(
    message: string,
    {detail, status, code, origin, cause}: Partial<ErrorParams>,
  ) {
    status = status ?? 500
    code = code ?? 'INTERNAL_SERVER_ERROR'
    super(message, {detail: detail ?? message, status, code, origin, cause})
  }
}

export class BadRequestError extends HTTPError {
  override httpCode = 400
  constructor(
    message?: string,
    {detail, status, cause, origin}: Omit<Partial<ErrorParams>, 'code'> = {},
  ) {
    super(message ?? 'Bad request', {
      detail,
      status: status ?? 400,
      code: 'BAD_REQUEST',
      origin,
      cause,
    })
  }
}
