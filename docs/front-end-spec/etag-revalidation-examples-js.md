# ETag Revalidation Examples (JS)

```ts
// JSON with If-None-Match
async function fetchWithEtag(url) {
  const res1 = await fetch(url);
  const etag = res1.headers.get('ETag');
  if (!etag) return await res1.json();
  const res2 = await fetch(url, { headers: { 'If-None-Match': etag } });
  if (res2.status === 304) return null; // not modified
  return await res2.json();
}

// CSV with If-Modified-Since
async function fetchCsvWithLastModified(url) {
  const res1 = await fetch(url);
  const lm = res1.headers.get('Last-Modified');
  if (!lm) return await res1.text();
  const res2 = await fetch(url, { headers: { 'If-Modified-Since': lm } });
  if (res2.status === 304) return null;
  return await res2.text();
}
```
