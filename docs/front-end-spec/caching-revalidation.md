# Caching & Revalidation

Add examples for `If-None-Match` and `If-Modified-Since` for JSON and CSV.

### Locale-aware CSV downloads

- Trends, Funnel, Reviews Summary, and Coupons Issued support localized CSV headers for `en`, `es`, `fr`, `pt`.
- Send `Accept-Language: <locale>` to localize header row and set `Content-Language`.
- CSV filenames include locale suffix and RFC5987 `filename*` parameter. The browser should honor `filename*`; a plain ASCII `filename` fallback is also provided.

Example (download via fetch → blob):

```ts
const res = await fetch('/api/business/analytics/trends?format=csv', { headers: { 'Accept-Language': 'fr-FR' } });
const blob = await res.blob();
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
 a.href = url;
 a.download = 'fallback.csv'; // server sets filename via headers
 a.click();
 URL.revokeObjectURL(url);
```

### cURL recipes (JSON/CSV with Accept-Language)

```bash