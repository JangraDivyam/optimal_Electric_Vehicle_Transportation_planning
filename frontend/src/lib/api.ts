import { EVRequest, RecommendationResponse } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class ApiError extends Error {
  statusCode: number;
  userMessage: string;

  constructor(statusCode: number, message: string, userMessage: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.userMessage = userMessage;
  }
}

/**
 * Check backend health
 */
export async function checkHealth(): Promise<{ status: string; stations_loaded: number }> {
  try {
    const res = await fetch(`${BASE_URL}/health`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new ApiError(
        res.status,
        `Health check failed with status ${res.status}`,
        'The recommendation service is temporarily unavailable. Please try again.'
      );
    }

    return await res.json();
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      0,
      err instanceof Error ? err.message : 'Network error',
      'Unable to connect to the recommendation service.'
    );
  }
}

/**
 * Fetch Top 10 recommendations from backend
 */
export async function getRecommendations(
  request: EVRequest
): Promise<RecommendationResponse> {
  let response: Response;

  try {
    response = await fetch(`${BASE_URL}/recommend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(request),
    });
  } catch (networkErr: unknown) {
    throw new ApiError(
      0,
      networkErr instanceof Error ? networkErr.message : 'Network failure',
      'Unable to connect to the recommendation service.'
    );
  }

  if (response.status === 400) {
    let detail = '';
    try {
      const errBody = await response.json();
      detail = errBody.detail ? `: ${errBody.detail}` : '';
    } catch {
      // ignore
    }
    throw new ApiError(
      400,
      `Bad Request${detail}`,
      'We couldn\'t process your journey details. Please check your inputs.'
    );
  }

  if (response.status >= 500) {
    throw new ApiError(
      response.status,
      `Server Error ${response.status}`,
      'The recommendation service is temporarily unavailable. Please try again.'
    );
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      `Unexpected error ${response.status}`,
      'We couldn\'t process your request. Please try again.'
    );
  }

  return await response.json();
}
