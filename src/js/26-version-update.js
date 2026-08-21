// Version and update check.
//
// TNT_VERSION is stamped into the bundle by scripts/build.sh from
// CSXS/manifest.xml, so the panel always reports the version After Effects
// actually loaded rather than a number kept in sync by hand.
//
// The update feed is a small JSON document:
//   { "version": "0.2.0", "notes": "What changed", "url": "https://..." }
// Point TNT_UPDATE_FEED_URL at a raw copy of version.json once this repo has a
// remote. While it is empty the check is skipped entirely and nothing is shown.

const TNT_UPDATE_FEED_URL = "";
const TNT_UPDATE_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
const TNT_UPDATE_STATE_KEY = "tntUpdateState.v1";

let tntUpdateInfo = null;

function tntUpdateState() {
  try {
    const raw = window.localStorage.getItem(TNT_UPDATE_STATE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (_) {
    return {};
  }
}

function tntSaveUpdateState(patch) {
  try {
    const next = Object.assign(tntUpdateState(), patch || {});
    window.localStorage.setItem(TNT_UPDATE_STATE_KEY, JSON.stringify(next));
  } catch (_) {}
}

// Numeric-segment comparison. Returns >0 when a is newer than b.
function tntCompareVersions(a, b) {
  const pa = String(a || "0").split(/[.-]/);
  const pb = String(b || "0").split(/[.-]/);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i += 1) {
    const na = parseInt(pa[i], 10);
    const nb = parseInt(pb[i], 10);
    const va = Number.isFinite(na) ? na : 0;
    const vb = Number.isFinite(nb) ? nb : 0;
    if (va !== vb) return va - vb;
  }
  return 0;
}

function tntUpdateAvailable() {
  if (!tntUpdateInfo || !tntUpdateInfo.version) return false;
  return tntCompareVersions(tntUpdateInfo.version, TNT_VERSION) > 0;
}

function tntUpdateDismissed() {
  const state = tntUpdateState();
  return !!(tntUpdateInfo && state.dismissedVersion === tntUpdateInfo.version);
}

// Node's https rather than fetch: the panel runs from file://, so a fetch would
// be subject to origin rules that Node sidesteps entirely.
function tntFetchJson(url) {
  return new Promise(resolve => {
    let https = null;
    try {
      https = (typeof require === "function")
        ? require("https")
        : (window.cep_node && window.cep_node.require ? window.cep_node.require("https") : null);
    } catch (_) {}
    if (!https) {
      resolve(null);
      return;
    }
    let settled = false;
    const done = value => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    try {
      const request = https.get(url, response => {
        if (response.statusCode !== 200) {
          response.resume();
          done(null);
          return;
        }
        let body = "";
        response.setEncoding("utf8");
        response.on("data", chunk => { body += chunk; });
        response.on("end", () => {
          try { done(JSON.parse(body)); } catch (_) { done(null); }
        });
      });
      request.on("error", () => done(null));
      request.setTimeout(8000, () => {
        try { request.destroy(); } catch (_) {}
        done(null);
      });
    } catch (_) {
      done(null);
    }
  });
}

async function tntCheckForUpdate(options = {}) {
  if (!TNT_UPDATE_FEED_URL) return null;
  const state = tntUpdateState();
  const age = Date.now() - Number(state.lastCheckedAt || 0);
  if (!options.force && age < TNT_UPDATE_CHECK_INTERVAL_MS) {
    // Reuse the last result so a reopened panel still shows a pending update.
    if (state.latest) tntUpdateInfo = state.latest;
    return tntUpdateInfo;
  }

  const feed = await tntFetchJson(TNT_UPDATE_FEED_URL);
  tntSaveUpdateState({ lastCheckedAt: Date.now(), latest: feed || null });
  tntUpdateInfo = feed || null;
  if (tntUpdateAvailable() && !tntUpdateDismissed()) tntRenderUpdateBanner();
  return tntUpdateInfo;
}

function tntDismissUpdate() {
  if (tntUpdateInfo && tntUpdateInfo.version) {
    tntSaveUpdateState({ dismissedVersion: tntUpdateInfo.version });
  }
  tntRenderUpdateBanner();
}

function tntRenderUpdateBanner() {
  const host = document.getElementById("assistantHub");
  if (!host) return;
  let banner = document.getElementById("tntUpdateBanner");
  const show = tntUpdateAvailable() && !tntUpdateDismissed();

  if (!show) {
    if (banner) banner.remove();
    return;
  }
  if (!banner) {
    banner = document.createElement("div");
    banner.id = "tntUpdateBanner";
    banner.className = "tnt-update-banner";
    host.insertBefore(banner, host.firstChild);
    banner.addEventListener("click", event => {
      if (event.target.closest("[data-update-dismiss]")) {
        event.preventDefault();
        tntDismissUpdate();
      }
    });
  }
  const notes = String(tntUpdateInfo.notes || "").trim();
  banner.innerHTML = `
    <strong>Version ${escapeHtml(String(tntUpdateInfo.version))} available</strong>
    <span>${escapeHtml(notes || `You are on ${TNT_VERSION}`)}</span>
    <button type="button" data-update-dismiss aria-label="Dismiss">Dismiss</button>
  `;
}

if (!QUICK_PANEL_MODE) {
  // Let the panel finish loading before touching the network.
  setTimeout(() => { tntCheckForUpdate(); }, 4000);
}


// Label for the settings row: says where the check stands without needing a
// separate panel.
function tntUpdateStatusLabel() {
  if (!TNT_UPDATE_FEED_URL) return "Not configured";
  if (tntUpdateAvailable()) return `v${tntUpdateInfo.version} available`;
  const state = tntUpdateState();
  if (!state.lastCheckedAt) return "Never checked";
  return "Up to date";
}

// Manual check from the settings menu.
if (settingsMenuEl) {
  settingsMenuEl.addEventListener("click", async event => {
    const row = event.target.closest("[data-action=\"checkUpdate\"]");
    if (!row) return;
    event.preventDefault();
    event.stopPropagation();
    if (!TNT_UPDATE_FEED_URL) {
      if (statusEl) statusEl.textContent = "No update feed configured (TNT_UPDATE_FEED_URL).";
      return;
    }
    if (statusEl) statusEl.textContent = "Checking for updates...";
    await tntCheckForUpdate({ force: true });
    if (statusEl) {
      statusEl.textContent = tntUpdateAvailable()
        ? `Version ${tntUpdateInfo.version} available (you have ${TNT_VERSION}).`
        : `Up to date (v${TNT_VERSION}).`;
    }
    try { renderSettingsMenu(); } catch (_) {}
  });
}
