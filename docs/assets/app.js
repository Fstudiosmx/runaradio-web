const STORAGE_KEY = "runaradio.db.v3";
const API_CACHE_KEY = "runaradio.api-cache.v3";
const ADMIN_SESSION_KEY = "runaradio.admin-session.v1";
const API_TIMEOUT_MS = 7000;

const page = document.body.dataset.page;

function toHex(buffer) {
  return [...new Uint8Array(buffer)].map((value) => value.toString(16).padStart(2, "0")).join("");
}

async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  return toHex(await crypto.subtle.digest("SHA-256", bytes));
}

async function loadDefaultDb() {
  const baseDataPath = page === "login" ? "../data/default-db.json" : "./data/default-db.json";
  const response = await fetch(baseDataPath, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`No se pudo cargar default-db.json (HTTP ${response.status})`);
  }

  return response.json();
}

function persistDb(db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

async function getDb() {
  const local = localStorage.getItem(STORAGE_KEY);

  if (local) {
    try {
      return JSON.parse(local);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  const fallback = await loadDefaultDb();
  persistDb(fallback);
  return fallback;
}

async function fetchJsonWithTimeout(url, timeoutMs = API_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutRef = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status} (${url})`);
    return await response.json();
  } finally {
    clearTimeout(timeoutRef);
  }
}

async function fetchLibreTime(baseUrl) {
  const endpoints = ["/api/live-info-v2", "/api/status", "/api/week-info"];
  const results = await Promise.all(
    endpoints.map(async (path) => {
      try {
        return { path, data: await fetchJsonWithTimeout(`${baseUrl}${path}`), ok: true };
      } catch (error) {
        console.warn(`[LibreTime] ${path} no disponible:`, error.message);
        return { path, data: null, ok: false };
      }
    })
  );

  const cache = {
    liveInfo: results.find((item) => item.path === "/api/live-info-v2")?.data ?? null,
    statusInfo: results.find((item) => item.path === "/api/status")?.data ?? null,
    weekInfo: results.find((item) => item.path === "/api/week-info")?.data ?? null,
    fetchedAt: new Date().toISOString()
  };

  localStorage.setItem(API_CACHE_KEY, JSON.stringify(cache));
  return cache;
}

function getApiCache() {
  try {
    const payload = localStorage.getItem(API_CACHE_KEY);
    return payload ? JSON.parse(payload) : null;
  } catch {
    localStorage.removeItem(API_CACHE_KEY);
    return null;
  }
}

function createCell(value) {
  const td = document.createElement("td");
  td.textContent = String(value);
  return td;
}

function renderHome(db, api) {
  document.getElementById("station-name").textContent = db.station.name;
  document.getElementById("station-tagline").textContent = db.station.tagline;
  document.getElementById("listen-live").href = db.station.streamUrl;

  const current = api?.liveInfo?.current?.name || db.recentlyPlayed[0]?.track || "Sin señal";
  const artist = api?.liveInfo?.current?.artist || db.recentlyPlayed[0]?.artist || "Sin artista";
  const listeners = api?.statusInfo?.listeners?.current || db.listeners.current;

  document.getElementById("live-track").textContent = current;
  document.getElementById("live-artist").textContent = artist;
  document.getElementById("listener-count").textContent = `Listeners: ${listeners}`;

  const shows = document.getElementById("featured-shows");
  shows.replaceChildren();

  for (const show of db.featuredShows) {
    const li = document.createElement("li");
    li.textContent = `${show.title} · ${show.dj} (${show.day} ${show.time})`;
    shows.appendChild(li);
  }

  const played = document.getElementById("recently-played");
  played.replaceChildren();

  for (const item of db.recentlyPlayed) {
    const tr = document.createElement("tr");
    tr.appendChild(createCell(item.track));
    tr.appendChild(createCell(item.artist));
    played.appendChild(tr);
  }
}

function renderSchedule(db, api) {
  const table = document.getElementById("schedule-table");
  table.replaceChildren();

  const fromApi = api?.weekInfo;
  if (fromApi && typeof fromApi === "object") {
    for (const [day, rows] of Object.entries(fromApi)) {
      for (const slot of rows || []) {
        const tr = document.createElement("tr");
        tr.appendChild(createCell(day));
        tr.appendChild(createCell(slot.start_timestamp || "-"));
        tr.appendChild(createCell(slot.name || "-"));
        tr.appendChild(createCell(slot.creator || "-"));
        table.appendChild(tr);
      }
    }

    if (table.children.length > 0) return;
  }

  for (const show of db.featuredShows) {
    const tr = document.createElement("tr");
    tr.appendChild(createCell(show.day));
    tr.appendChild(createCell(show.time));
    tr.appendChild(createCell(show.title));
    tr.appendChild(createCell(show.dj));
    table.appendChild(tr);
  }
}

function renderCommunity(db) {
  document.getElementById("community-listeners").textContent = `Live listeners: ${db.listeners.current} (Peak: ${db.listeners.peakToday})`;

  const wall = document.getElementById("social-wall");
  wall.replaceChildren();

  for (const post of db.socialPosts) {
    const li = document.createElement("li");
    const author = document.createElement("strong");
    author.textContent = post.author;

    const message = document.createElement("p");
    message.textContent = post.message;

    const meta = document.createElement("span");
    meta.className = "muted";
    meta.textContent = `hace ${post.hoursAgo}h`;

    li.appendChild(author);
    li.appendChild(message);
    li.appendChild(meta);
    wall.appendChild(li);
  }

  const form = document.getElementById("request-form");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);

    db.requests.push({
      title: String(data.get("title") || ""),
      artist: String(data.get("artist") || ""),
      createdAt: new Date().toISOString()
    });

    persistDb(db);
    form.reset();
    alert("Solicitud guardada en base local.");
  });
}

function isAdminSessionActive() {
  return localStorage.getItem(ADMIN_SESSION_KEY) === "1";
}

function getAdminUrlForCurrentPage() {
  return page === "login" ? "../admin.html" : "./admin.html";
}

function getLoginUrlForCurrentPage() {
  return page === "login" ? "./index.html" : "./login/index.html";
}

async function authenticateAdmin(db, username, password) {
  const incomingHash = await sha256(password);
  return db.admin.users.some((item) => item.username === username && item.passwordHash === incomingHash);
}

function renderLogin(db) {
  const loginForm = document.getElementById("admin-login");
  const status = document.getElementById("login-status");

  if (isAdminSessionActive()) {
    window.location.href = getAdminUrlForCurrentPage();
    return;
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(loginForm);
    const username = String(data.get("username") || "");
    const password = String(data.get("password") || "");

    const valid = await authenticateAdmin(db, username, password);
    if (!valid) {
      status.textContent = "Credenciales inválidas.";
      return;
    }

    localStorage.setItem(ADMIN_SESSION_KEY, "1");
    status.textContent = "Login correcto. Redirigiendo...";
    window.location.href = getAdminUrlForCurrentPage();
  });
}

function renderAdmin(db) {
  if (!isAdminSessionActive()) {
    window.location.href = getLoginUrlForCurrentPage();
    return;
  }

  const stationForm = document.getElementById("station-form");
  const exportBtn = document.getElementById("export-db");
  const logoutBtn = document.getElementById("logout-admin");
  const status = document.getElementById("admin-status");

  const nameInput = stationForm.elements.namedItem("name");
  const taglineInput = stationForm.elements.namedItem("tagline");
  const streamInput = stationForm.elements.namedItem("streamUrl");

  nameInput.value = db.station.name;
  taglineInput.value = db.station.tagline;
  streamInput.value = db.station.streamUrl;

  stationForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(stationForm);

    db.station.name = String(data.get("name") || "");
    db.station.tagline = String(data.get("tagline") || "");
    db.station.streamUrl = String(data.get("streamUrl") || "");
    db.admin.updatedAt = new Date().toISOString();

    persistDb(db);
    status.textContent = "Configuración guardada correctamente.";
  });

  exportBtn.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = href;
    a.download = "runaradio-db-export.json";
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(href);
  });

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    window.location.href = getLoginUrlForCurrentPage();
  });
}

async function bootstrap() {
  const db = await getDb();
  const cache = getApiCache();
  const api = cache || (await fetchLibreTime(db.station.apiBaseUrl));

  if (page === "home") renderHome(db, api);
  if (page === "schedule") renderSchedule(db, api);
  if (page === "community") renderCommunity(db);
  if (page === "login") renderLogin(db);
  if (page === "admin") renderAdmin(db);
}

bootstrap().catch((error) => {
  console.error(error);
  const errorNode = document.createElement("p");
  errorNode.style.color = "#ff9494";
  errorNode.style.padding = "1rem";
  errorNode.textContent = `Error: ${error.message}`;
  document.body.appendChild(errorNode);
});
