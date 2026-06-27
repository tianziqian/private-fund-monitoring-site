const state = {
  records: [],
  managers: {},
  personDetailLookup: new Map(),
  filtered: [],
  page: 1,
  pageSize: 50,
  quickScales: new Set(),
};

const scaleRank = {
  "100亿元以上": 5,
  "50-100亿元": 4,
  "20-50亿元": 3,
  "10-20亿元": 2,
  "5-10亿元": 1,
};

const els = {
  dataStatus: document.querySelector("#dataStatus"),
  metrics: document.querySelector("#metrics"),
  query: document.querySelector("#queryInput"),
  scale: document.querySelector("#scaleFilter"),
  cert: document.querySelector("#certFilter"),
  status: document.querySelector("#statusFilter"),
  province: document.querySelector("#provinceFilter"),
  dateFrom: document.querySelector("#dateFromFilter"),
  dateTo: document.querySelector("#dateToFilter"),
  reset: document.querySelector("#resetBtn"),
  resultCount: document.querySelector("#resultCount"),
  sort: document.querySelector("#sortSelect"),
  table: document.querySelector("#personTable"),
  prev: document.querySelector("#prevPage"),
  next: document.querySelector("#nextPage"),
  pageInfo: document.querySelector("#pageInfo"),
  drawer: document.querySelector("#drawer"),
  drawerContent: document.querySelector("#drawerContent"),
  closeDrawer: document.querySelector("#closeDrawer"),
  export: document.querySelector("#exportBtn"),
};

function formatNumber(value) {
  return Number(value || 0).toLocaleString("zh-CN");
}

function safe(value, fallback = "未披露") {
  return value === undefined || value === null || String(value).trim() === "" ? fallback : String(value);
}

function personDetailKeys(record) {
  return [
    record.certCode ? `cert::${record.certCode}` : "",
    record.registerNo && record.userName ? `name::${record.registerNo}::${record.userName}` : "",
  ].filter(Boolean);
}

function buildPersonDetailLookup(records) {
  const lookup = new Map();
  (records || []).forEach((record) => {
    const keys = [
      record.certCode ? `cert::${record.certCode}` : "",
      record.currentRegisterNo && record.userName ? `name::${record.currentRegisterNo}::${record.userName}` : "",
    ].filter(Boolean);
    keys.forEach((key) => {
      if (!lookup.has(key) || record.source === "manager_structure_executive") lookup.set(key, record.id);
    });
  });
  return lookup;
}

function personDetailHref(record) {
  for (const key of personDetailKeys(record)) {
    if (state.personDetailLookup.has(key)) {
      return `../change-center/person-detail.html?id=${encodeURIComponent(state.personDetailLookup.get(key))}`;
    }
  }
  return "";
}

function personNameLink(record) {
  const href = personDetailHref(record);
  const label = safe(record.userName);
  if (!href) return label;
  return `<a class="person-name-link" href="${href}">${label}</a>`;
}

function option(select, value) {
  const el = document.createElement("option");
  el.value = value;
  el.textContent = value;
  select.appendChild(el);
}

function renderMetrics(meta) {
  const cards = [
    ["人员总数", formatNumber(meta.personCount), "当前快照人员明细行数"],
    ["覆盖管理人", `${formatNumber(meta.coveredManagerCount)} 家`, "5亿元以上完整样本"],
    ["平均每家人员", `${meta.averagePersonsPerManager} 人`, "按登记编号聚合"],
    ["快照日期", meta.snapshotDate, "第一期完整快照"],
  ];
  els.metrics.innerHTML = cards
    .map(
      ([label, value, note]) => `
        <article class="metric-card">
          <span>${label}</span>
          <strong>${value}</strong>
          <small>${note}</small>
        </article>
      `
    )
    .join("");
}

function setupFilters(filters) {
  filters.fundScales.forEach((x) => option(els.scale, x));
  filters.certNames.forEach((x) => option(els.cert, x));
  filters.statusNames.forEach((x) => option(els.status, x));
  filters.registerProvinces.forEach((x) => option(els.province, x));
}

function matchesQuickScale(record) {
  if (!state.quickScales.size) return true;
  return state.quickScales.has(record.fundScale);
}

function syncScaleSelectFromQuick() {
  els.scale.value = state.quickScales.size === 1 ? Array.from(state.quickScales)[0] : "";
}

function renderQuickScaleState() {
  document.querySelectorAll(".quick-filters button[data-scale]").forEach((btn) => {
    btn.classList.toggle("active", state.quickScales.has(btn.dataset.scale));
  });
}

function clearQuickScales() {
  state.quickScales.clear();
  renderQuickScaleState();
}

function matchesQuick(record) {
  if (!matchesQuickScale(record)) return false;
  return true;
}

function applyFilters() {
  const q = els.query.value.trim().toLowerCase();
  const dateFrom = els.dateFrom.value;
  const dateTo = els.dateTo.value;
  state.filtered = state.records.filter((record) => {
    const manager = state.managers[record.registerNo] || {};
    const haystack = [
      record.userName,
      record.managerName,
      record.registerNo,
      record.certCode,
      record.certName,
      manager.registerProvince,
      manager.registerCity,
    ]
      .join(" ")
      .toLowerCase();
    if (q && !haystack.includes(q)) return false;
    if (els.scale.value && record.fundScale !== els.scale.value) return false;
    if (els.cert.value && record.certName !== els.cert.value) return false;
    if (els.status.value && record.statusName !== els.status.value) return false;
    if (els.province.value && manager.registerProvince !== els.province.value) return false;
    if (dateFrom && (!record.certObtainDate || record.certObtainDate < dateFrom)) return false;
    if (dateTo && (!record.certObtainDate || record.certObtainDate > dateTo)) return false;
    return matchesQuick(record);
  });
  sortRecords();
  state.page = 1;
  renderTable();
}

function sortRecords() {
  const mode = els.sort.value;
  state.filtered.sort((a, b) => {
    if (mode === "dateDesc") return safe(b.certObtainDate, "").localeCompare(safe(a.certObtainDate, ""));
    if (mode === "dateAsc") return safe(a.certObtainDate, "9999").localeCompare(safe(b.certObtainDate, "9999"));
    if (mode === "scaleDesc") return (scaleRank[b.fundScale] || 0) - (scaleRank[a.fundScale] || 0);
    if (mode === "nameAsc") return safe(a.userName, "").localeCompare(safe(b.userName, ""), "zh-Hans-CN");
    return (
      (scaleRank[b.fundScale] || 0) - (scaleRank[a.fundScale] || 0) ||
      safe(a.managerName, "").localeCompare(safe(b.managerName, ""), "zh-Hans-CN") ||
      safe(a.userName, "").localeCompare(safe(b.userName, ""), "zh-Hans-CN")
    );
  });
}

function statusClass(record) {
  if (!record.statusName) return "neutral";
  if (record.removed === "true" || record.statusName.includes("异常")) return "warn";
  return "ok";
}

function renderTable() {
  els.resultCount.textContent = formatNumber(state.filtered.length);
  const totalPages = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
  state.page = Math.min(state.page, totalPages);
  const start = (state.page - 1) * state.pageSize;
  const rows = state.filtered.slice(start, start + state.pageSize);
  if (!rows.length) {
    els.table.innerHTML = `<tr><td colspan="8"><div class="empty-state">没有匹配记录。请调整关键词或筛选条件。</div></td></tr>`;
  } else {
    els.table.innerHTML = rows
      .map(
        (record, idx) => `
          <tr data-index="${start + idx}">
            <td class="name-cell">
              <strong>${personNameLink(record)}</strong>
              <span class="subtle">${safe(record.educationName, "学历未披露")}</span>
            </td>
            <td class="manager-cell"><div class="truncate">${safe(record.managerName)}</div><span class="subtle">${safe(state.managers[record.registerNo]?.registerProvince, "")}${safe(state.managers[record.registerNo]?.registerCity, "")}</span></td>
            <td>${safe(record.registerNo)}</td>
            <td><span class="tag">${safe(record.fundScale)}</span></td>
            <td>${safe(record.certName)}</td>
            <td>${safe(record.certCode)}</td>
            <td>${safe(record.certObtainDate)}</td>
            <td><span class="tag ${statusClass(record)}">${safe(record.statusName)}</span></td>
          </tr>
        `
      )
      .join("");
  }
  els.pageInfo.textContent = `第 ${state.page} / ${totalPages} 页`;
  els.prev.disabled = state.page <= 1;
  els.next.disabled = state.page >= totalPages;
}

function detailItem(label, value) {
  return `<div class="detail-item"><span>${label}</span><strong>${safe(value)}</strong></div>`;
}

function closeDrawer() {
  els.drawer.classList.remove("open");
  els.drawer.setAttribute("aria-hidden", "true");
}

function closeDrawerWithHistory() {
  if (window.location.hash === "#detail") {
    history.back();
  } else {
    closeDrawer();
  }
}

function openDrawer(record) {
  const manager = state.managers[record.registerNo] || {};
  els.drawerContent.innerHTML = `
    <div class="drawer-title">
      <div class="drawer-actions">
        <button type="button" data-close-drawer>← 返回人员列表</button>
        <a href="../change-center/">返回人员变动</a>
      </div>
      <h3>${safe(record.userName)}</h3>
      <p>${safe(record.managerName)} · ${safe(record.registerNo)}</p>
      <div class="drawer-tags">
        <span class="tag">${safe(record.fundScale)}</span>
        <span class="tag neutral">${safe(record.certName)}</span>
        <span class="tag ${statusClass(record)}">${safe(record.statusName)}</span>
        <span class="tag neutral">快照 ${safe(record.snapshotDate)}</span>
      </div>
    </div>

    <section class="detail-section">
      <h4>人员基本信息</h4>
      <div class="detail-grid">
        ${detailItem("人员姓名", record.userName)}
        ${detailItem("性别", record.sex)}
        ${detailItem("学历", record.educationName)}
        ${detailItem("证书状态", record.statusName)}
        ${detailItem("快照日期", record.snapshotDate)}
      </div>
    </section>

    <section class="detail-section">
      <h4>所属管理人信息</h4>
      <div class="detail-grid">
        ${detailItem("管理人名称", record.managerName)}
        ${detailItem("登记编号", record.registerNo)}
        ${detailItem("管理规模", record.fundScale)}
        ${detailItem("管理基金数量", manager.fundCount)}
        ${detailItem("注册地", `${safe(manager.registerProvince, "")}${safe(manager.registerCity, "")}`)}
        ${detailItem("办公地", `${safe(manager.officeProvince, "")}${safe(manager.officeCity, "")}`)}
        ${detailItem("成立时间", manager.establishDate)}
        ${detailItem("登记时间", manager.registerDate)}
      </div>
    </section>

    <section class="detail-section">
      <h4>证书信息</h4>
      <div class="detail-grid">
        ${detailItem("资格类别", record.certName)}
        ${detailItem("证书编号", record.certCode)}
        ${detailItem("证书取得日期", record.certObtainDate)}
        ${detailItem("证书到期日期", record.certEndDate)}
        ${detailItem("状态变更次数", record.certStatusChangeTimes)}
        ${detailItem("信用记录数量", record.creditRecordNum)}
      </div>
    </section>

    <section class="detail-section">
      <h4>历史变动记录</h4>
      <p class="subtle">当前仅接入第一期完整快照。第二期快照接入后，将在这里展示机构归属、资格状态和证书字段的历史变化。</p>
    </section>
  `;
  els.drawer.classList.add("open");
  els.drawer.setAttribute("aria-hidden", "false");
  if (window.location.hash !== "#detail") {
    history.pushState({ drawer: "personnel" }, "", "#detail");
  }
}

function resetFilters() {
  els.query.value = "";
  els.scale.value = "";
  els.cert.value = "";
  els.status.value = "";
  els.province.value = "";
  els.dateFrom.value = "";
  els.dateTo.value = "";
  clearQuickScales();
  document.querySelectorAll(".quick-filters button").forEach((btn) => btn.classList.remove("active"));
  applyFilters();
}

function exportCsv() {
  const fields = ["userName", "managerName", "registerNo", "fundScale", "certName", "certCode", "certObtainDate", "statusName", "snapshotDate"];
  const lines = [fields.join(",")].concat(
    state.filtered.map((record) =>
      fields
        .map((field) => `"${safe(record[field], "").replaceAll('"', '""')}"`)
        .join(",")
    )
  );
  const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "personnel_center_filtered.csv";
  link.click();
  URL.revokeObjectURL(link.href);
}

function bindEvents() {
  [els.query, els.cert, els.status, els.province, els.dateFrom, els.dateTo].forEach((el) => {
    el.addEventListener("input", applyFilters);
  });
  els.scale.addEventListener("input", () => {
    clearQuickScales();
    applyFilters();
  });
  els.sort.addEventListener("change", () => {
    sortRecords();
    renderTable();
  });
  els.reset.addEventListener("click", resetFilters);
  els.prev.addEventListener("click", () => {
    state.page -= 1;
    renderTable();
  });
  els.next.addEventListener("click", () => {
    state.page += 1;
    renderTable();
  });
  els.table.addEventListener("click", (event) => {
    if (event.target.closest("a")) return;
    const row = event.target.closest("tr[data-index]");
    if (!row) return;
    openDrawer(state.filtered[Number(row.dataset.index)]);
  });
  els.closeDrawer.addEventListener("click", closeDrawerWithHistory);
  els.drawerContent.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-drawer]")) closeDrawerWithHistory();
  });
  els.drawer.addEventListener("click", (event) => {
    if (event.target === els.drawer) closeDrawerWithHistory();
  });
  window.addEventListener("popstate", closeDrawer);
  document.querySelector("#quickFilters").addEventListener("click", (event) => {
    const btn = event.target.closest("button");
    if (!btn) return;
    if (btn.dataset.filter === "reset") {
      clearQuickScales();
    }
    if (btn.dataset.scale) {
      if (state.quickScales.has(btn.dataset.scale)) {
        state.quickScales.delete(btn.dataset.scale);
      } else {
        state.quickScales.add(btn.dataset.scale);
      }
      syncScaleSelectFromQuick();
      renderQuickScaleState();
    }
    applyFilters();
  });
  els.export.addEventListener("click", exportCsv);
}

async function init() {
  const [response, personDetailResponse] = await Promise.all([
    fetch(`./data/personnel-data.json?v=${Date.now()}`),
    fetch(`../change-center/data/person-detail-index.json?v=${Date.now()}`),
  ]);
  const payload = await response.json();
  const personDetailPayload = await personDetailResponse.json();
  state.personDetailLookup = buildPersonDetailLookup(personDetailPayload.records);
  state.managers = payload.managers || {};
  state.records = payload.records;
  state.filtered = [...state.records];
  renderMetrics(payload.meta);
  setupFilters(payload.filters);
  els.dataStatus.innerHTML = [
    `快照 ${payload.meta.snapshotDate}`,
    `覆盖 ${formatNumber(payload.meta.coveredManagerCount)} 家`,
    `${formatNumber(payload.meta.personCount)} 人`,
  ].map((text) => `<span>${text}</span>`).join("");
  bindEvents();
  applyFilters();
}

init().catch((error) => {
  console.error(error);
  els.dataStatus.textContent = "数据加载失败";
  els.table.innerHTML = `<tr><td colspan="8"><div class="empty-state">数据加载失败，请确认 data/personnel-data.json 已生成。</div></td></tr>`;
});
