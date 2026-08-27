interface AdminToolbarOptions {
  pageId?: string | number | null;
  siteName?: string | null;
  editUrl?: string;
}

import { getBaseUrl } from "@/src/lib/config";

export function buildAdminToolbarHtml({
  pageId,
  siteName,
  editUrl,
}: AdminToolbarOptions) {
  const baseUrl = getBaseUrl ? getBaseUrl() : "";
  const resolvedEditUrl =
    editUrl || (pageId ? `/admin/pages/${pageId}` : "/admin");
  const safeSiteName = siteName || "Site";

  return `
<div id="cms-admin-toolbar" role="navigation" aria-label="Admin toolbar">
  <div class="cms-admin-toolbar-left">
    <strong class="cms-admin-toolbar-site"></strong>
    <button type="button" class="cms-admin-toolbar-btn" data-toolbar-action="edit">Edit Page</button>
    <button type="button" class="cms-admin-toolbar-btn" data-toolbar-action="css">Customize CSS</button>
    <button type="button" class="cms-admin-toolbar-btn" data-toolbar-action="admin">Dashboard</button>
  </div>
  <button type="button" class="cms-admin-toolbar-hide" data-toolbar-action="hide" aria-label="Hide admin toolbar">Hide</button>
</div>
<div id="cms-admin-css-panel" aria-hidden="true">
  <div class="cms-admin-css-panel-head">
    <strong>Global CSS</strong>
    <button type="button" data-toolbar-action="close-css" aria-label="Close CSS editor">x</button>
  </div>
  <textarea id="cms-admin-css-editor" spellcheck="false"></textarea>
  <div class="cms-admin-css-panel-actions">
    <span id="cms-admin-css-status"></span>
    <button type="button" data-toolbar-action="save-css">Save CSS</button>
  </div>
</div>
<style>
  #cms-admin-toolbar{position:fixed;top:0;left:0;right:0;z-index:2147483647;height:44px;background:#111827;color:#f9fafb;border-bottom:1px solid rgba(255,255,255,.14);box-shadow:0 8px 24px rgba(0,0,0,.18);display:flex;align-items:center;justify-content:space-between;padding:0 12px;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:13px}
  body.cms-admin-toolbar-visible{padding-top:44px}
  #cms-admin-toolbar *{box-sizing:border-box}
  .cms-admin-toolbar-left{display:flex;align-items:center;gap:8px;min-width:0}
  .cms-admin-toolbar-site{max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:700}
  .cms-admin-toolbar-btn,.cms-admin-toolbar-hide,#cms-admin-css-panel button{border:1px solid rgba(255,255,255,.18);background:#1f2937;color:#f9fafb;border-radius:6px;height:30px;padding:0 10px;font:inherit;cursor:pointer}
  .cms-admin-toolbar-btn:hover,.cms-admin-toolbar-hide:hover,#cms-admin-css-panel button:hover{background:#374151}
  .cms-admin-toolbar-hide{background:transparent}
  #cms-admin-css-panel{position:fixed;top:56px;right:12px;z-index:2147483647;width:min(620px,calc(100vw - 24px));height:430px;background:#111827;color:#f9fafb;border:1px solid rgba(255,255,255,.16);border-radius:8px;box-shadow:0 20px 45px rgba(0,0,0,.28);display:none;overflow:hidden;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
  #cms-admin-css-panel.cms-admin-css-panel-open{display:flex;flex-direction:column}
  .cms-admin-css-panel-head,.cms-admin-css-panel-actions{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.12)}
  .cms-admin-css-panel-actions{border-top:1px solid rgba(255,255,255,.12);border-bottom:0}
  #cms-admin-css-editor{flex:1;width:100%;resize:none;border:0;outline:0;background:#0b1020;color:#e5e7eb;padding:12px;font:13px/1.5 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono",monospace}
  #cms-admin-css-status{font-size:12px;color:#cbd5e1}
  @media(max-width:640px){#cms-admin-toolbar{height:auto;min-height:44px;align-items:flex-start;gap:8px;padding:8px}.cms-admin-toolbar-left{flex-wrap:wrap}body.cms-admin-toolbar-visible{padding-top:72px}}
</style>
<script>
(function(){
  var siteName = ${JSON.stringify(safeSiteName)};
  var editUrl = ${JSON.stringify(resolvedEditUrl)};
  var hiddenKey = "cmsAdminToolbarHidden";
  var toolbar = document.getElementById("cms-admin-toolbar");
  var panel = document.getElementById("cms-admin-css-panel");
  var editor = document.getElementById("cms-admin-css-editor");
  var status = document.getElementById("cms-admin-css-status");
  var site = document.querySelector(".cms-admin-toolbar-site");
  if (!toolbar) return;
  if (site) site.textContent = siteName;
  try {
    if (localStorage.getItem(hiddenKey) === "true") localStorage.removeItem(hiddenKey);
  } catch (error) {}
  document.body.classList.add("cms-admin-toolbar-visible");

  function setStatus(message) {
    if (status) status.textContent = message || "";
  }

  async function openCssPanel() {
    if (!panel || !editor) return;
    panel.classList.add("cms-admin-css-panel-open");
    panel.setAttribute("aria-hidden", "false");
    setStatus("Loading...");
    try {
      var data = await fetch("${baseUrl}/api/setting/global-css", { credentials: "include" }).then((res) => res.json());
      editor.value = data && data.data ? data.data.css || "" : "";
      setStatus("");
      editor.focus();
    } catch (error) {
      setStatus("Failed to load CSS");
    }
  }

  async function saveCss() {
    if (!editor) return;
    setStatus("Saving...");
    try {
      var data = await fetch("${baseUrl}/api/setting/global-css", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ css: editor.value }),
        credentials: "include"
      }).then((res) => res.json());
      if (!data.success) throw new Error("Save failed");
      setStatus("Saved");
      setTimeout(function(){ setStatus(""); }, 1800);
    } catch (error) {
      setStatus("Failed to save");
    }
  }

  async function hideToolbar() {
    try { localStorage.setItem(hiddenKey, "true"); } catch (error) {}
    toolbar.style.display = "none";
    document.body.classList.remove("cms-admin-toolbar-visible");
    if (panel) panel.classList.remove("cms-admin-css-panel-open");
    try {
      await fetch("${baseUrl}/api/setting/admin-toolbar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showAdminToolbar: false }),
        credentials: "include"
      });
    } catch (error) {}
  }

  // Use named function to allow removal
  const toolbarClickHandler = function(event) {
    var target = event.target;
    if (!target || !target.getAttribute) return;
    var action = target.getAttribute("data-toolbar-action");
    if (!action) return;
    event.preventDefault();
    if (action === "edit") window.parent.postMessage({ type: "NAVIGATE", url: editUrl }, "*");
    if (action === "css") window.parent.postMessage({ type: "NAVIGATE", url: "/admin/setting/global-css" }, "*");
    if (action === "admin") window.parent.postMessage({ type: "NAVIGATE", url: "/admin" }, "*");
    if (action === "close-css" && panel) {
      panel.classList.remove("cms-admin-css-panel-open");
      panel.setAttribute("aria-hidden", "true");
    }
    if (action === "save-css") saveCss();
    if (action === "hide") hideToolbar();
  };
  
  // Remove any existing listeners before adding new ones
  document.removeEventListener("click", toolbarClickHandler);
  document.addEventListener("click", toolbarClickHandler);
})();
</script>`;
}
