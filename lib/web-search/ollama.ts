/**
 * Ollama Web Search Integration
 *
 * Uses REST API via proxyFetch for reliable proxy support.
 * Ollama search endpoint: POST https://ollama.com/api/web_search
 */

import { proxyFetch } from '@/lib/server/proxy-fetch';
import type { WebSearchResult, WebSearchSource } from '@/lib/types/web-search';

const OLLAMA_SEARCH_API_URL = 'https://ollama.com/api/web_search';

/**
 * Search the web using Ollama REST API and return structured results.
 */
export async function searchWithOllama(params: {
  query: string;
  apiKey: string;
  maxResults?: number;
  baseUrl?: string;
}): Promise<WebSearchResult> {
  const { query, apiKey, maxResults = 5, baseUrl } = params;

  const apiUrl = baseUrl
    ? `${baseUrl.replace(/\/$/, '')}/api/web_search`
    : OLLAMA_SEARCH_API_URL;

  const startTime = Date.now();

  const res = await proxyFetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query,
      max_results: Math.min(maxResults, 10), // Ollama max is 10
    }),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(`Ollama Web Search API error (${res.status}): ${errorText || res.statusText}`);
  }

  const data = (await res.json()) as {
    results: Array<{
      title: string;
      url: string;
      content: string;
    }>;
  };

  const responseTime = Date.now() - startTime;

  const sources: WebSearchSource[] = (data.results || []).map((r) => ({
    title: r.title,
    url: r.url,
    content: r.content,
    score: 1, // Ollama doesn't currently return a numeric score in the docs
  }));

  return {
    answer: '', // Ollama web_search returns results list, not a direct answer
    sources,
    query,
    responseTime,
  };
}
