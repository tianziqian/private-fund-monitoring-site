const state = {
  record: null,
  activeSection: "overview",
  scrollHandler: null,
};

const els = {
  updateLine: document.querySelector("#updateLine"),
  breadcrumb: document.querySelector("#breadcrumb"),
  personDetail: document.querySelector("#personDetail"),
};

function fmt(value) {
  return Number(value || 0).toLocaleString("zh-CN");
}

function safe(value, fallback = "暂无数据") {
  return value === undefined || value === null || String(value).trim() === "" ? fallback : String(value);
}

function compact(value, fallback = "--") {
  return value === undefined || value === null || String(value).trim() === "" ? fallback : String(value);
}

function managerHref(registerNo) {
  if (!registerNo) return "";
  return `./manager-detail.html?registerNo=${encodeURIComponent(registerNo)}`;
}

function managerLink(name, registerNo) {
  if (!name) return "暂无数据";
  if (!registerNo) return safe(name);
  return `<a class="table-link" href="${managerHref(registerNo)}">${safe(name)}</a>`;
}

function metricBox(label, value, note = "") {
  return `<div class="metric-box"><span>${label}</span><strong>${value}</strong>${note ? `<small>${note}</small>` : ""}</div>`;
}

function fieldRow(label, value) {
  return `<li><span>${label}</span><strong>${value}</strong></li>`;
}

function sign(value) {
  const n = Number(value || 0);
  if (n > 0) return `+${n}`;
  return String(n);
}

function statusText(record) {
  if (record.source === "manager_structure_executive") return "高管在任";
  if (record.personStatus === "N") return "正常";
  return safe(record.personStatus, "正常");
}

function sections(record) {
  return [
    ["overview", "人物概览", overview(record)],
    ["timeline", "履历时间线", timelineSection(record)],
  ];
}

function overview(record) {
  const summary = record.managerSummary || {};
  return `
    <div class="info-grid">
      <article class="info-card">
        <div class="section-kicker">PROFESSIONAL PROFILE</div>
        <h3>人物画像</h3>
        <ul class="profile-list">
          ${fieldRow("当前机构", managerLink(record.currentManagerName, record.currentRegisterNo))}
          ${fieldRow("当前城市", compact(record.currentCity))}
          ${fieldRow("管理人规模", compact(record.fundScale))}
          ${fieldRow("最近前机构", compact(record.previousManagerName))}
          ${fieldRow("资格状态", compact(record.statusName))}
          ${fieldRow("人物状态", statusText(record))}
          ${fieldRow("性别", compact(record.sex))}
          ${fieldRow("学历", compact(record.educationName))}
          ${fieldRow("资格类别", compact(record.certName))}
          ${fieldRow("证书编号", compact(record.certCode))}
          ${fieldRow("取得日期", compact(record.certObtainDate))}
          ${fieldRow("诚信记录", compact(record.creditRecordNum, "0"))}
          ${fieldRow("状态变更次数", compact(record.certStatusChangeTimes))}
        </ul>
      </article>
      <article class="info-card">
        <div class="section-kicker">ORGANIZATION PROFILE</div>
        <h3>当前机构摘要</h3>
        <div class="org-summary-card">
          <div class="meta">${compact(summary.city)} · ${compact(summary.fundScale)} · 当前机构</div>
          <h4>${managerLink(summary.managerName, summary.registerNo)}</h4>
          <p>管理基金 ${compact(summary.fundCount, "0")} 只 · 当前人数 ${compact(summary.currentPersonCount, "--")} 人</p>
          <div class="summary-stat-grid">
            <div><strong>${compact(summary.netChange, "0")}</strong><span>本期净变化</span></div>
            <div><strong>${compact(summary.pageRank)}</strong><span>PageRank</span></div>
            <div><strong>${compact(summary.externalInflowRatio)}</strong><span>外部流入</span></div>
          </div>
        </div>
      </article>
    </div>
  `;
}

function periodText(item) {
  const start = compact(item.startDate);
  const end = item.endDate ? item.endDate : "至今";
  return `${start} - ${end}`;
}

function timelineSection(record) {
  const timeline = record.timeline || [];
  if (!timeline.length) return `<article class="info-card"><h3>履历时间线</h3><div class="empty-state">暂无可识别履历。</div></article>`;
  return `
    <article class="info-card">
      <div class="card-title-row">
        <h3>履历时间线</h3>
        <span class="net-change-pill sample-status">${fmt(timeline.length)} 段</span>
      </div>
      <div class="timeline-list">
        ${timeline
          .map(
            (item) => `
              <div class="timeline-item ${item.isCurrent ? "current" : ""}">
                <div class="timeline-date">
                  <strong>${periodText(item)}</strong>
                  ${item.isCurrent ? `<span>当前任职</span>` : ""}
                </div>
                <div class="timeline-dot"></div>
                <div class="timeline-card">
                  <h4>${managerLink(item.company, item.registerNo)}</h4>
                  <p>${compact(item.city)} · ${compact(item.position)}</p>
                </div>
              </div>
            `
          )
          .join("")}
      </div>
    </article>
  `;
}

function setActiveSection(sectionId) {
  if (!sectionId) return;
  state.activeSection = sectionId;
  els.personDetail.querySelectorAll("[data-anchor]").forEach((button) => {
    button.classList.toggle("active", button.dataset.anchor === sectionId);
  });
}

function sectionAtViewport() {
  const all = [...document.querySelectorAll(".detail-section")];
  if (!all.length) return "";
  const anchorY = 150;
  let active = all[0].id;
  all.forEach((section) => {
    if (section.getBoundingClientRect().top <= anchorY) active = section.id;
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

function renderPerson(record) {
  els.breadcrumb.textContent = `人员变动监测 / 人员详情 / ${safe(record.userName)}`;
  const items = sections(record);
  els.personDetail.innerHTML = `
    <section class="manager-hero">
      <div class="manager-top">
        <div>
          <div class="back-link">人员详情</div>
          <h2>${safe(record.userName)}</h2>
          <p>${compact(record.educationName)} · ${compact(record.certName)} · ${compact(record.sex)} · ${compact(record.currentManagerName)}</p>
          <div class="manager-tags">
            <span class="tag">${compact(record.currentManagerName)}</span>
            <span class="tag">${compact(record.currentCity)}</span>
            <span class="tag">${compact(record.fundScale)}</span>
            <span class="tag">${compact(record.currentPosition)}</span>
          </div>
        </div>
        <div class="hero-metrics">
          ${metricBox("从业年限", compact(record.stats?.careerYears))}
          ${metricBox("历史机构数", `${fmt(record.stats?.historyOrgCount)} 家`)}
          ${metricBox("当前任期", compact(record.stats?.currentTenure))}
          ${metricBox("跨城次数", `${fmt(record.stats?.crossCityCount)} 次`)}
        </div>
      </div>
    </section>
    <div class="tabs person-tabs">
      ${items.map(([id, label]) => `<button class="tab-btn ${state.activeSection === id ? "active" : ""}" data-anchor="${id}">${label}</button>`).join("")}
    </div>
    <div class="detail-sections">
      ${items.map(([id, label, content]) => `<section class="detail-section" id="${id}" aria-label="${label}">${content}</section>`).join("")}
    </div>
  `;
  setupScrollSpy();
}

function bindEvents() {
  els.personDetail.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-anchor]");
    if (!btn) return;
    const section = document.getElementById(btn.dataset.anchor);
    if (!section) return;
    setActiveSection(btn.dataset.anchor);
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function shardForPersonId(id) {
  const match = String(id || "").match(/^person-([0-9a-f]{2})/i);
  return match ? match[1].toLowerCase() : "misc";
}

async function loadPersonRecord(id) {
  const shard = shardForPersonId(id);
  const response = await fetch(`./data/person-detail-shards/${shard}.json?v=${Date.now()}`);
  if (!response.ok) throw new Error(`Person detail shard not found: ${shard}`);
  const payload = await response.json();
  const record = payload.records?.[id] || payload[id];
  if (!record) throw new Error(`Person detail not found: ${id}`);
  return record;
}

async function init() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) {
    els.personDetail.innerHTML = `<div class="empty-detail">未找到该人员详情。请返回上一页重新选择。</div>`;
    return;
  }
  state.record = await loadPersonRecord(id);
  if (els.updateLine) {
    els.updateLine.textContent = `最近更新 ${compact(state.record.snapshotDate)} | 人员详情`;
  }
  if (!state.record) {
    els.personDetail.innerHTML = `<div class="empty-detail">未找到该人员详情。请返回上一页重新选择。</div>`;
    return;
  }
  renderPerson(state.record);
  bindEvents();
}

init().catch((error) => {
  console.error(error);
  if (els.updateLine) els.updateLine.textContent = "数据加载失败";
  els.personDetail.innerHTML = `<div class="empty-detail">人员详情数据加载失败，请确认 person-detail-shards 数据已生成。</div>`;
});
