
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

// apps/api/functions/tests-seed-post.ts
import { createClient as createClient2 } from "@supabase/supabase-js";
var tests_seed_post_default = async (req) => {
  if (req.method !== "POST")
    return new Response("Method Not Allowed", { status: 405 });
  let supabase;
  try {
    const maybe = await req.text();
    if (maybe) {
      try {
        const parsed = JSON.parse(maybe);
        const url = parsed?.supabase_url;
        const service = parsed?.service_key;
        if (url && service) {
          supabase = createClient2(url, service, { auth: { persistSession: false } });
        }
      } catch {
      }
    }
    if (!supabase) {
      supabase = createSupabaseClient(true);
    }
    const user1 = "11111111-1111-1111-1111-111111111111";
    const user2 = "22222222-2222-2222-2222-222222222222";
    const biz1 = "33333333-3333-3333-3333-333333333333";
    const coupon1 = "44444444-4444-4444-4444-444444444444";
    await supabase.from("users").upsert({ id: user1, email: "user1@test.local", city: "Bengaluru", interests: ["Shopping"] });
    await supabase.from("users").upsert({ id: user2, email: "user2@test.local", city: "Bengaluru", interests: [] });
    await supabase.from("businesses").upsert({ id: biz1, owner_user_id: user1, email: "biz@test.local", business_name: "Test Biz" });
    await supabase.from("storefronts").upsert({ business_id: biz1, description: "Seeded", theme: "light", is_open: true }, { onConflict: "business_id" });
    await supabase.from("coupons").upsert({ id: coupon1, business_id: biz1, title: "10% OFF", description: "Seed coupon", total_quantity: 100, value: 10 });
    return new Response(
      JSON.stringify({ ok: true, users: [user1, user2], business_id: biz1, coupon_id: coupon1 }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || "Seed error" }), { status: 500 });
  }
};
var config = {
  path: "/api/tests/seed"
};
export {
  config,
  tests_seed_post_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsicGFja2FnZXMvc2hhcmVkL3N1cGFiYXNlQ2xpZW50LnRzIiwgImFwcHMvYXBpL2Z1bmN0aW9ucy90ZXN0cy1zZWVkLXBvc3QudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8vIFN1cGFiYXNlIGNsaWVudCBmYWN0b3J5XHJcbi8vIFJlYWRzIGVudiBmcm9tIE5ldGxpZnkgKE5ldGxpZnkuZW52KSBpZiBhdmFpbGFibGUsIG90aGVyd2lzZSBwcm9jZXNzLmVudlxyXG5cclxuaW1wb3J0IHR5cGUgeyBTdXBhYmFzZUNsaWVudCBhcyBTdXBhYmFzZUpzQ2xpZW50IH0gZnJvbSAnQHN1cGFiYXNlL3N1cGFiYXNlLWpzJztcclxuaW1wb3J0IHsgY3JlYXRlQ2xpZW50IH0gZnJvbSAnQHN1cGFiYXNlL3N1cGFiYXNlLWpzJztcclxuXHJcbmZ1bmN0aW9uIHJlYWRFbnYobmFtZTogc3RyaW5nKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcclxuICB0cnkge1xyXG4gICAgLy8gQHRzLWlnbm9yZSAtIE5ldGxpZnkgZ2xvYmFsIG1heSBleGlzdCBhdCBydW50aW1lXHJcbiAgICBpZiAodHlwZW9mIE5ldGxpZnkgIT09ICd1bmRlZmluZWQnICYmIE5ldGxpZnk/LmVudj8uZ2V0KSB7XHJcbiAgICAgIC8vIEB0cy1pZ25vcmVcclxuICAgICAgY29uc3QgdiA9IE5ldGxpZnkuZW52LmdldChuYW1lKTtcclxuICAgICAgaWYgKHYpIHJldHVybiB2IGFzIHN0cmluZztcclxuICAgIH1cclxuICB9IGNhdGNoIHt9XHJcbiAgLy8gRmFsbGJhY2tcclxuICAvLyBAdHMtaWdub3JlXHJcbiAgcmV0dXJuIChnbG9iYWxUaGlzIGFzIGFueSk/LnByb2Nlc3M/LmVudj8uW25hbWVdIGFzIHN0cmluZyB8IHVuZGVmaW5lZDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVN1cGFiYXNlQ2xpZW50KHVzZVNlcnZpY2VSb2xlID0gZmFsc2UpOiBTdXBhYmFzZUpzQ2xpZW50IHtcclxuICBjb25zdCB1cmwgPSByZWFkRW52KCdTVVBBQkFTRV9VUkwnKTtcclxuICBjb25zdCBhbm9uID0gcmVhZEVudignU1VQQUJBU0VfQU5PTl9LRVknKTtcclxuICBjb25zdCBzZXJ2aWNlID0gcmVhZEVudignU1VQQUJBU0VfU0VSVklDRV9ST0xFX0tFWScpO1xyXG4gIGlmICghdXJsIHx8ICghYW5vbiAmJiAhc2VydmljZSkpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignU3VwYWJhc2UgZW52IHZhcnMgbm90IHNldCAoU1VQQUJBU0VfVVJMIGFuZCBrZXkpLicpO1xyXG4gIH1cclxuICBjb25zdCBrZXkgPSB1c2VTZXJ2aWNlUm9sZSAmJiBzZXJ2aWNlID8gc2VydmljZSA6IChhbm9uIGFzIHN0cmluZyk7XHJcbiAgcmV0dXJuIGNyZWF0ZUNsaWVudCh1cmwsIGtleSwge1xyXG4gICAgYXV0aDogeyBwZXJzaXN0U2Vzc2lvbjogZmFsc2UgfSxcclxuICB9KTtcclxufVxyXG4iLCAiaW1wb3J0IHsgY3JlYXRlU3VwYWJhc2VDbGllbnQgfSBmcm9tICcuLi8uLi8uLi9wYWNrYWdlcy9zaGFyZWQvc3VwYWJhc2VDbGllbnQnO1xyXG5pbXBvcnQgeyBjcmVhdGVDbGllbnQgfSBmcm9tICdAc3VwYWJhc2Uvc3VwYWJhc2UtanMnO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgKHJlcTogUmVxdWVzdCkgPT4ge1xyXG4gIGlmIChyZXEubWV0aG9kICE9PSAnUE9TVCcpIHJldHVybiBuZXcgUmVzcG9uc2UoJ01ldGhvZCBOb3QgQWxsb3dlZCcsIHsgc3RhdHVzOiA0MDUgfSk7XHJcbiAgLy8gQWxsb3cgb3ZlcnJpZGluZyBTdXBhYmFzZSBjb25uZWN0aW9uIHZpYSByZXF1ZXN0IGJvZHkgZm9yIGxvY2FsIGRldlxyXG4gIGxldCBzdXBhYmFzZTogYW55O1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBtYXliZSA9IGF3YWl0IHJlcS50ZXh0KCk7XHJcbiAgICBpZiAobWF5YmUpIHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKG1heWJlKTtcclxuICAgICAgICBjb25zdCB1cmwgPSBwYXJzZWQ/LnN1cGFiYXNlX3VybCBhcyBzdHJpbmcgfCB1bmRlZmluZWQ7XHJcbiAgICAgICAgY29uc3Qgc2VydmljZSA9IHBhcnNlZD8uc2VydmljZV9rZXkgYXMgc3RyaW5nIHwgdW5kZWZpbmVkO1xyXG4gICAgICAgIGlmICh1cmwgJiYgc2VydmljZSkge1xyXG4gICAgICAgICAgc3VwYWJhc2UgPSBjcmVhdGVDbGllbnQodXJsLCBzZXJ2aWNlLCB7IGF1dGg6IHsgcGVyc2lzdFNlc3Npb246IGZhbHNlIH0gfSkgYXMgYW55O1xyXG4gICAgICAgIH1cclxuICAgICAgfSBjYXRjaCB7fVxyXG4gICAgfVxyXG4gICAgaWYgKCFzdXBhYmFzZSkge1xyXG4gICAgICBzdXBhYmFzZSA9IGNyZWF0ZVN1cGFiYXNlQ2xpZW50KHRydWUpO1xyXG4gICAgfVxyXG4gICAgY29uc3QgdXNlcjEgPSAnMTExMTExMTEtMTExMS0xMTExLTExMTEtMTExMTExMTExMTExJztcclxuICAgIGNvbnN0IHVzZXIyID0gJzIyMjIyMjIyLTIyMjItMjIyMi0yMjIyLTIyMjIyMjIyMjIyMic7XHJcbiAgICBjb25zdCBiaXoxID0gJzMzMzMzMzMzLTMzMzMtMzMzMy0zMzMzLTMzMzMzMzMzMzMzMyc7XHJcbiAgICBjb25zdCBjb3Vwb24xID0gJzQ0NDQ0NDQ0LTQ0NDQtNDQ0NC00NDQ0LTQ0NDQ0NDQ0NDQ0NCc7XHJcblxyXG4gICAgYXdhaXQgc3VwYWJhc2UuZnJvbSgndXNlcnMnKS51cHNlcnQoeyBpZDogdXNlcjEsIGVtYWlsOiAndXNlcjFAdGVzdC5sb2NhbCcsIGNpdHk6ICdCZW5nYWx1cnUnLCBpbnRlcmVzdHM6IFsnU2hvcHBpbmcnXSB9KTtcclxuICAgIGF3YWl0IHN1cGFiYXNlLmZyb20oJ3VzZXJzJykudXBzZXJ0KHsgaWQ6IHVzZXIyLCBlbWFpbDogJ3VzZXIyQHRlc3QubG9jYWwnLCBjaXR5OiAnQmVuZ2FsdXJ1JywgaW50ZXJlc3RzOiBbXSB9KTtcclxuICAgIGF3YWl0IHN1cGFiYXNlLmZyb20oJ2J1c2luZXNzZXMnKS51cHNlcnQoeyBpZDogYml6MSwgb3duZXJfdXNlcl9pZDogdXNlcjEsIGVtYWlsOiAnYml6QHRlc3QubG9jYWwnLCBidXNpbmVzc19uYW1lOiAnVGVzdCBCaXonIH0pO1xyXG4gICAgYXdhaXQgc3VwYWJhc2UuZnJvbSgnc3RvcmVmcm9udHMnKS51cHNlcnQoeyBidXNpbmVzc19pZDogYml6MSwgZGVzY3JpcHRpb246ICdTZWVkZWQnLCB0aGVtZTogJ2xpZ2h0JywgaXNfb3BlbjogdHJ1ZSB9LCB7IG9uQ29uZmxpY3Q6ICdidXNpbmVzc19pZCcgfSBhcyBhbnkpO1xyXG4gICAgYXdhaXQgc3VwYWJhc2VcclxuICAgICAgLmZyb20oJ2NvdXBvbnMnKVxyXG4gICAgICAudXBzZXJ0KHsgaWQ6IGNvdXBvbjEsIGJ1c2luZXNzX2lkOiBiaXoxLCB0aXRsZTogJzEwJSBPRkYnLCBkZXNjcmlwdGlvbjogJ1NlZWQgY291cG9uJywgdG90YWxfcXVhbnRpdHk6IDEwMCwgdmFsdWU6IDEwIH0pO1xyXG5cclxuICAgIHJldHVybiBuZXcgUmVzcG9uc2UoXHJcbiAgICAgIEpTT04uc3RyaW5naWZ5KHsgb2s6IHRydWUsIHVzZXJzOiBbdXNlcjEsIHVzZXIyXSwgYnVzaW5lc3NfaWQ6IGJpejEsIGNvdXBvbl9pZDogY291cG9uMSB9KSxcclxuICAgICAgeyBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSB9XHJcbiAgICApO1xyXG4gIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgcmV0dXJuIG5ldyBSZXNwb25zZShKU09OLnN0cmluZ2lmeSh7IG9rOiBmYWxzZSwgZXJyb3I6IGU/Lm1lc3NhZ2UgfHwgJ1NlZWQgZXJyb3InIH0pLCB7IHN0YXR1czogNTAwIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbmV4cG9ydCBjb25zdCBjb25maWcgPSB7XHJcbiAgcGF0aDogJy9hcGkvdGVzdHMvc2VlZCcsXHJcbn07XHJcblxyXG5cclxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7OztBQUlBLFNBQVMsb0JBQW9CO0FBRTdCLFNBQVMsUUFBUSxNQUFrQztBQUNqRCxNQUFJO0FBRUYsUUFBSSxPQUFPLFlBQVksZUFBZSxTQUFTLEtBQUssS0FBSztBQUV2RCxZQUFNLElBQUksUUFBUSxJQUFJLElBQUksSUFBSTtBQUM5QixVQUFJO0FBQUcsZUFBTztBQUFBLElBQ2hCO0FBQUEsRUFDRixRQUFRO0FBQUEsRUFBQztBQUdULFNBQVEsWUFBb0IsU0FBUyxNQUFNLElBQUk7QUFDakQ7QUFFTyxTQUFTLHFCQUFxQixpQkFBaUIsT0FBeUI7QUFDN0UsUUFBTSxNQUFNLFFBQVEsY0FBYztBQUNsQyxRQUFNLE9BQU8sUUFBUSxtQkFBbUI7QUFDeEMsUUFBTSxVQUFVLFFBQVEsMkJBQTJCO0FBQ25ELE1BQUksQ0FBQyxPQUFRLENBQUMsUUFBUSxDQUFDLFNBQVU7QUFDL0IsVUFBTSxJQUFJLE1BQU0sbURBQW1EO0FBQUEsRUFDckU7QUFDQSxRQUFNLE1BQU0sa0JBQWtCLFVBQVUsVUFBVztBQUNuRCxTQUFPLGFBQWEsS0FBSyxLQUFLO0FBQUEsSUFDNUIsTUFBTSxFQUFFLGdCQUFnQixNQUFNO0FBQUEsRUFDaEMsQ0FBQztBQUNIOzs7QUM5QkEsU0FBUyxnQkFBQUEscUJBQW9CO0FBRTdCLElBQU8sMEJBQVEsT0FBTyxRQUFpQjtBQUNyQyxNQUFJLElBQUksV0FBVztBQUFRLFdBQU8sSUFBSSxTQUFTLHNCQUFzQixFQUFFLFFBQVEsSUFBSSxDQUFDO0FBRXBGLE1BQUk7QUFDSixNQUFJO0FBQ0YsVUFBTSxRQUFRLE1BQU0sSUFBSSxLQUFLO0FBQzdCLFFBQUksT0FBTztBQUNULFVBQUk7QUFDRixjQUFNLFNBQVMsS0FBSyxNQUFNLEtBQUs7QUFDL0IsY0FBTSxNQUFNLFFBQVE7QUFDcEIsY0FBTSxVQUFVLFFBQVE7QUFDeEIsWUFBSSxPQUFPLFNBQVM7QUFDbEIscUJBQVdBLGNBQWEsS0FBSyxTQUFTLEVBQUUsTUFBTSxFQUFFLGdCQUFnQixNQUFNLEVBQUUsQ0FBQztBQUFBLFFBQzNFO0FBQUEsTUFDRixRQUFRO0FBQUEsTUFBQztBQUFBLElBQ1g7QUFDQSxRQUFJLENBQUMsVUFBVTtBQUNiLGlCQUFXLHFCQUFxQixJQUFJO0FBQUEsSUFDdEM7QUFDQSxVQUFNLFFBQVE7QUFDZCxVQUFNLFFBQVE7QUFDZCxVQUFNLE9BQU87QUFDYixVQUFNLFVBQVU7QUFFaEIsVUFBTSxTQUFTLEtBQUssT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLE9BQU8sT0FBTyxvQkFBb0IsTUFBTSxhQUFhLFdBQVcsQ0FBQyxVQUFVLEVBQUUsQ0FBQztBQUN4SCxVQUFNLFNBQVMsS0FBSyxPQUFPLEVBQUUsT0FBTyxFQUFFLElBQUksT0FBTyxPQUFPLG9CQUFvQixNQUFNLGFBQWEsV0FBVyxDQUFDLEVBQUUsQ0FBQztBQUM5RyxVQUFNLFNBQVMsS0FBSyxZQUFZLEVBQUUsT0FBTyxFQUFFLElBQUksTUFBTSxlQUFlLE9BQU8sT0FBTyxrQkFBa0IsZUFBZSxXQUFXLENBQUM7QUFDL0gsVUFBTSxTQUFTLEtBQUssYUFBYSxFQUFFLE9BQU8sRUFBRSxhQUFhLE1BQU0sYUFBYSxVQUFVLE9BQU8sU0FBUyxTQUFTLEtBQUssR0FBRyxFQUFFLFlBQVksY0FBYyxDQUFRO0FBQzNKLFVBQU0sU0FDSCxLQUFLLFNBQVMsRUFDZCxPQUFPLEVBQUUsSUFBSSxTQUFTLGFBQWEsTUFBTSxPQUFPLFdBQVcsYUFBYSxlQUFlLGdCQUFnQixLQUFLLE9BQU8sR0FBRyxDQUFDO0FBRTFILFdBQU8sSUFBSTtBQUFBLE1BQ1QsS0FBSyxVQUFVLEVBQUUsSUFBSSxNQUFNLE9BQU8sQ0FBQyxPQUFPLEtBQUssR0FBRyxhQUFhLE1BQU0sV0FBVyxRQUFRLENBQUM7QUFBQSxNQUN6RixFQUFFLFNBQVMsRUFBRSxnQkFBZ0IsbUJBQW1CLEVBQUU7QUFBQSxJQUNwRDtBQUFBLEVBQ0YsU0FBUyxHQUFRO0FBQ2YsV0FBTyxJQUFJLFNBQVMsS0FBSyxVQUFVLEVBQUUsSUFBSSxPQUFPLE9BQU8sR0FBRyxXQUFXLGFBQWEsQ0FBQyxHQUFHLEVBQUUsUUFBUSxJQUFJLENBQUM7QUFBQSxFQUN2RztBQUNGO0FBRU8sSUFBTSxTQUFTO0FBQUEsRUFDcEIsTUFBTTtBQUNSOyIsCiAgIm5hbWVzIjogWyJjcmVhdGVDbGllbnQiXQp9Cg==
