export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem("studhub_token");
  const isFormData = options.body instanceof FormData;

  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
    },
  });

  if (res.status === 401) {
    localStorage.removeItem("studhub_token");
    window.dispatchEvent(new Event("studhub:session-expired"));
  }

  return res;
}