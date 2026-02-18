const mirrorContainer = document.getElementById("mirrorCards");
const toast = document.getElementById("copyToast");

/* LOAD MIRRORS */
fetch("mirror.json")
  .then(res => res.json())
  .then(data => {
    const allMirrors = [
      ...data.official_iran_mirrors,
      ...data.global_mirrors
    ];

    allMirrors.forEach(m => {
      const card = document.createElement("div");
      card.className = "mirror-card glass";

      card.innerHTML = `
        <h3>${m.name}</h3>
        <p class="desc">${m.description}</p>
        <div class="status checking">⏳ Checking status…</div>

        <div class="packages">
          ${m.packages.map(p => `<span class="package">${p}</span>`).join("")}
        </div>

        <span class="mirror-link">${m.url}</span>
      `;

      mirrorContainer.appendChild(card);

      /* COPY URL ON CLICK */
      card.addEventListener("click", () => {
        navigator.clipboard.writeText(m.url);
        showToast();
      });

      /* STATUS CHECK */
      const statusEl = card.querySelector(".status");
      fetch(m.url, { method: "HEAD", mode: "no-cors" })
        .then(() => {
          statusEl.textContent = "● Online";
          statusEl.className = "status up";
        })
        .catch(() => {
          statusEl.textContent = "● Offline";
          statusEl.className = "status down";
        });
    });
  })
  .catch(() => {
    mirrorContainer.innerHTML = "<p>Failed to load mirrors.</p>";
  });

/* SHOW COPY TOAST */
function showToast() {
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1500);
}


/* -----------------------------
   CONTRIBUTORS (STATIC LIST)
--------------------------------*/
const contributors = [
    "GeeDook",
    "ArmanTaheriGhaleTaki",
    "maede-ps",
  "amirparsadd",
  "SinaAboutalebi",
  "ehsannarmani",
  "Linuxmaster14",
  "imdanieldev",
  "MrAriaNet",
  "hesam-init",
  "aliinreallife",
  "alireza5969",
  "sirwanveisi",
  "Vesal-J",
];

const contributorsContainer = document.getElementById("contributors");

contributors.forEach(username => {
  const a = document.createElement("a");
  a.href = `https://github.com/${username}`;
  a.target = "_blank";
  a.rel = "noopener";

  const img = document.createElement("img");
  img.src = `https://github.com/${username}.png`;
  img.alt = username;
  img.title = username;

  a.appendChild(img);
  contributorsContainer.appendChild(a);
});


// radar 
const mirrorTableBody = document.querySelector("#mirrorTable tbody");
// const toast2 = document.getElementById("toast");
let mirrorData = [];
let historyMap = {}; // mirror.url => last 20 checks

// Load mirrors
fetch("mirror.json")
  .then(r => r.json())
  .then(data => {
    mirrorData = [...data.official_iran_mirrors, ...data.global_mirrors];
    mirrorData.forEach(m => historyMap[m.url] = []);
    renderTable();
    updateConnectivity();
    setInterval(updateConnectivity, 15000);
  });

function checkMirror(url, timeout = 4000) {
  return new Promise(resolve => {
    const timer = setTimeout(() => resolve(false), timeout);
    fetch(url, { mode: "no-cors", cache: "no-store" })
      .then(() => { clearTimeout(timer); resolve(true); })
      .catch(() => { clearTimeout(timer); resolve(false); });
  });
}

function renderTable() {
  mirrorTableBody.innerHTML = "";
  mirrorData.forEach(m => {
    const tr = document.createElement("tr");
    tr.dataset.url = m.url;

    tr.innerHTML = `
      <td class="history-cell"></td>
      <td class="mirror-name">${m.name}</td>
      <td><div class="status-circle"><span></span></div></td>
      <td class="status-text">Checking…</td>
    `;

    // Click row or name to copy URL
    tr.querySelector(".mirror-name").addEventListener("click", e => {
      navigator.clipboard.writeText(m.url).then(() => {
               showToast();

      });
    });

    mirrorTableBody.appendChild(tr);
  });
}

async function updateConnectivity() {
  for (const mirror of mirrorData) {
    const result = await checkMirror(mirror.url);

    // Update history
    historyMap[mirror.url].push(result);
    if (historyMap[mirror.url].length > 30) historyMap[mirror.url].shift(); // extend history

    // Update row
    const tr = mirrorTableBody.querySelector(`tr[data-url='${mirror.url}']`);
    const historyCell = tr.querySelector(".history-cell");
    const circle = tr.querySelector(".status-circle span");
    const statusText = tr.querySelector(".status-text");

    // Render history
    historyCell.innerHTML = historyMap[mirror.url]
      .map(r => `<span class="history-dot" data-url="${mirror.url}" style="background-color:${r ? '#4dffb8':'#ff6b6b'}"></span>`)
      .join("");

    // Update circle
    circle.style.backgroundColor = result ? "#4dffb8" : "#ff6b6b";
    circle.style.boxShadow = result
      ? "0 0 12px rgba(77,255,184,0.8)"
      : "0 0 12px rgba(255,107,107,0.7)";

    // Status hint
    statusText.textContent = result ? "Online — reachable" : "Offline — not responding";
  }
}
