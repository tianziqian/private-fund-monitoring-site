const state = {
  data: null,
  personnel: null,
  personDetails: null,
  personDetailLookup: new Map(),
  allManagers: [],
  allPeople: [],
  query: "",
};

const els = {
  summaryPills: document.querySelector("#summaryPills"),
  metrics: document.querySelector("#changeMetrics"),
  expansionList: document.querySelector("#expansionList"),
  shrinkList: document.querySelector("#shrinkList"),
  routeList: document.querySelector("#routeList"),
  search: document.querySelector("#changeSearch"),
  clearSearch: document.querySelector("#clearSearch"),
};

function fmt(value) {
  return Number(value || 0).toLocaleString("zh-CN");
}

function safe(value, fallback = "暂无数据") {
  return value === undefined || value === null || String(value).trim() === "" ? fallback : String(value);
}

function sign(value) {
  const n = Number(value || 0);
  if (n > 0) return `+${n}`;
  return String(n);
}

function changeClass(value) {
  return Number(value || 0) >= 0 ? "positive" : "negative";
}

function detailHref(registerNo) {
  return `./manager-detail.html?registerNo=${encodeURIComponent(registerNo)}`;
}

function personDetailKeys(person) {
  return [
    person.certCode ? `cert::${person.certCode}` : "",
    person.registerNo && person.userName ? `name::${person.registerNo}::${person.userName}` : "",
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

function personDetailHref(person) {
  for (const key of personDetailKeys(person)) {
    if (state.personDetailLookup.has(key)) return `./person-detail.html?id=${encodeURIComponent(state.personDetailLookup.get(key))}`;
  }
  return detailHref(person.registerNo);
}

function managerMeta(manager) {
  const changeText = manager.hasWeeklyChange
    ? `${fmt(manager.previousPersonCount)} → ${fmt(manager.currentPersonCount)}`
    : "本周无人员变动";
  return `${safe(manager.registerProvince)} · ${safe(manager.fundScale)} · ${changeText}`;
}

function searchableText(manager) {
  return [
    manager.managerName,
    manager.registerNo,
    manager.fundScale,
    manager.registerProvince,
    manager.officeProvince,
    ...(manager.addedPeople || []).map((person) => person.userName),
    ...(manager.removedPeople || []).map((person) => person.userName),
  ]
    .join(" ")
    .toLowerCase();
}

function matchQuery(manager) {
  if (!state.query) return true;
  return searchableText(manager).includes(state.query);
}

function matchPerson(person) {
  if (!state.query) return true;
  return [
    person.userName,
    person.managerName,
    person.registerNo,
    person.fundScale,
    person.certName,
    person.certCode,
    person.statusName,
    person.educationName,
  ]
    .join(" ")
    .toLowerCase()
    .includes(state.query);
}

function hasWeeklyChange(manager) {
  return Boolean(
    Number(manager.addedCount || 0) ||
      Number(manager.removedCount || 0) ||
      Number(manager.netChange || 0) ||
      (manager.sourceRoutes || []).length ||
      (manager.targetRoutes || []).length
  );
}

function routeMatches(route) {
  if (!state.query) return true;
  return [
    route.sourceManager,
    route.targetManager,
    route.userName,
    route.sourceScale,
    route.targetScale,
    route.sourceRegisterNo,
    route.targetRegisterNo,
  ]
    .join(" ")
    .toLowerCase()
    .includes(state.query);
}

function renderHeader() {
  const meta = state.data.meta;
  els.summaryPills.innerHTML = [
    `快照 ${meta.currentDate}`,
    `覆盖 ${fmt(meta.currentManagers)} 家`,
    `${fmt(meta.currentPersons)} 人`,
  ]
    .map((text) => `<span class="pill">${text}</span>`)
    .join("");
}

function renderMetrics() {
  const meta = state.data.meta;
  const cards = [
    ["本期新增人员", `${fmt(meta.addedPersons)} 人`, "本期快照新增出现"],
    ["本期减少人员", `${fmt(meta.removedPersons)} 人`, "本期快照未再出现"],
    ["机构变更人员", `${fmt(meta.movementRoutes)} 人`, "样本内明确迁移"],
  ];
  els.metrics.innerHTML = cards
    .map(
      ([label, value, note]) => `
        <article class="change-metric-card">
          <span>${label}</span>
          <strong>${value}</strong>
          <small>${note}</small>
        </article>
      `
    )
    .join("");
}

function renderRankList(container, managers, mode) {
  const filtered = managers.filter(matchQuery).slice(0, 8);
  if (!filtered.length) {
    container.innerHTML = `<div class="empty-state">未找到匹配的${mode === "expand" ? "扩张" : "收缩"}机构。</div>`;
    return;
  }
  container.innerHTML = filtered
    .map(
      (manager) => `
        <a class="rank-item" href="${detailHref(manager.registerNo)}">
          <div>
            <div class="name">${safe(manager.managerName)}</div>
            <div class="meta">${managerMeta(manager)}</div>
          </div>
          <div class="change-num ${changeClass(manager.netChange)}">${sign(manager.netChange)}</div>
        </a>
      `
    )
    .join("");
}

function renderManagerSearchResults(container, managers) {
  const filtered = managers.slice(0, 12);
  if (!filtered.length) {
    container.innerHTML = `<div class="empty-state">未找到匹配机构。</div>`;
    return;
  }
  container.innerHTML = filtered
    .map(
      (manager) => `
        <a class="rank-item" href="${detailHref(manager.registerNo)}">
          <div>
            <div class="name">${safe(manager.managerName)}</div>
            <div class="meta">${managerMeta(manager)}</div>
          </div>
          <div class="change-num ${manager.hasWeeklyChange ? changeClass(manager.netChange) : ""}">
            ${manager.hasWeeklyChange ? sign(manager.netChange) : "无变动"}
          </div>
        </a>
      `
    )
    .join("");
}

function renderPersonSearchResults(container, people) {
  const filtered = people.slice(0, 12);
  if (!filtered.length) {
    container.innerHTML = `<div class="empty-state">未找到匹配人员。</div>`;
    return;
  }
  container.innerHTML = filtered
    .map(
      (person) => `
        <a class="rank-item" href="${personDetailHref(person)}">
          <div>
            <div class="name">${safe(person.userName)}</div>
            <div class="meta">${safe(person.managerName)} · ${safe(person.certName)} · ${safe(person.statusName)}</div>
          </div>
          <div class="change-num">机构</div>
        </a>
      `
    )
    .join("");
}

function renderRoutes() {
  const routes = (state.data.routes || []).filter(routeMatches).slice(0, 8);
  if (!routes.length) {
    els.routeList.innerHTML = `<div class="empty-state">本期未识别到样本内明确流动路线。<br />仅展示有强匹配依据的路线，不对同名人员做强行判断。</div>`;
    return;
  }
  els.routeList.innerHTML = routes
    .map((route) => {
      const registerNo = route.targetRegisterNo || route.sourceRegisterNo;
      return `
        <a class="rank-item" href="${detailHref(registerNo)}">
          <div>
            <div class="name">${safe(route.sourceManager)}</div>
            <div class="route-arrow">→</div>
            <div class="name">${safe(route.targetManager)}</div>
            <div class="meta">${safe(route.sourceScale)} → ${safe(route.targetScale)} · ${safe(route.userName)}</div>
          </div>
          <div class="change-num">${fmt(route.count)} 人</div>
        </a>
      `;
    })
    .join("");
}

function renderHome() {
  const cardTitles = document.querySelectorAll(".rank-card h3");
  const cardKickers = document.querySelectorAll(".rank-card header span");
  if (state.query) {
    const managerMatches = state.allManagers.filter(matchQuery);
    const personMatches = state.allPeople.filter(matchPerson);
    cardTitles[0].textContent = `机构结果 ${fmt(managerMatches.length)} 家`;
    cardTitles[1].textContent = `人员结果 ${fmt(personMatches.length)} 位`;
    cardTitles[2].textContent = "相关流动路线";
    cardKickers[0].textContent = "MANAGERS";
    cardKickers[1].textContent = "PEOPLE";
    cardKickers[2].textContent = "ROUTES";
    renderManagerSearchResults(els.expansionList, managerMatches);
    renderPersonSearchResults(els.shrinkList, personMatches);
    renderRoutes();
    return;
  }
  cardTitles[0].textContent = "扩张最快";
  cardTitles[1].textContent = "收缩最明显";
  cardTitles[2].textContent = "样本内主要流动路线";
  cardKickers[0].textContent = "扩张";
  cardKickers[1].textContent = "收缩";
  cardKickers[2].textContent = "路线";
  renderRankList(els.expansionList, state.data.expansion, "expand");
  renderRankList(els.shrinkList, state.data.shrink, "shrink");
  renderRoutes();
}

function buildLatestManagers() {
  const peopleByManager = new Map();
  (state.personnel.records || []).forEach((person) => {
    if (!person.registerNo) return;
    if (!peopleByManager.has(person.registerNo)) peopleByManager.set(person.registerNo, []);
    peopleByManager.get(person.registerNo).push(person);
  });
  const changeByRegister = state.data.managerByRegister || {};
  return Object.entries(state.personnel.managers || {}).map(([registerNo, manager]) => {
    const people = peopleByManager.get(registerNo) || [];
    const change = changeByRegister[registerNo] || {};
    const weeklyChanged = hasWeeklyChange(change);
    return {
      registerNo,
      managerName: manager.managerName || people[0]?.managerName || "",
      fundScale: manager.fundScale || people[0]?.fundScale || "",
      registerProvince: manager.registerProvince || "",
      officeProvince: manager.officeProvince || "",
      fundCount: Number(manager.fundCount || 0),
      previousPersonCount: change.previousPersonCount ?? people.length,
      currentPersonCount: change.currentPersonCount ?? people.length,
      addedCount: change.addedCount ?? 0,
      removedCount: change.removedCount ?? 0,
      netChange: change.netChange ?? 0,
      addedPeople: change.addedPeople || [],
      removedPeople: change.removedPeople || [],
      sourceRoutes: change.sourceRoutes || [],
      targetRoutes: change.targetRoutes || [],
      hasWeeklyChange: weeklyChanged,
    };
  });
}

function bindEvents() {
  els.search.addEventListener("input", () => {
    state.query = els.search.value.trim().toLowerCase();
    renderHome();
  });
  els.clearSearch.addEventListener("click", () => {
    els.search.value = "";
    state.query = "";
    renderHome();
    els.search.focus();
  });
}

async function init() {
  const [changeResponse, personnelResponse, personDetailResponse] = await Promise.all([
    fetch(`./data/change-data.json?v=${Date.now()}`),
    fetch(`../personnel-center/data/personnel-data.json?v=${Date.now()}`),
    fetch(`./data/person-detail-index.json?v=${Date.now()}`),
  ]);
  state.data = await changeResponse.json();
  state.personnel = await personnelResponse.json();
  state.personDetails = await personDetailResponse.json();
  state.personDetailLookup = buildPersonDetailLookup(state.personDetails.records);
  state.allPeople = state.personnel.records || [];
  state.allManagers = buildLatestManagers();
  renderHeader();
  renderMetrics();
  renderHome();
  bindEvents();
}

init().catch((error)=>{console.error(error);if(els.summaryPills)els.summaryPills.textContent="数据加载失败"});
async function loadAnalysis(){var p=document.getElementById('aiResults');if(!p)return;var r=await AiRender.loadAnalysisResult('./data/change-analysis.json');if(!r||r._parseError){AiRender.mountCollapsibleAnalysis(p,AiRender.renderEmptyState(),{open:true});return}var h='',m=r.meta;if(m&&m.analyzedAt)h+='<div class="ai-update-time" style="margin-bottom:10px;text-align:right">分析时间：'+AiRender.fmtTime(m.analyzedAt)+' · 模型：'+AiRender.escapeHtml(m.model||'-')+'</div>';h+=AiRender.renderDualColumn(r);AiRender.mountCollapsibleAnalysis(p,h)}
loadAnalysis();
