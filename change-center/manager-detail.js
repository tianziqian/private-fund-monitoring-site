const state = {
  data: null,
  personnel: null,
  personDetails: null,
  personDetailLookup: null,
  manager: null,
  activeSection: "overview",
  scrollHandler: null,
};

const els = {
  updateLine: document.querySelector("#updateLine"),
  breadcrumb: document.querySelector("#breadcrumb"),
  managerDetail: document.querySelector("#managerDetail"),
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

function metricBox(label, value, className = "", note = "") {
  return `<div class="metric-box"><span>${label}</span><strong class="${className}">${value}</strong>${note ? `<small>${note}</small>` : ""}</div>`;
}

function netChangePill(value) {
  return `<span class="net-change-pill ${changeClass(value)}">净变化 ${sign(value)}</span>`;
}

function sampleStatus(manager) {
  return manager.sampleStatus || "in_scope";
}

function isExitedScope(manager) {
  return sampleStatus(manager) === "exited_scope";
}

function isEnteredScope(manager) {
  return sampleStatus(manager) === "entered_scope";
}

function currentPersonDisplay(manager) {
  if (isExitedScope(manager)) return "样本外";
  return `${fmt(manager.currentPersonCount)} 人`;
}

function periodEndDisplay(manager) {
  if (isExitedScope(manager)) return "样本外";
  return fmt(manager.currentPersonCount);
}

function periodChangeDisplay(manager, type) {
  if (isExitedScope(manager) || isEnteredScope(manager)) return "不计入";
  return fmt(type === "added" ? manager.addedCount : manager.removedCount);
}

function netStatusPill(manager) {
  if (isExitedScope(manager)) return `<span class="net-change-pill sample-status">退出样本</span>`;
  if (isEnteredScope(manager)) return `<span class="net-change-pill sample-status">进入样本</span>`;
  return netChangePill(manager.netChange);
}

function tagList(tags) {
  return (tags || []).map((tag) => `<span class="tag">${tag}</span>`).join("");
}

function personDetailHref(id) {
  return `./person-detail.html?id=${encodeURIComponent(id)}`;
}

function personLookupKeys(person) {
  return [
    person.certCode ? `cert::${person.certCode}` : "",
    person.registerNo && person.userName ? `name::${person.registerNo}::${person.userName}` : "",
    person.currentRegisterNo && person.userName ? `name::${person.currentRegisterNo}::${person.userName}` : "",
    person.currentRegisterNo && person.name ? `name::${person.currentRegisterNo}::${person.name}` : "",
  ].filter(Boolean);
}

function buildPersonLookup(records) {
  const lookup = new Map();
  (records || []).forEach((record) => {
    personLookupKeys(record).forEach((key) => {
      if (!lookup.has(key) || record.source === "manager_structure_executive") lookup.set(key, record.id);
    });
  });
  return lookup;
}

function findPersonDetailId(person) {
  if (!state.personDetailLookup) return "";
  for (const key of personLookupKeys(person)) {
    if (state.personDetailLookup.has(key)) return state.personDetailLookup.get(key);
  }
  return "";
}

function personNameLink(person, name) {
  const id = findPersonDetailId(person);
  const label = safe(name || person.userName || person.name);
  if (!id) return label;
  return `<a class="person-name-link" href="${personDetailHref(id)}">${label}</a>`;
}

function peopleRows(people, emptyText) {
  if (!people || !people.length) return `<div class="empty-state">${emptyText}</div>`;
  return `<div class="person-list">${people
    .map(
      (person) => `
        <div class="person-row">
          <div>
            <strong>${personNameLink(person, person.userName)}</strong>
            <div class="meta">${safe(person.certName)} · ${safe(person.educationName)}</div>
          </div>
          <div class="meta">${safe(person.certObtainDate)}</div>
        </div>
      `
    )
    .join("")}</div>`;
}

function routeRows(routes, direction, emptyText) {
  if (!routes || !routes.length) return `<div class="empty-state">${emptyText}</div>`;
  return `<div class="person-list">${routes
    .map((route) => {
      const counterparty = direction === "source" ? route.sourceManager : route.targetManager;
      const scale = direction === "source" ? route.sourceScale : route.targetScale;
      return `
        <div class="person-row">
          <div>
            <strong>${safe(counterparty)}</strong>
            <div class="meta">${safe(scale)} · ${safe(route.userName)}</div>
          </div>
          <div class="change-num">${fmt(route.count)} 人</div>
        </div>
      `;
    })
    .join("")}</div>`;
}

function sourceDestination(manager) {
  return `
    <div class="info-grid">
      <article class="info-card">
        <h3>主要人才来源</h3>
        ${routeRows(manager.sourceRoutes, "source", "本期暂无样本内明确来源路线。")}
      </article>
      <article class="info-card">
        <h3>主要人才去向</h3>
        ${routeRows(manager.targetRoutes, "target", "本期暂无样本内明确去向路线。")}
      </article>
    </div>
  `;
}

function overview(manager) {
  const profile = manager.profileMetrics || {};
  return `
    <div class="info-grid">
      <article class="info-card">
        <div class="card-title-row">
          <h3>最近一期变动</h3>
          ${netStatusPill(manager)}
        </div>
        <div class="mini-grid">
          ${metricBox("期初人数", fmt(manager.previousPersonCount), "", "上一期快照人员数量")}
          ${metricBox("期末人数", periodEndDisplay(manager), "", isExitedScope(manager) ? "本期已不在5亿元以上样本，未纳入人员抓取" : "当前快照人员数量")}
          ${metricBox("新增", periodChangeDisplay(manager, "added"), "", isEnteredScope(manager) || isExitedScope(manager) ? "样本范围变化不计入人员新增" : "本期新增出现人员")}
          ${metricBox("减少", periodChangeDisplay(manager, "removed"), "", isEnteredScope(manager) || isExitedScope(manager) ? "样本范围变化不计入人员减少" : "本期未再出现人员")}
        </div>
      </article>
      <article class="info-card">
        <h3>机构画像</h3>
        <div class="mini-grid">
          ${metricBox("平均任期", safe(profile.averageTenure, "--"), "", "快照日期 - 入职/本机构注册时间；缺失不纳入")}
          ${metricBox("女性占比", safe(profile.femaleRatio, "--"), "", "性别为女 / 有性别字段人数")}
          ${metricBox("硕博占比", safe(profile.masterDoctorRatio, "--"), "", "硕士研究生、博士研究生 / 有学历字段人数")}
          ${metricBox("人员稳定度", safe(profile.stability, "--"), "", "1 - (新增人数 + 减少人数) / 期初人数")}
        </div>
      </article>
    </div>
  `;
}

function addedRemoved(manager) {
  return `
    <div class="info-grid">
      <article class="info-card">
        <h3>本期新增</h3>
        ${peopleRows(manager.addedPeople, "本期暂无新增人员。")}
      </article>
      <article class="info-card">
        <h3>本期减少</h3>
        ${peopleRows(manager.removedPeople, "本期暂无减少人员。")}
      </article>
    </div>
  `;
}

function executiveRows(executives) {
  if (!executives || !executives.length) return `<div class="empty-state">协会详情页未披露高管信息。</div>`;
  return `<div class="executive-card-grid">${executives
    .map((person) => {
      const latestHistory = (person.workHistory || [])[0];
      const qualification = safe(person.hasFundQualification, "") === "是" ? "基金从业资格" : "";
      const roleLine = [safe(person.position, ""), qualification].filter(Boolean).join(" · ");
      return `
        <div class="executive-card">
          <strong>${personNameLink({ ...person, currentRegisterNo: state.manager?.registerNo }, person.name)}</strong>
          <div class="executive-role">${safe(roleLine, "--")}</div>
            ${
              latestHistory
              ? `<div class="executive-history">最近履历：${safe(latestHistory.period)} · ${safe(latestHistory.organization)} · ${safe(latestHistory.position)}</div>`
              : `<div class="executive-history">最近履历：暂无披露</div>`
            }
        </div>
      `;
    })
    .join("")}</div>`;
}

function shareholderRows(shareholders) {
  if (!shareholders || !shareholders.length) return `<div class="empty-state">协会详情页未披露出资人信息。</div>`;
  return `<div class="structure-list">${shareholders
    .map(
      (holder) => `
        <div class="structure-row">
          <div>
            <strong>${safe(holder.name)}</strong>
            <div class="meta">认缴比例：${safe(holder.subscribedRatio, "--")}</div>
          </div>
          <div class="meta">${safe(holder.shareholderType, "")}</div>
        </div>
      `
    )
    .join("")}</div>`;
}

function structureEquity(manager) {
  const structure = manager.structureInfo || {};
  return `
    <div class="structure-grid">
      <article class="info-card">
        <h3>实际控制人</h3>
        <div class="mini-box structure-single">
          <span>实际控制人姓名 / 名称</span>
          <strong>${safe(structure.actualControllerName, "--")}</strong>
        </div>
      </article>
      <article class="info-card">
        <h3>出资人信息</h3>
        ${shareholderRows(structure.shareholders)}
      </article>
      <article class="info-card structure-wide">
        <h3>高管信息</h3>
        ${executiveRows(structure.executives)}
      </article>
    </div>
  `;
}

function currentTeam(manager) {
  if (manager.currentPeople && manager.currentPeople.length) {
    return `
      <article class="info-card">
        <h3>当前团队</h3>
        ${peopleRows(manager.currentPeople, "暂无当前团队人员。")}
      </article>
    `;
  }
  return `
    <article class="info-card">
      <h3>当前团队</h3>
      <div class="empty-state">当前页面使用周度快照对比结果，未内嵌该机构完整当前团队名单。可从人员库按登记编号 ${safe(manager.registerNo)} 查看。</div>
    </article>
  `;
}

function currentTeamSection(manager) {
  if (isExitedScope(manager)) {
    return `<article class="info-card"><h3>当前团队</h3><div class="empty-state">该管理人本期已退出5亿元以上样本，当前团队未纳入本期抓取。</div></article>`;
  }
  return currentTeam(manager);
}

function ratio(numerator, denominator) {
  if (!denominator) return "--";
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

function buildProfileFromPeople(people, manager) {
  const genderPeople = people.filter((person) => safe(person.sex, "") !== "");
  const femaleCount = genderPeople.filter((person) => person.sex === "女").length;
  const educationPeople = people.filter((person) => safe(person.educationName, "") !== "");
  const masterDoctorCount = educationPeople.filter((person) =>
    ["硕士研究生", "博士研究生", "硕士", "博士"].includes(person.educationName)
  ).length;
  const previousCount = Number(manager.previousPersonCount || 0);
  const added = Number(manager.addedCount || 0);
  const removed = Number(manager.removedCount || 0);
  return {
    currentTeamSize: people.length,
    averageTenure: "--",
    femaleRatio: ratio(femaleCount, genderPeople.length),
    masterDoctorRatio: ratio(masterDoctorCount, educationPeople.length),
    seniorRoleCount: "--",
    stability: previousCount ? ratio(previousCount - added - removed, previousCount) : "--",
    profileSource: {
      peopleFile: "website-mvp/personnel-center/data/personnel-data.json",
      snapshotDate: state.personnel?.meta?.snapshotDate || "",
    },
  };
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

function buildFallbackManager(registerNo) {
  const manager = (state.personnel.managers || {})[registerNo];
  if (!manager) return null;
  const people = (state.personnel.records || []).filter((person) => person.registerNo === registerNo);
  const currentCount = people.length;
  const fallback = {
    registerNo,
    managerName: manager.managerName || people[0]?.managerName || "",
    fundScale: manager.fundScale || people[0]?.fundScale || "",
    registerProvince: manager.registerProvince || "",
    officeProvince: manager.officeProvince || "",
    fundCount: Number(manager.fundCount || 0),
    previousPersonCount: currentCount,
    currentPersonCount: currentCount,
    addedCount: 0,
    removedCount: 0,
    netChange: 0,
    addedPeople: [],
    removedPeople: [],
    sourceRoutes: [],
    targetRoutes: [],
    tags: [manager.registerProvince || "", manager.fundScale || people[0]?.fundScale || "", "本周无人员变动"].filter(Boolean),
    currentPeople: people,
    hasWeeklyChange: false,
  };
  fallback.profileMetrics = buildProfileFromPeople(people, fallback);
  return fallback;
}

function enrichManagerWithLatest(manager) {
  const people = (state.personnel.records || []).filter((person) => person.registerNo === manager.registerNo);
  const latestManager = (state.personnel.managers || {})[manager.registerNo] || {};
  const weeklyChanged = hasWeeklyChange(manager);
  const tags = weeklyChanged ? manager.tags : [...(manager.tags || []), "本周无人员变动"];
  return {
    ...manager,
    fundScale: latestManager.fundScale || manager.fundScale || people[0]?.fundScale || "",
    registerProvince: latestManager.registerProvince || manager.registerProvince || "",
    officeProvince: latestManager.officeProvince || manager.officeProvince || "",
    fundCount: Number(latestManager.fundCount || manager.fundCount || 0),
    currentPeople: people,
    tags: [...new Set(tags.filter(Boolean))],
    hasWeeklyChange: weeklyChanged,
  };
}

function latestManagerRecord(manager) {
  return (state.personnel?.managers || {})[manager.registerNo] || {};
}

function placeText(province, city) {
  const text = [safe(province, ""), safe(city, "")].filter((part) => part && part !== "暂无数据").join(" · ");
  return text || "暂无数据";
}

function infoField(label, value) {
  return `<div class="kv-item"><span>${label}</span><strong>${safe(value)}</strong></div>`;
}

function registryInfo(manager) {
  const record = latestManagerRecord(manager);
  return `
    <article class="info-card structure-wide">
      <h3>工商与登记信息</h3>
      <div class="kv-grid">
        ${infoField("登记编号", manager.registerNo)}
        ${infoField("规模区间", record.fundScale || manager.fundScale)}
        ${infoField("会员类型", safe(record.memberType, "--"))}
        ${infoField("组织形式", safe(record.orgForm, "--"))}
        ${infoField("在管基金数量", `${fmt(record.fundCount || manager.fundCount)} 只`)}
        ${infoField("成立时间", safe(record.establishDate, "--"))}
        ${infoField("登记时间", safe(record.registerDate, "--"))}
        ${infoField("注册地", placeText(record.registerProvince || manager.registerProvince, record.registerCity))}
        ${infoField("办公地", placeText(record.officeProvince || manager.officeProvince, record.officeCity))}
        ${infoField("注册资本", (manager.structureInfo || {}).registeredCapital ? `${manager.structureInfo.registeredCapital} 万元` : "--")}
        ${infoField("实缴资本", (manager.structureInfo || {}).paidInCapitalAmount ? `${manager.structureInfo.paidInCapitalAmount} 万元` : "--")}
        ${infoField("实缴比例", safe((manager.structureInfo || {}).paidInRatio, "--"))}
      </div>
    </article>
  `;
}

function certDistribution(people) {
  const counts = {};
  (people || []).forEach((person) => {
    const cert = safe(person.certName, "未披露");
    counts[cert] = (counts[cert] || 0) + 1;
  });
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const body = entries.length
    ? `<div class="kv-grid">${entries.map(([label, count]) => infoField(label, `${fmt(count)} 人`)).join("")}</div>`
    : `<div class="empty-state">暂无资格类别记录。</div>`;
  return `
    <article class="info-card structure-wide">
      <h3>资格类别分布</h3>
      ${body}
    </article>
  `;
}

function registrySection(manager) {
  return `
    <div class="info-grid">
      ${registryInfo(manager)}
      ${certDistribution(manager.currentPeople)}
    </div>
  `;
}

function detailSections(manager) {
  return [
    ["ai", "AI 解读", aiAnalysisSection(manager)],
    ["overview", "机构概览", overview(manager)],
    ["registry", "工商与登记", registrySection(manager)],
    ["routes", "主要来源与去向", sourceDestination(manager)],
    ["addedRemoved", "本期新增与减少", addedRemoved(manager)],
    ["structure", "结构与股权信息", structureEquity(manager)],
    ["team", "当前团队", currentTeamSection(manager)],
  ];
}

function aiAnalysisSection(manager) {
  return `
    <div class="ai-mgr-head">
      <span class="ai-mgr-title">基于工商/结构/人员数据的尽调定性解读</span>
      <button type="button" id="ai-mgr-btn" class="ai-mgr-btn" data-register="${safe(manager.registerNo, "")}">AI 解读</button>
    </div>
    <div id="ai-mgr-body" class="ai-mgr-body" hidden></div>
  `;
}

let _aiAnalysisCache = null;
async function loadAiAnalysis() {
  if (_aiAnalysisCache) return _aiAnalysisCache;
  try {
    const r = await fetch("../manager-center/data/manager-ai-analysis.json", { cache: "no-store" });
    if (!r.ok) return null;
    _aiAnalysisCache = await r.json();
    return _aiAnalysisCache;
  } catch (_) {
    return null;
  }
}

function escapeAi(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);
}

function renderAiAnalysis(a) {
  if (!a) {
    return '<p class="empty-state">该管理人暂未生成 AI 解读。目前已覆盖尽调关注清单，其余可运行 <code>build_manager_ai_analysis.py</code> 补充生成。</p>';
  }
  const flagLabel = { info: "提示", warn: "关注", risk: "风险" };
  const riskMap = { low: "低", medium: "中", high: "高" };
  const secs = (a.sections || []).map((s) => `
    <div class="ai-mgr-sec ai-mgr-flag-${escapeAi(s.flag || "info")}">
      <div class="ai-mgr-sec-head"><strong>${escapeAi(s.title)}</strong>
        <span class="ai-mgr-flag-tag">${flagLabel[s.flag] || "提示"}</span></div>
      <p>${escapeAi(s.body)}</p>
    </div>`).join("");
  const kps = (a.keyPoints || []).map((k) => `<li>${escapeAi(k)}</li>`).join("");
  return `
    <div class="ai-mgr-verdict ai-mgr-risk-${escapeAi(a.riskLevel || "low")}">
      <span class="ai-mgr-risk-badge">整体风险 · ${riskMap[a.riskLevel] || "—"}</span>
      <strong>${escapeAi(a.verdict)}</strong>
    </div>
    <div class="ai-mgr-sections">${secs}</div>
    ${kps ? `<div class="ai-mgr-keypoints"><h5>尽调重点提示</h5><ul>${kps}</ul></div>` : ""}
    <p class="ai-mgr-note">AI 解读（规则引擎 + ${escapeAi(a.model || "")}）· 生成于 ${escapeAi((a.generatedAt || "").slice(0, 10))}；仅供尽调参考，需人工复核。</p>
  `;
}

async function toggleAiAnalysis(btn) {
  const body = document.getElementById("ai-mgr-body");
  if (!body) return;
  if (body.dataset.loaded === "1") {
    const hidden = body.hidden;
    body.hidden = !hidden;
    btn.textContent = hidden ? "收起解读" : "AI 解读";
    return;
  }
  btn.disabled = true;
  btn.textContent = "加载中…";
  const data = await loadAiAnalysis();
  const a = data && data.managers ? data.managers[btn.dataset.register] : null;
  body.innerHTML = renderAiAnalysis(a);
  body.hidden = false;
  body.dataset.loaded = "1";
  btn.disabled = false;
  btn.textContent = "收起解读";
}

function setActiveSection(sectionId) {
  if (!sectionId) return;
  state.activeSection = sectionId;
  els.managerDetail.querySelectorAll("[data-anchor]").forEach((button) => {
    button.classList.toggle("active", button.dataset.anchor === sectionId);
  });
}

function sectionAtViewport() {
  const sections = [...document.querySelectorAll(".detail-section")];
  if (!sections.length) return "";
  const anchorY = 150;
  let active = sections[0].id;
  sections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    if (rect.top <= anchorY) active = section.id;
  });
  return active;
}

function setupScrollSpy() {
  if (state.scrollHandler) window.removeEventListener("scroll", state.scrollHandler);
  let ticking = false;
  state.scrollHandler = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      setActiveSection(sectionAtViewport());
      ticking = false;
    });
  };
  window.addEventListener("scroll", state.scrollHandler, { passive: true });
  setActiveSection(sectionAtViewport());
}

function renderManagerDetail(manager) {
  const profile = manager.profileMetrics || {};
  els.breadcrumb.textContent = `人员变动监测 / 管理人详情 / ${safe(manager.managerName)}`;
  const sections = detailSections(manager);
  els.managerDetail.innerHTML = `
    <section class="manager-hero">
      <div class="manager-top">
        <div>
          <div class="back-link">管理人详情</div>
          <h2>${safe(manager.managerName)}</h2>
          <p>聚合最近一周人员变化、主要来源去向与当前团队结构。</p>
        </div>
        <div class="hero-metrics">
          ${metricBox("当前人数", currentPersonDisplay(manager))}
          ${metricBox("管理基金", `${fmt(manager.fundCount)} 只`)}
          ${metricBox("本期净变化", isExitedScope(manager) || isEnteredScope(manager) ? safe(manager.sampleStatusName, "样本范围变化") : sign(manager.netChange), isExitedScope(manager) || isEnteredScope(manager) ? "" : changeClass(manager.netChange))}
          ${metricBox("人员稳定度", safe(profile.stability, "--"))}
        </div>
      </div>
      <div class="manager-tags">${tagList(manager.tags)}</div>
    </section>
    <div class="tabs">
      ${sections.map(([id, label]) => `<button class="tab-btn ${state.activeSection === id ? "active" : ""}" data-anchor="${id}">${label}</button>`).join("")}
    </div>
    <div class="detail-sections">
      ${sections.map(([id, label, content]) => `<section class="detail-section" id="${id}" aria-label="${label}">${content}</section>`).join("")}
    </div>
  `;
  setupScrollSpy();
}

function bindEvents() {
  els.managerDetail.addEventListener("click", (event) => {
    const aiBtn = event.target.closest("#ai-mgr-btn");
    if (aiBtn) {
      toggleAiAnalysis(aiBtn);
      return;
    }
    const btn = event.target.closest("[data-anchor]");
    if (!btn || !state.manager) return;
    const section = document.getElementById(btn.dataset.anchor);
    if (!section) return;
    setActiveSection(btn.dataset.anchor);
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

async function init() {
  const registerNo = new URLSearchParams(window.location.search).get("registerNo");
  const [changeResponse, personnelResponse, personDetailResponse] = await Promise.all([
    fetch(`./data/change-data.json?v=${Date.now()}`),
    fetch(`../personnel-center/data/personnel-data.json?v=${Date.now()}`),
    fetch(`./data/person-detail-index.json?v=${Date.now()}`),
  ]);
  state.data = await changeResponse.json();
  state.personnel = await personnelResponse.json();
  state.personDetails = await personDetailResponse.json();
  state.personDetailLookup = buildPersonLookup(state.personDetails.records);
  const meta = state.data.meta;
  const latestDate = state.personnel?.meta?.snapshotDate || meta.currentDate;
  if (els.updateLine) els.updateLine.textContent = `最近更新 ${latestDate} | 覆盖范围：${meta.coverage} | 周度区间：${meta.previousDate} — ${meta.currentDate}`;
  state.manager = state.data.managerByRegister[registerNo]
    ? enrichManagerWithLatest(state.data.managerByRegister[registerNo])
    : buildFallbackManager(registerNo);
  if (!state.manager) {
    els.managerDetail.innerHTML = `<div class="empty-detail">未找到该管理人。请返回人员变动首页重新选择。</div>`;
    return;
  }
  renderManagerDetail(state.manager);
  bindEvents();
}

init().catch((error) => {
  console.error(error);
  if (els.updateLine) els.updateLine.textContent = "数据加载失败";
});
