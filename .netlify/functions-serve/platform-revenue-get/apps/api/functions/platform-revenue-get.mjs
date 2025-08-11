
import {createRequire as ___nfyCreateRequire} from "module";
import {fileURLToPath as ___nfyFileURLToPath} from "url";
import {dirname as ___nfyPathDirname} from "path";
let __filename=___nfyFileURLToPath(import.meta.url);
let __dirname=___nfyPathDirname(___nfyFileURLToPath(import.meta.url));
let require=___nfyCreateRequire(import.meta.url);


// apps/api/functions/platform-revenue-get.ts
var platform_revenue_get_default = async () => {
  const summary = {
    coupon_revenue: 0,
    banner_revenue: 0,
    search_revenue: 0,
    push_revenue: 0
  };
  return new Response(JSON.stringify(summary), { headers: { "Content-Type": "application/json" } });
};
var config = {
  path: "/api/platform/revenue"
};
export {
  config,
  platform_revenue_get_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiYXBwcy9hcGkvZnVuY3Rpb25zL3BsYXRmb3JtLXJldmVudWUtZ2V0LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJleHBvcnQgZGVmYXVsdCBhc3luYyAoKSA9PiB7XHJcbiAgY29uc3Qgc3VtbWFyeSA9IHtcclxuICAgIGNvdXBvbl9yZXZlbnVlOiAwLFxyXG4gICAgYmFubmVyX3JldmVudWU6IDAsXHJcbiAgICBzZWFyY2hfcmV2ZW51ZTogMCxcclxuICAgIHB1c2hfcmV2ZW51ZTogMCxcclxuICB9O1xyXG4gIHJldHVybiBuZXcgUmVzcG9uc2UoSlNPTi5zdHJpbmdpZnkoc3VtbWFyeSksIHsgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0gfSk7XHJcbn07XHJcblxyXG5leHBvcnQgY29uc3QgY29uZmlnID0ge1xyXG4gIHBhdGg6ICcvYXBpL3BsYXRmb3JtL3JldmVudWUnLFxyXG59O1xyXG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7O0FBQUEsSUFBTywrQkFBUSxZQUFZO0FBQ3pCLFFBQU0sVUFBVTtBQUFBLElBQ2QsZ0JBQWdCO0FBQUEsSUFDaEIsZ0JBQWdCO0FBQUEsSUFDaEIsZ0JBQWdCO0FBQUEsSUFDaEIsY0FBYztBQUFBLEVBQ2hCO0FBQ0EsU0FBTyxJQUFJLFNBQVMsS0FBSyxVQUFVLE9BQU8sR0FBRyxFQUFFLFNBQVMsRUFBRSxnQkFBZ0IsbUJBQW1CLEVBQUUsQ0FBQztBQUNsRztBQUVPLElBQU0sU0FBUztBQUFBLEVBQ3BCLE1BQU07QUFDUjsiLAogICJuYW1lcyI6IFtdCn0K
