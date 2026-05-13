const toast = document.getElementById("copyToast");
const mirrorContainer = document.getElementById("mirrorCards");
const mirrorTableBody = document.querySelector("#mirrorTable tbody");
const searchInput = document.getElementById("mirrorSearch");
const totalCountEl = document.getElementById("totalCount");
const onlineCountEl = document.getElementById("onlineCount");

let mirrorData = [];
let historyMap = {};

/* ── Single fetch for all data ─────────────────── */
fetch("mirror.json")
  .then(r => r.json())
  .then(data => {
    const iran = data.official_iran_mirrors.map(m => ({ ...m, category: "iran" }));
    const global = data.global_mirrors.map(m => ({ ...m, category: "global" }));
    mirrorData = [...iran, ...global];
    mirrorData.forEach(m => { historyMap[m.url] = []; });

    totalCountEl.textContent = mirrorData.length;

    renderCards(mirrorData);
    renderTable();
    renderContributors();
    checkAllMirrors();

    setInterval(() => {
      if (!document.hidden) checkAllMirrors();
    }, 30000);
  })
  .catch(() => {
    mirrorContainer.innerHTML =
      "<p style='color:var(--danger);padding:1rem 0'>Failed to load mirrors.</p>";
  });

/* ── Search / filter ───────────────────────────── */
searchInput?.addEventListener("input", () => {
  const q = searchInput.value.toLowerCase().trim();
  const filtered = q
    ? mirrorData.filter(
        m =>
          m.name.toLowerCase().includes(q) ||
          m.packages.some(p => p.toLowerCase().includes(q))
      )
    : mirrorData;
  renderCards(filtered);
});

/* ── Render card grid ──────────────────────────── */
function renderCards(mirrors) {
  const frag = document.createDocumentFragment();
  mirrors.forEach(m => {
    const card = document.createElement("div");
    card.className = "mirror-card glass";
    card.dataset.url = m.url;

    card.innerHTML = `
      <div class="card-header">
        <h3>${m.name}</h3>
        <span class="category-badge ${m.category}">${m.category === "iran" ? "Iran" : "Global"}</span>
      </div>
      <p class="desc">${m.description}</p>
      <div class="packages">${m.packages.map(p => `<span class="package">${p}</span>`).join("")}</div>
      <span class="mirror-link">${m.url}</span>
      <div class="card-status checking">⏳ Checking…</div>
    `;

    card.addEventListener("click", () => {
      navigator.clipboard?.writeText(m.url).catch(() => {});
      showToast();
    });

    frag.appendChild(card);
  });

  mirrorContainer.innerHTML = "";
  mirrorContainer.appendChild(frag);

  /* Re-apply known status after re-render */
  mirrors.forEach(m => {
    const hist = historyMap[m.url];
    if (hist?.length > 0) updateCardStatus(m.url, hist[hist.length - 1]);
  });
}

/* ── Render table rows ─────────────────────────── */
function renderTable() {
  const frag = document.createDocumentFragment();
  mirrorData.forEach(m => {
    const tr = document.createElement("tr");
    tr.dataset.url = m.url;
    tr.innerHTML = `
      <td><div class="status-history"></div></td>
      <td class="mirror-name">${m.name}</td>
      <td><div class="status-circle"><span></span></div></td>
      <td class="status-text">Checking…</td>
    `;
    tr.querySelector(".mirror-name").addEventListener("click", e => {
      e.stopPropagation();
      navigator.clipboard?.writeText(m.url).catch(() => {});
      showToast();
    });
    frag.appendChild(tr);
  });
  mirrorTableBody.appendChild(frag);
}

/* ── Single mirror reachability check ─────────── */
function checkMirror(url, timeout = 5000) {
  return new Promise(resolve => {
    const timer = setTimeout(() => resolve(false), timeout);
    fetch(url, { method: "HEAD", mode: "no-cors", cache: "no-store" })
      .then(() => { clearTimeout(timer); resolve(true); })
      .catch(() => { clearTimeout(timer); resolve(false); });
  });
}

/* ── Parallel connectivity checks ─────────────── */
async function checkAllMirrors() {
  const results = await Promise.allSettled(mirrorData.map(m => checkMirror(m.url)));

  let onlineCount = 0;
  results.forEach((result, i) => {
    const isUp = result.status === "fulfilled" && result.value === true;
    const m = mirrorData[i];

    historyMap[m.url].push(isUp);
    if (historyMap[m.url].length > 30) historyMap[m.url].shift();

    if (isUp) onlineCount++;
    updateCardStatus(m.url, isUp);
    updateTableRow(m.url, isUp);
  });

  onlineCountEl.textContent = onlineCount;
}

/* ── DOM update helpers ────────────────────────── */
function updateCardStatus(url, isUp) {
  const card = mirrorContainer.querySelector(`.mirror-card[data-url="${url}"]`);
  if (!card) return;
  const el = card.querySelector(".card-status");
  if (!el) return;
  el.textContent = isUp ? "● Online" : "● Offline";
  el.className = `card-status ${isUp ? "up" : "down"}`;
}

function updateTableRow(url, isUp) {
  const tr = mirrorTableBody.querySelector(`tr[data-url="${url}"]`);
  if (!tr) return;

  const histCell = tr.querySelector(".status-history");
  const circle = tr.querySelector(".status-circle span");
  const statusText = tr.querySelector(".status-text");

  histCell.innerHTML = historyMap[url]
    .map(r => `<span class="history-dot" style="background:${r ? "#4dffb8" : "#ff6b6b"}"></span>`)
    .join("");

  circle.style.backgroundColor = isUp ? "#4dffb8" : "#ff6b6b";
  circle.style.boxShadow = isUp
    ? "0 0 10px rgba(77,255,184,0.8)"
    : "0 0 10px rgba(255,107,107,0.7)";

  statusText.textContent = isUp ? "Online — reachable" : "Offline — not responding";
}

/* ── Contributors ──────────────────────────────── */
function renderContributors() {
  const names = [
    "GeeDook", "ArmanTaheriGhaleTaki", "maede-ps","SonyCore", "amirparsadd",
    "SinaAboutalebi", "ehsannarmani", "Vesal-J", "Linuxmaster14",
    "imdanieldev", "MrAriaNet", "hesam-init", "aliinreallife",
    "alireza5969", "sirwanveisi", 
  ];

  const frag = document.createDocumentFragment();
  names.forEach(username => {
    const a = document.createElement("a");
    a.href = `https://github.com/${username}`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.title = username;

    const img = document.createElement("img");
    img.src = `https://github.com/${username}.png?size=80`;
    img.alt = username;
    img.width = 60;
    img.height = 60;
    img.loading = "lazy";
    img.decoding = "async";

    a.appendChild(img);
    frag.appendChild(a);
  });

  document.getElementById("contributorsList").appendChild(frag);
}

/* ── Toast ─────────────────────────────────────── */
function showToast() {
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1800);
}
