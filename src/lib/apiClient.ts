const TOKEN_STORAGE_KEY = 'kanban.token'

const configuredBaseUrl = import.meta.env?.VITE_API_URL ?? ''

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }

  get isUnauthorized() {
    return this.status === 401
  }

  get isConflict() {
    return this.status === 409
  }

  get isValidationFailure() {
    return this.status === 422
  }
}

function readStoredToken() {
  if (typeof localStorage === 'undefined') {
    return null
  }

  return localStorage.getItem(TOKEN_STORAGE_KEY)
}

let authToken = readStoredToken()

export function getAuthToken() {
  return authToken
}

export function setAuthToken(token: string) {
  authToken = token

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
  }
}

export function clearAuthToken() {
  authToken = null

  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
  }
}

type QueryValue = string | number | boolean | null | undefined

type RequestOptions = {
  body?: unknown
  query?: Record<string, QueryValue>
  signal?: AbortSignal
}

function buildUrl(path: string, query?: Record<string, QueryValue>) {
  const search = new URLSearchParams()

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === null || value === undefined || value === '') {
      continue
    }

    search.set(key, String(value))
  }

  const queryString = search.toString()

  return `${configuredBaseUrl}/api${path}${queryString ? `?${queryString}` : ''}`
}

function buildHeaders(body: unknown) {
  const headers = new Headers()

  if (authToken) {
    headers.set('authorization', `Bearer ${authToken}`)
  }

  if (body !== undefined && !(body instanceof FormData)) {
    headers.set('content-type', 'application/json')
  }

  return headers
}

function buildBody(body: unknown) {
  if (body === undefined) {
    return undefined
  }

  return body instanceof FormData ? body : JSON.stringify(body)
}

async function readErrorPayload(response: Response) {
  try {
    const payload = (await response.json()) as {
      error?: { code?: string; message?: string; details?: unknown }
    }

    return payload.error ?? {}
  } catch {
    return {}
  }
}

async function send(method: string, path: string, options: RequestOptions) {
  let response: Response

  try {
    response = await fetch(buildUrl(path, options.query), {
      method,
      headers: buildHeaders(options.body),
      body: buildBody(options.body),
      signal: options.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }

    throw new ApiError(0, 'NETWORK_ERROR', 'The server could not be reached')
  }

  if (!response.ok) {
    const { code, message, details } = await readErrorPayload(response)

    throw new ApiError(
      response.status,
      code ?? 'REQUEST_FAILED',
      message ?? `Request failed with status ${response.status}`,
      details,
    )
  }

  return response
}

async function request<Result>(method: string, path: string, options: RequestOptions = {}) {
  const response = await send(method, path, options)

  if (response.status === 204) {
    return undefined as Result
  }

  return (await response.json()) as Result
}

export const apiClient = {
  get: <Result>(path: string, options?: RequestOptions) =>
    request<Result>('GET', path, options ?? {}),
  post: <Result>(path: string, body?: unknown, options?: RequestOptions) =>
    request<Result>('POST', path, { ...options, body }),
  patch: <Result>(path: string, body?: unknown, options?: RequestOptions) =>
    request<Result>('PATCH', path, { ...options, body }),
  put: <Result>(path: string, body?: unknown, options?: RequestOptions) =>
    request<Result>('PUT', path, { ...options, body }),
  delete: <Result = void>(path: string, options?: RequestOptions) =>
    request<Result>('DELETE', path, options ?? {}),
  blob: async (path: string, options?: RequestOptions) => {
    const response = await send('GET', path, options ?? {})

    return response.blob()
  },
}
