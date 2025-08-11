
import {createRequire as ___nfyCreateRequire} from "module";
import {fileURLToPath as ___nfyFileURLToPath} from "url";
import {dirname as ___nfyPathDirname} from "path";
let __filename=___nfyFileURLToPath(import.meta.url);
let __dirname=___nfyPathDirname(___nfyFileURLToPath(import.meta.url));
let require=___nfyCreateRequire(import.meta.url);


// packages/shared/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";
function readEnv(name) {
  try {
    if (typeof Netlify !== "undefined" && Netlify?.env?.get) {
      const v = Netlify.env.get(name);
      if (v)
        return v;
    }
  } catch {
  }
  return globalThis?.process?.env?.[name];
}
function createSupabaseClient(useServiceRole = false) {
  const url = readEnv("SUPABASE_URL");
  const anon = readEnv("SUPABASE_ANON_KEY");
  const service = readEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anon && !service) {
    throw new Error("Supabase env vars not set (SUPABASE_URL and key).");
  }
  const key = useServiceRole && service ? service : anon;
  return createClient(url, key, {
    auth: { persistSession: false }
  });
}

// apps/api/functions/users-wishlist-post.ts
var users_wishlist_post_default = async (req) => {
  if (req.method !== "POST")
    return new Response("Method Not Allowed", { status: 405 });
  const url = new URL(req.url);
  const parts = url.pathname.split("/");
  const userId = parts[3] || "";
  try {
    const body = await req.json();
    const { item_name, item_description } = body || {};
    if (!userId || typeof item_name !== "string") {
      return new Response(JSON.stringify({ ok: false, error: "Invalid payload" }), { status: 400 });
    }
    const category = "Shopping";
    const subcategory_l1 = "General";
    const subcategory_l2 = "Unspecified";
    const supabase = createSupabaseClient(true);
    const { error } = await supabase.from("wishlist_items").insert({
      user_id: userId,
      item_name,
      item_description,
      category,
      subcategory_l1,
      subcategory_l2
    });
    if (error) {
      return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
    }
    return new Response(
      JSON.stringify({ ok: true, userId, item_name, item_description, category, subcategory_l1, subcategory_l2 }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || "Bad Request" }), { status: 400 });
  }
};
var config = {
  path: "/api/users/:userId/wishlist"
};
export {
  config,
  users_wishlist_post_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsicGFja2FnZXMvc2hhcmVkL3N1cGFiYXNlQ2xpZW50LnRzIiwgImFwcHMvYXBpL2Z1bmN0aW9ucy91c2Vycy13aXNobGlzdC1wb3N0LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvLyBTdXBhYmFzZSBjbGllbnQgZmFjdG9yeVxyXG4vLyBSZWFkcyBlbnYgZnJvbSBOZXRsaWZ5IChOZXRsaWZ5LmVudikgaWYgYXZhaWxhYmxlLCBvdGhlcndpc2UgcHJvY2Vzcy5lbnZcclxuXHJcbmltcG9ydCB0eXBlIHsgU3VwYWJhc2VDbGllbnQgYXMgU3VwYWJhc2VKc0NsaWVudCB9IGZyb20gJ0BzdXBhYmFzZS9zdXBhYmFzZS1qcyc7XHJcbmltcG9ydCB7IGNyZWF0ZUNsaWVudCB9IGZyb20gJ0BzdXBhYmFzZS9zdXBhYmFzZS1qcyc7XHJcblxyXG5mdW5jdGlvbiByZWFkRW52KG5hbWU6IHN0cmluZyk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XHJcbiAgdHJ5IHtcclxuICAgIC8vIEB0cy1pZ25vcmUgLSBOZXRsaWZ5IGdsb2JhbCBtYXkgZXhpc3QgYXQgcnVudGltZVxyXG4gICAgaWYgKHR5cGVvZiBOZXRsaWZ5ICE9PSAndW5kZWZpbmVkJyAmJiBOZXRsaWZ5Py5lbnY/LmdldCkge1xyXG4gICAgICAvLyBAdHMtaWdub3JlXHJcbiAgICAgIGNvbnN0IHYgPSBOZXRsaWZ5LmVudi5nZXQobmFtZSk7XHJcbiAgICAgIGlmICh2KSByZXR1cm4gdiBhcyBzdHJpbmc7XHJcbiAgICB9XHJcbiAgfSBjYXRjaCB7fVxyXG4gIC8vIEZhbGxiYWNrXHJcbiAgLy8gQHRzLWlnbm9yZVxyXG4gIHJldHVybiAoZ2xvYmFsVGhpcyBhcyBhbnkpPy5wcm9jZXNzPy5lbnY/LltuYW1lXSBhcyBzdHJpbmcgfCB1bmRlZmluZWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTdXBhYmFzZUNsaWVudCh1c2VTZXJ2aWNlUm9sZSA9IGZhbHNlKTogU3VwYWJhc2VKc0NsaWVudCB7XHJcbiAgY29uc3QgdXJsID0gcmVhZEVudignU1VQQUJBU0VfVVJMJyk7XHJcbiAgY29uc3QgYW5vbiA9IHJlYWRFbnYoJ1NVUEFCQVNFX0FOT05fS0VZJyk7XHJcbiAgY29uc3Qgc2VydmljZSA9IHJlYWRFbnYoJ1NVUEFCQVNFX1NFUlZJQ0VfUk9MRV9LRVknKTtcclxuICBpZiAoIXVybCB8fCAoIWFub24gJiYgIXNlcnZpY2UpKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1N1cGFiYXNlIGVudiB2YXJzIG5vdCBzZXQgKFNVUEFCQVNFX1VSTCBhbmQga2V5KS4nKTtcclxuICB9XHJcbiAgY29uc3Qga2V5ID0gdXNlU2VydmljZVJvbGUgJiYgc2VydmljZSA/IHNlcnZpY2UgOiAoYW5vbiBhcyBzdHJpbmcpO1xyXG4gIHJldHVybiBjcmVhdGVDbGllbnQodXJsLCBrZXksIHtcclxuICAgIGF1dGg6IHsgcGVyc2lzdFNlc3Npb246IGZhbHNlIH0sXHJcbiAgfSk7XHJcbn1cclxuIiwgImltcG9ydCB7IGNyZWF0ZVN1cGFiYXNlQ2xpZW50IH0gZnJvbSAnLi4vLi4vLi4vcGFja2FnZXMvc2hhcmVkL3N1cGFiYXNlQ2xpZW50JztcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGFzeW5jIChyZXE6IFJlcXVlc3QpID0+IHtcclxuICBpZiAocmVxLm1ldGhvZCAhPT0gJ1BPU1QnKSByZXR1cm4gbmV3IFJlc3BvbnNlKCdNZXRob2QgTm90IEFsbG93ZWQnLCB7IHN0YXR1czogNDA1IH0pO1xyXG4gIGNvbnN0IHVybCA9IG5ldyBVUkwocmVxLnVybCk7XHJcbiAgY29uc3QgcGFydHMgPSB1cmwucGF0aG5hbWUuc3BsaXQoJy8nKTtcclxuICBjb25zdCB1c2VySWQgPSBwYXJ0c1szXSB8fCAnJztcclxuICB0cnkge1xyXG4gICAgY29uc3QgYm9keSA9IGF3YWl0IHJlcS5qc29uKCk7XHJcbiAgICBjb25zdCB7IGl0ZW1fbmFtZSwgaXRlbV9kZXNjcmlwdGlvbiB9ID0gYm9keSB8fCB7fTtcclxuICAgIGlmICghdXNlcklkIHx8IHR5cGVvZiBpdGVtX25hbWUgIT09ICdzdHJpbmcnKSB7XHJcbiAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UoSlNPTi5zdHJpbmdpZnkoeyBvazogZmFsc2UsIGVycm9yOiAnSW52YWxpZCBwYXlsb2FkJyB9KSwgeyBzdGF0dXM6IDQwMCB9KTtcclxuICAgIH1cclxuICAgIC8vIG5haXZlIGNhdGVnb3JpemF0aW9uIHBsYWNlaG9sZGVyXHJcbiAgICBjb25zdCBjYXRlZ29yeSA9ICdTaG9wcGluZyc7XHJcbiAgICBjb25zdCBzdWJjYXRlZ29yeV9sMSA9ICdHZW5lcmFsJztcclxuICAgIGNvbnN0IHN1YmNhdGVnb3J5X2wyID0gJ1Vuc3BlY2lmaWVkJztcclxuXHJcbiAgICBjb25zdCBzdXBhYmFzZSA9IGNyZWF0ZVN1cGFiYXNlQ2xpZW50KHRydWUpO1xyXG4gICAgY29uc3QgeyBlcnJvciB9ID0gYXdhaXQgc3VwYWJhc2UuZnJvbSgnd2lzaGxpc3RfaXRlbXMnKS5pbnNlcnQoe1xyXG4gICAgICB1c2VyX2lkOiB1c2VySWQsXHJcbiAgICAgIGl0ZW1fbmFtZSxcclxuICAgICAgaXRlbV9kZXNjcmlwdGlvbixcclxuICAgICAgY2F0ZWdvcnksXHJcbiAgICAgIHN1YmNhdGVnb3J5X2wxLFxyXG4gICAgICBzdWJjYXRlZ29yeV9sMixcclxuICAgIH0pO1xyXG4gICAgaWYgKGVycm9yKSB7XHJcbiAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UoSlNPTi5zdHJpbmdpZnkoeyBvazogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIH0pLCB7IHN0YXR1czogNTAwIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBuZXcgUmVzcG9uc2UoXHJcbiAgICAgIEpTT04uc3RyaW5naWZ5KHsgb2s6IHRydWUsIHVzZXJJZCwgaXRlbV9uYW1lLCBpdGVtX2Rlc2NyaXB0aW9uLCBjYXRlZ29yeSwgc3ViY2F0ZWdvcnlfbDEsIHN1YmNhdGVnb3J5X2wyIH0pLFxyXG4gICAgICB7IGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9IH1cclxuICAgICk7XHJcbiAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICByZXR1cm4gbmV3IFJlc3BvbnNlKEpTT04uc3RyaW5naWZ5KHsgb2s6IGZhbHNlLCBlcnJvcjogZT8ubWVzc2FnZSB8fCAnQmFkIFJlcXVlc3QnIH0pLCB7IHN0YXR1czogNDAwIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbmV4cG9ydCBjb25zdCBjb25maWcgPSB7XHJcbiAgcGF0aDogJy9hcGkvdXNlcnMvOnVzZXJJZC93aXNobGlzdCcsXHJcbn07XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7QUFJQSxTQUFTLG9CQUFvQjtBQUU3QixTQUFTLFFBQVEsTUFBa0M7QUFDakQsTUFBSTtBQUVGLFFBQUksT0FBTyxZQUFZLGVBQWUsU0FBUyxLQUFLLEtBQUs7QUFFdkQsWUFBTSxJQUFJLFFBQVEsSUFBSSxJQUFJLElBQUk7QUFDOUIsVUFBSTtBQUFHLGVBQU87QUFBQSxJQUNoQjtBQUFBLEVBQ0YsUUFBUTtBQUFBLEVBQUM7QUFHVCxTQUFRLFlBQW9CLFNBQVMsTUFBTSxJQUFJO0FBQ2pEO0FBRU8sU0FBUyxxQkFBcUIsaUJBQWlCLE9BQXlCO0FBQzdFLFFBQU0sTUFBTSxRQUFRLGNBQWM7QUFDbEMsUUFBTSxPQUFPLFFBQVEsbUJBQW1CO0FBQ3hDLFFBQU0sVUFBVSxRQUFRLDJCQUEyQjtBQUNuRCxNQUFJLENBQUMsT0FBUSxDQUFDLFFBQVEsQ0FBQyxTQUFVO0FBQy9CLFVBQU0sSUFBSSxNQUFNLG1EQUFtRDtBQUFBLEVBQ3JFO0FBQ0EsUUFBTSxNQUFNLGtCQUFrQixVQUFVLFVBQVc7QUFDbkQsU0FBTyxhQUFhLEtBQUssS0FBSztBQUFBLElBQzVCLE1BQU0sRUFBRSxnQkFBZ0IsTUFBTTtBQUFBLEVBQ2hDLENBQUM7QUFDSDs7O0FDN0JBLElBQU8sOEJBQVEsT0FBTyxRQUFpQjtBQUNyQyxNQUFJLElBQUksV0FBVztBQUFRLFdBQU8sSUFBSSxTQUFTLHNCQUFzQixFQUFFLFFBQVEsSUFBSSxDQUFDO0FBQ3BGLFFBQU0sTUFBTSxJQUFJLElBQUksSUFBSSxHQUFHO0FBQzNCLFFBQU0sUUFBUSxJQUFJLFNBQVMsTUFBTSxHQUFHO0FBQ3BDLFFBQU0sU0FBUyxNQUFNLENBQUMsS0FBSztBQUMzQixNQUFJO0FBQ0YsVUFBTSxPQUFPLE1BQU0sSUFBSSxLQUFLO0FBQzVCLFVBQU0sRUFBRSxXQUFXLGlCQUFpQixJQUFJLFFBQVEsQ0FBQztBQUNqRCxRQUFJLENBQUMsVUFBVSxPQUFPLGNBQWMsVUFBVTtBQUM1QyxhQUFPLElBQUksU0FBUyxLQUFLLFVBQVUsRUFBRSxJQUFJLE9BQU8sT0FBTyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsUUFBUSxJQUFJLENBQUM7QUFBQSxJQUM5RjtBQUVBLFVBQU0sV0FBVztBQUNqQixVQUFNLGlCQUFpQjtBQUN2QixVQUFNLGlCQUFpQjtBQUV2QixVQUFNLFdBQVcscUJBQXFCLElBQUk7QUFDMUMsVUFBTSxFQUFFLE1BQU0sSUFBSSxNQUFNLFNBQVMsS0FBSyxnQkFBZ0IsRUFBRSxPQUFPO0FBQUEsTUFDN0QsU0FBUztBQUFBLE1BQ1Q7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRixDQUFDO0FBQ0QsUUFBSSxPQUFPO0FBQ1QsYUFBTyxJQUFJLFNBQVMsS0FBSyxVQUFVLEVBQUUsSUFBSSxPQUFPLE9BQU8sTUFBTSxRQUFRLENBQUMsR0FBRyxFQUFFLFFBQVEsSUFBSSxDQUFDO0FBQUEsSUFDMUY7QUFFQSxXQUFPLElBQUk7QUFBQSxNQUNULEtBQUssVUFBVSxFQUFFLElBQUksTUFBTSxRQUFRLFdBQVcsa0JBQWtCLFVBQVUsZ0JBQWdCLGVBQWUsQ0FBQztBQUFBLE1BQzFHLEVBQUUsU0FBUyxFQUFFLGdCQUFnQixtQkFBbUIsRUFBRTtBQUFBLElBQ3BEO0FBQUEsRUFDRixTQUFTLEdBQVE7QUFDZixXQUFPLElBQUksU0FBUyxLQUFLLFVBQVUsRUFBRSxJQUFJLE9BQU8sT0FBTyxHQUFHLFdBQVcsY0FBYyxDQUFDLEdBQUcsRUFBRSxRQUFRLElBQUksQ0FBQztBQUFBLEVBQ3hHO0FBQ0Y7QUFFTyxJQUFNLFNBQVM7QUFBQSxFQUNwQixNQUFNO0FBQ1I7IiwKICAibmFtZXMiOiBbXQp9Cg==
