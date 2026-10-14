import { config } from '../../config/index.js';
import {
  ExternalProviderRateLimitError,
  ExternalProviderTimeoutError,
  ExternalProviderUnavailableError,
  ExternalResourceNotFoundError,
  BadRequestError,
} from '../../errors/index.js';
import { BoundedTtlCache } from './cache.js';
import { RequestThrottler } from './throttler.js';

export interface JikanClientOptions {
  baseUrl?: string;
  timeoutMs?: number;
  maxRetries?: number;
  cacheTtlMs?: number;
  cacheMaxEntries?: number;
  minIntervalMs?: number;
  fetchFn?: typeof fetch;
  sleepFn?: (ms: number) => Promise<void>;
}

export class JikanClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly cache: BoundedTtlCache<unknown>;
  private readonly throttler: RequestThrottler;
  private readonly fetchFn: typeof fetch;
  private readonly sleepFn: (ms: number) => Promise<void>;

  constructor(options: JikanClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? config.JIKAN_BASE_URL).replace(/\/+$/, '');
    this.timeoutMs = options.timeoutMs ?? config.REQUEST_TIMEOUT_MS;
    this.maxRetries = options.maxRetries ?? 2; // 1 initial + up to 2 retries = 3 total
    this.cache = new BoundedTtlCache(
      options.cacheTtlMs ?? config.JIKAN_CACHE_TTL_MS,
      options.cacheMaxEntries ?? config.JIKAN_CACHE_MAX_ENTRIES
    );
    this.throttler = new RequestThrottler(options.minIntervalMs ?? config.JIKAN_MIN_REQUEST_INTERVAL_MS);
    this.fetchFn = options.fetchFn ?? globalThis.fetch.bind(globalThis);
    this.sleepFn = options.sleepFn ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));
  }

  /**
   * Search anime or manga candidates via Jikan v4.
   */
  async search(mediaType: 'anime' | 'manga', query: string, page = 1, limit = 10): Promise<any> {
    const trimmed = query.trim();
    if (!trimmed) {
      throw new BadRequestError('Search query cannot be empty');
    }

    const safeLimit = Math.min(Math.max(limit, 1), 25);
    const safePage = Math.max(page, 1);

    const cacheKey = `search:${mediaType}:${safePage}:${safeLimit}:${trimmed.toLowerCase()}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const url = `${this.baseUrl}/${mediaType}?q=${encodeURIComponent(trimmed)}&page=${safePage}&limit=${safeLimit}`;
    const data = await this.fetchWithResilience(url);

    this.cache.set(cacheKey, data);
    return data;
  }

  /**
   * Fetch full metadata details for a given MAL ID.
   */
  async getDetail(mediaType: 'anime' | 'manga', id: number): Promise<any> {
    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new BadRequestError('Invalid MyAnimeList ID');
    }

    const cacheKey = `detail:${mediaType}:${id}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const url = `${this.baseUrl}/${mediaType}/${id}/full`;
    const data = await this.fetchWithResilience(url);

    this.cache.set(cacheKey, data);
    return data;
  }

  /**
   * Clears the in-memory cache.
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Test helper to inject a custom fetch implementation.
   */
  setFetchFn(fn: typeof fetch): void {
    (this as any).fetchFn = fn;
  }

  /**
   * Test helper to reset fetch implementation.
   */
  resetFetchFn(): void {
    (this as any).fetchFn = globalThis.fetch.bind(globalThis);
  }

  /**
   * Internal resilient fetch with timeout, rate limit handling, and bounded backoff.
   */
  private async fetchWithResilience(url: string): Promise<any> {
    let attempt = 0;

    while (attempt <= this.maxRetries) {
      attempt++;

      // Apply server-side inter-request throttling
      await this.throttler.throttle();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const response = await this.fetchFn(url, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'User-Agent': 'AnimeManager/1.0 (Personal Media Library)',
          },
          signal: controller.signal,
          redirect: 'error', // Defend against SSRF via redirects
        });

        clearTimeout(timeoutId);

        // 1. Success
        if (response.ok) {
          let json: any;
          try {
            json = await response.json();
          } catch {
            throw new ExternalProviderUnavailableError(
              'MyAnimeList API returned a malformed JSON response'
            );
          }

          if (!json || typeof json !== 'object') {
            throw new ExternalProviderUnavailableError(
              'MyAnimeList API returned an unexpected response structure'
            );
          }

          return json;
        }

        // 2. HTTP 404 (Not Found) - Do not retry
        if (response.status === 404) {
          throw new ExternalResourceNotFoundError(
            'The requested entry was not found on MyAnimeList'
          );
        }

        // 3. HTTP 429 (Rate Limit) - Bounded retry
        if (response.status === 429) {
          if (attempt <= this.maxRetries) {
            const retryAfterHeader = response.headers?.get?.('Retry-After');
            let delayMs = 1000 * Math.pow(2, attempt - 1); // 1s, 2s

            if (retryAfterHeader) {
              const parsedSeconds = parseInt(retryAfterHeader, 10);
              if (!isNaN(parsedSeconds) && parsedSeconds > 0) {
                delayMs = Math.min(parsedSeconds * 1000, 5000); // clamp to 5s max
              }
            }

            await this.sleepFn(delayMs);
            continue;
          }

          throw new ExternalProviderRateLimitError(
            'MyAnimeList rate limit exceeded. Please wait a moment and try again.'
          );
        }

        // 4. HTTP 503 / 502 / 504 (Transient upstream server errors) - Bounded retry
        if (response.status === 502 || response.status === 503 || response.status === 504) {
          if (attempt <= this.maxRetries) {
            const delayMs = 500 * Math.pow(2, attempt - 1); // 500ms, 1000ms
            await this.sleepFn(delayMs);
            continue;
          }

          throw new ExternalProviderUnavailableError(
            `MyAnimeList API returned upstream error status ${response.status}`
          );
        }

        // 5. Other 4xx Client Errors - Do not retry
        if (response.status >= 400 && response.status < 500) {
          throw new BadRequestError(
            `MyAnimeList API rejected the request with HTTP status ${response.status}`
          );
        }

        // 6. Generic 5xx Server Error
        throw new ExternalProviderUnavailableError(
          `MyAnimeList API failed with status ${response.status}`
        );
      } catch (err: any) {
        clearTimeout(timeoutId);

        // Re-throw our typed domain errors directly
        if (
          err instanceof ExternalResourceNotFoundError ||
          err instanceof ExternalProviderRateLimitError ||
          err instanceof BadRequestError
        ) {
          throw err;
        }

        // Abort / Timeout error
        if (err.name === 'AbortError' || err.code === 'ABORT_ERR') {
          throw new ExternalProviderTimeoutError(
            `MyAnimeList API request timed out after ${this.timeoutMs}ms`
          );
        }

        // Network or fetch connection error (ECONNREFUSED, ENOTFOUND, etc.)
        if (attempt <= this.maxRetries) {
          const delayMs = 500 * Math.pow(2, attempt - 1);
          await this.sleepFn(delayMs);
          continue;
        }

        throw new ExternalProviderUnavailableError(
          `Failed to connect to MyAnimeList: ${err.message || 'Network error'}`
        );
      }
    }

    throw new ExternalProviderUnavailableError('MyAnimeList API request failed after retries');
  }
}

export const jikanClient = new JikanClient();
