const state = {
  managers: [],
  peopleByManager: {},
  filtered: [],
  page: 1,
  pageSize: 40,
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
  registerProvince: document.querySelector("#registerProvinceFilter"),
  officeProvince: document.querySelector("#officeProvinceFilter"),
  memberType: document.querySelector("#memberTypeFilter"),
  minPeople: document.querySelector("#minPeopleFilter"),
  minFund: document.querySelector("#minFundFilter"),
  reset: document.querySelector("#resetBtn"),
  resultCount: document.querySelector("#resultCount"),
  sort: document.querySelector("#sortSelect"),
  table: document.querySelector("#managerTable"),
  prev: document.querySelector("#prevPage"),
  next: document.querySelector("#nextPage"),
  pageInfo: document.querySelector("#pageInfo"),
  drawer: document.querySelector("#drawer"),
  drawerContent: document.querySelector("#drawerContent"),
  closeDrawer: document.querySelector("#closeDrawer"),
  export: document.querySelector("#exportBtn"),
};

function safe(value, fallback = "未披露") {
  return value === undefined || value === null || String(value).trim() === "" ? fallback : String(value);
}

function num(value) {
  const parsed = Number(String(value || "").replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("zh-CN");
}

function option(select, value) {
  const el = document.createElement("option");
  el.value = value;
  el.textContent = value;
  select.appendChild(el);
}

function buildManagers(payload) {
  const peopleByManager = {};
  payload.records.forEach((person) => {
    if (!peopleByManager[person.registerNo]) peopleByManager[person.registerNo] = [];
    peopleByManager[person.registerNo].push(person);
  });
  state.peopleByManager = peopleByManager;
  state.managers = Object.entries(payload.managers || {}).map(([registerNo, manager]) => {
    const people = peopleByManager[registerNo] || [];
    const certCounts = {};
    people.forEach((person) => {
      const cert = person.certName || "未披露";
      certCounts[cert] = (certCounts[cert] || 0) + 1;
    });
    return {
      ...manager,
      registerNo,
      managerName: manager.managerName || people[0]?.managerName || "",
      fundScale: manager.fundScale || people[0]?.fundScale || "",
      fundScaleCode: manager.fundScaleCode || people[0]?.fundScaleCode || "",
      peopleCount: people.length,
      certCounts,
      certCategoryCount: Object.keys(certCounts).length,
    };
  });
}

function renderMetrics(meta) {
  const totalFunds = state.managers.reduce((sum, item) => sum + num(item.fundCount), 0);
  const maxPeople = state.managers.reduce((max, item) => Math.max(max, item.peopleCount), 0);
  const topScaleManagers = state.managers.filter((item) => item.fundScale === "100亿元以上").length;
  const cards = [
    ["管理人总数", `${formatNumber(state.managers.length)} 家`, "5亿元以上证券类私募"],
    ["人员覆盖", `${formatNumber(meta.personCount)} 人`, "来自完整人员快照"],
    ["平均团队人数", `${meta.averagePersonsPerManager} 人`, "按登记编号聚合"],
    ["100亿以上机构", `${formatNumber(topScaleManagers)} 家`, "最高规模区间"],
    ["在管基金合计", `${formatNumber(totalFunds)} 只`, "按协会字段汇总"],
    ["最大团队人数", `${formatNumber(maxPeople)} 人`, "单家管理人当前人员数"],
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

function setupFilters() {
  const scales = ["5-10亿元", "10-20亿元", "20-50亿元", "50-100亿元", "100亿元以上"];
  const registerProvinces = [...new Set(state.managers.map((x) => x.registerProvince).filter(Boolean))].sort();
  const officeProvinces = [...new Set(state.managers.map((x) => x.officeProvince).filter(Boolean))].sort();
  const memberTypes = [...new Set(state.managers.map((x) => x.memberType).filter(Boolean))].sort();
  scales.forEach((x) => option(els.scale, x));
  registerProvinces.forEach((x) => option(els.registerProvince, x));
  officeProvinces.forEach((x) => option(els.officeProvince, x));
  memberTypes.forEach((x) => option(els.memberType, x));
}

function clearQuickScales() {
  state.quickScales.clear();
  document.querySelectorAll(".quick-filters button[data-scale]").forEach((btn) => btn.classList.remove("active"));
}

function syncScaleSelectFromQuick() {
  els.scale.value = state.quickScales.size === 1 ? Array.from(state.quickScales)[0] : "";
}

function matchesQuickScale(manager) {
  if (!state.quickScales.size) return true;
  return state.quickScales.has(manager.fundScale);
}

function applyFilters() {
  const q = els.query.value.trim().toLowerCase();
  const minPeople = Number(els.minPeople.value || 0);
  const minFund = Number(els.minFund.value || 0);
  state.filtered = state.managers.filter((manager) => {
    const haystack = [
      manager.managerName,
      manager.registerNo,
      manager.fundScale,
      manager.registerProvince,
      manager.registerCity,
      manager.officeProvince,
      manager.officeCity,
      manager.memberType,
    ]
      .join(" ")
      .toLowerCase();
    if (q && !haystack.includes(q)) return false;
    if (els.scale.value && manager.fundScale !== els.scale.value) return false;
    if (els.registerProvince.value && manager.registerProvince !== els.registerProvince.value) return false;
    if (els.officeProvince.value && manager.officeProvince !== els.officeProvince.value) return false;
    if (els.memberType.value && manager.memberType !== els.memberType.value) return false;
    if (minPeople && manager.peopleCount < minPeople) return false;
    if (minFund && num(manager.fundCount) < minFund) return false;
    return matchesQuickScale(manager);
  });
  sortManagers();
  state.page = 1;
  renderTable();
}

function sortManagers() {
  const mode = els.sort.value;
  state.filtered.sort((a, b) => {
    if (mode === "peopleDesc") return b.peopleCount - a.peopleCount;
    if (mode === "fundDesc") return num(b.fundCount) - num(a.fundCount);
    if (mode === "registerDateDesc") return safe(b.registerDate, "").localeCompare(safe(a.registerDate, ""));
    if (mode === "nameAsc") return safe(a.managerName, "").localeCompare(safe(b.managerName, ""), "zh-Hans-CN");
    return (
      (scaleRank[b.fundScale] || 0) - (scaleRank[a.fundScale] || 0) ||
      b.peopleCount - a.peopleCount ||
      safe(a.managerName, "").localeCompare(safe(b.managerName, ""), "zh-Hans-CN")
    );
  });
}

function place(province, city) {
  const text = `${safe(province, "")}${safe(city, "")}`;
  return text || "未披露";
}

function renderTable() {
  els.resultCount.textContent = formatNumber(state.filtered.length);
  const totalPages = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
  state.page = Math.min(state.page, totalPages);
  const start = (state.page - 1) * state.pageSize;
  const rows = state.filtered.slice(start, start + state.pageSize);
  if (!rows.length) {
    els.table.innerHTML = `<tr><td colspan="9"><div class="empty-state">没有匹配管理人。请调整关键词或筛选条件。</div></td></tr>`;
  } else {
    els.table.innerHTML = rows
      .map(
        (manager, idx) => `
          <tr data-index="${start + idx}">
            <td class="manager-cell"><strong>${safe(manager.managerName)}</strong><div class="subtle">${safe(manager.memberType)}</div></td>
            <td>${safe(manager.registerNo)}</td>
            <td><span class="tag">${safe(manager.fundScale)}</span></td>
            <td>${place(manager.registerProvince, manager.registerCity)}</td>
            <td>${place(manager.officeProvince, manager.officeCity)}</td>
            <td>${safe(manager.establishDate)}</td>
            <td>${safe(manager.registerDate)}</td>
            <td>${formatNumber(num(manager.fundCount))}</td>
            <td><strong>${formatNumber(manager.peopleCount)}</strong></td>
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

function certDistribution(manager) {
  const entries = Object.entries(manager.certCounts || {}).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return `<p class="subtle">暂无资格类别记录。</p>`;
  return entries
    .map(([label, count]) => `<div class="detail-item"><span>${label}</span><strong>${formatNumber(count)} 人</strong></div>`)
    .join("");
}

function peopleList(manager) {
  const people = (state.peopleByManager[manager.registerNo] || []).slice(0, 12);
  if (!people.length) return `<p class="subtle">暂无人员记录。</p>`;
  return `
    <div class="table-wrap compact-table">
      <table>
        <thead><tr><th>人员姓名</th><th>资格类别</th><th>证书取得日期</th><th>状态</th></tr></thead>
        <tbody>
          ${people
            .map(
              (person) => `
                <tr>
                  <td>${safe(person.userName)}</td>
                  <td>${safe(person.certName)}</td>
                  <td>${safe(person.certObtainDate)}</td>
                  <td>${safe(person.statusName)}</td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </div>
    <p class="subtle">仅展示前 12 名人员；完整名单可在人员库按登记编号 ${safe(manager.registerNo)} 检索。</p>
  `;
}

function openDrawer(manager) {
  els.drawerContent.innerHTML = `
    <div class="drawer-title">
      <div class="drawer-actions">
        <button type="button" data-close-drawer>← 返回管理人列表</button>
        <a href="../change-center/">返回人员变动</a>
      </div>
      <h3>${safe(manager.managerName)}</h3>
      <p>${safe(manager.registerNo)} · ${safe(manager.fundScale)}</p>
      <div class="drawer-tags">
        <span class="tag">${safe(manager.fundScale)}</span>
        <span class="tag neutral">${formatNumber(manager.peopleCount)} 人</span>
        <span class="tag neutral">${formatNumber(num(manager.fundCount))} 只基金</span>
        <span class="tag neutral">${safe(manager.memberType)}</span>
      </div>
    </div>

    <section class="detail-section">
      <h4>基本信息</h4>
      <div class="detail-grid">
        ${detailItem("管理人名称", manager.managerName)}
        ${detailItem("登记编号", manager.registerNo)}
        ${detailItem("规模区间", manager.fundScale)}
        ${detailItem("会员类型", manager.memberType)}
        ${detailItem("组织形式", manager.orgForm)}
        ${detailItem("在管基金数量", `${formatNumber(num(manager.fundCount))} 只`)}
        ${detailItem("成立时间", manager.establishDate)}
        ${detailItem("登记时间", manager.registerDate)}
      </div>
    </section>

    <section class="detail-section">
      <h4>管理人画像</h4>
      <div class="detail-grid">
        ${detailItem("注册地", place(manager.registerProvince, manager.registerCity))}
        ${detailItem("办公地", place(manager.officeProvince, manager.officeCity))}
        ${detailItem("注册资本", manager.registeredCapital ? `${manager.registeredCapital} 万元` : "")}
        ${detailItem("实缴资本", manager.paidInCapitalAmount ? `${manager.paidInCapitalAmount} 万元` : "")}
        ${detailItem("实缴比例", manager.paidInRatio)}
        ${detailItem("特殊提示", manager.hasSpecialTips)}
        ${detailItem("诚信提示", manager.hasCreditTips)}
      </div>
    </section>

    <section class="detail-section">
      <h4>人员数量统计</h4>
      <div class="detail-grid">
        ${detailItem("当前人员数量", `${formatNumber(manager.peopleCount)} 人`)}
        ${detailItem("资格类别数量", `${formatNumber(manager.certCategoryCount)} 类`)}
      </div>
    </section>

    <section class="detail-section">
      <h4>资格类别分布</h4>
      <div class="detail-grid">${certDistribution(manager)}</div>
    </section>

    <section class="detail-section">
      <h4>人员列表</h4>
      ${peopleList(manager)}
    </section>

    <section class="detail-section">
      <h4>人员变动预留</h4>
      <p class="subtle">当前仅接入第一期完整快照。第二期快照接入后，将在这里展示新增、减少、资格/状态变化及异常复核项。</p>
    </section>
  `;
  els.drawer.classList.add("open");
  els.drawer.setAttribute("aria-hidden", "false");
  if (window.location.hash !== "#detail") {
    history.pushState({ drawer: "manager" }, "", "#detail");
  }
}

function resetFilters() {
  els.query.value = "";
  els.scale.value = "";
  els.registerProvince.value = "";
  els.officeProvince.value = "";
  els.memberType.value = "";
  els.minPeople.value = "";
  els.minFund.value = "";
  clearQuickScales();
  applyFilters();
}

function exportCsv() {
  const fields = ["managerName", "registerNo", "fundScale", "registerProvince", "registerCity", "officeProvince", "officeCity", "establishDate", "registerDate", "fundCount", "peopleCount", "memberType"];
  const lines = [fields.join(",")].concat(
    state.filtered.map((manager) =>
      fields
        .map((field) => `"${safe(manager[field], "").replaceAll('"', '""')}"`)
        .join(",")
    )
  );
  const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "manager_center_filtered.csv";
  link.click();
  URL.revokeObjectURL(link.href);
}

function bindEvents() {
  [els.query, els.registerProvince, els.officeProvince, els.memberType, els.minPeople, els.minFund].forEach((el) => {
    el.addEventListener("input", applyFilters);
  });
  els.scale.addEventListener("input", () => {
    clearQuickScales();
    applyFilters();
  });
  els.sort.addEventListener("change", () => {
    sortManagers();
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
    const row = event.target.closest("tr[data-index]");
    if (!row) return;
    const manager = state.filtered[Number(row.dataset.index)];
    if (manager && manager.registerNo) {
      window.location.href = `../change-center/manager-detail.html?registerNo=${encodeURIComponent(manager.registerNo)}`;
    }
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
      document.querySelectorAll(".quick-filters button[data-scale]").forEach((item) => {
        item.classList.toggle("active", state.quickScales.has(item.dataset.scale));
      });
    }
    applyFilters();
  });
  els.export.addEventListener("click", exportCsv);
}

async function init() {
  const response = await fetch(`../personnel-center/data/personnel-data.json?v=${Date.now()}`);
  const payload = await response.json();
  buildManagers(payload);
  state.filtered = [...state.managers];
  renderMetrics(payload.meta);
  setupFilters();
  els.dataStatus.innerHTML = [
    `快照 ${payload.meta.snapshotDate}`,
    `覆盖 ${formatNumber(state.managers.length)} 家`,
    `${formatNumber(payload.meta.personCount)} 人`,
  ].map((text) => `<span>${text}</span>`).join("");
  bindEvents();
  applyFilters();
}

init().catch((error) => {
  console.error(error);
  els.dataStatus.textContent = "数据加载失败";
  els.table.innerHTML = `<tr><td colspan="9"><div class="empty-state">数据加载失败，请确认人员库数据文件已生成。</div></td></tr>`;
});
