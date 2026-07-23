/** Authenticated fetch — sends session cookie to CMS API routes. */
export async function cmsFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetch(input, {
    ...init,
    credentials: 'include',
  })
}
