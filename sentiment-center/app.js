const state = {
  meta: {},
  managerItems: [],
  viewpointItems: [],
  activeTab: "manager",
  filtered: [],
};

const els = {
  dataStatus: document.querySelector("#dataStatus"),
  metrics: document.querySelector("#metrics"),
  tabs: document.querySelectorAll("[data-tab]"),
  query: document.querySelector("#queryInput"),
  category: document.querySelector("#categoryFilter"),
  topic: document.querySelector("#topicFilter"),
  sort: document.querySelector("#sortSelect"),
  reset: document.querySelector("#resetBtn"),
  resultCount: document.querySelector("#resultCount"),
  resultLabel: document.querySelector("#resultLabel"),
  list: document.querySelector("#resultList"),
  export: document.querySelector("#exportBtn"),
};

function formatNumber(value) {
  return Number(value || 0).toLocaleString("zh-CN");
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]));
}

function safe(value, fallback = "-") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function activeItems() {
  return state.activeTab === "manager" ? state.managerItems : state.viewpointItems;
}

function renderStatus() {
  const m = state.meta;
  els.dataStatus.innerHTML = [
    `最新 ${safe(m.latestPostTime).slice(0, 10)}`,
    `来源 ${safe(m.source)}`,
    `抓取 ${safe(m.generatedAt).slice(0, 10)}`,
  ].map((text) => `<span>${escapeHtml(text)}</span>`).join("");
}

function renderMetrics() {
  const m = state.meta;
  const topics = new Set(state.viewpointItems.map((item) => item.topic).filter(Boolean)).size;
  const categories = new Set([...state.managerItems, ...state.viewpointItems].map((item) => item.category).filter(Boolean)).size;
  const cards = [
    ["来源文章", formatNumber(m.sourceArticleCount), "三类资讯首页结构化数据"],
    ["管理人舆情", formatNumber(state.managerItems.length), "可识别明确主体的文章"],
    ["观点条目", formatNumber(state.viewpointItems.length), "短观点加原文链接"],
    ["主题覆盖", formatNumber(topics), "按关键词归类"],
    ["分类覆盖", formatNumber(categories), "来源栏目与文章分类"],
  ];
  els.metrics.innerHTML = cards
    .map(
      ([label, value, note]) => `
        <article class="metric-card">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value)}</strong>
          <small>${escapeHtml(note)}</small>
        </article>
      `
    )
    .join("");
}

function populateFilters() {
  const items = activeItems();
  const categories = [...new Set(items.map((item) => item.category).filter(Boolean))].sort();
  const topics = [...new Set(items.map((item) => item.topic).filter(Boolean))].sort();
  els.category.innerHTML = `<option value="">全部分类</option>` + categories.map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`).join("");
  els.topic.innerHTML = `<option value="">全部主题</option>` + topics.map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`).join("");
  els.topic.disabled = state.activeTab === "manager";
}

function matchesQuery(item, query) {
  if (!query) return true;
  const text = [
    item.managerName,
    item.topic,
    item.title,
    item.category,
    item.section,
    item.viewpoint,
    ...(item.highlights || []),
  ].join(" ").toLowerCase();
  return text.includes(query);
}

function applyFilters() {
  const query = els.query.value.trim().toLowerCase();
  const category = els.category.value;
  const topic = els.topic.value;
  let rows = activeItems().filter((item) => {
    if (category && item.category !== category) return false;
    if (state.activeTab === "viewpoint" && topic && item.topic !== topic) return false;
    return matchesQuery(item, query);
  });
  rows.sort((a, b) => {
    if (els.sort.value === "dateAsc") return safe(a.postTime, "").localeCompare(safe(b.postTime, ""));
    if (els.sort.value === "titleAsc") return safe(a.title, "").localeCompare(safe(b.title, ""), "zh-CN");
    return safe(b.postTime, "").localeCompare(safe(a.postTime, ""));
  });
  state.filtered = rows;
  renderList();
}

function highlightList(item) {
  const points = item.highlights && item.highlights.length ? item.highlights : [item.viewpoint || item.title];
  return `<ul class="point-list">${points.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}</ul>`;
}

function managerItem(item) {
  return `
    <article class="news-item">
      <div class="item-head">
        <div class="item-title">
          <h2>${escapeHtml(item.managerName)}</h2>
          <h3>${escapeHtml(item.title)}</h3>
          <div class="item-meta">
            <span class="tag">${escapeHtml(item.category)}</span>
            <span class="tag neutral">${escapeHtml(item.section)}</span>
          </div>
        </div>
        <div class="date">${escapeHtml(safe(item.postTime).slice(0, 16))}</div>
      </div>
      ${highlightList(item)}
      <a class="article-link" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">查看原文</a>
    </article>
  `;
}

function viewpointItem(item) {
  return `
    <article class="news-item">
      <div class="item-head">
        <div class="item-title">
          <h2>${escapeHtml(item.title)}</h2>
          <h3>${escapeHtml(item.viewpoint)}</h3>
          <div class="item-meta">
            <span class="tag topic">${escapeHtml(item.topic)}</span>
            <span class="tag">${escapeHtml(item.category)}</span>
            <span class="tag neutral">${escapeHtml(item.section)}</span>
          </div>
        </div>
        <div class="date">${escapeHtml(safe(item.postTime).slice(0, 16))}</div>
      </div>
      ${highlightList(item)}
      <a class="article-link" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">查看原文</a>
    </article>
  `;
}

function renderList() {
  els.resultCount.textContent = formatNumber(state.filtered.length);
  els.resultLabel.textContent = state.activeTab === "manager" ? "条管理人舆情" : "条观点";
  if (!state.filtered.length) {
    els.list.innerHTML = `<div class="empty-state">没有匹配结果，请调整关键词或筛选条件。</div>`;
    return;
  }
  els.list.innerHTML = state.filtered.map((item) => (state.activeTab === "manager" ? managerItem(item) : viewpointItem(item))).join("");
}

function switchTab(tab) {
  state.activeTab = tab;
  els.tabs.forEach((button) => {
    const active = button.dataset.tab === tab;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", active ? "true" : "false");
  });
  els.category.value = "";
  els.topic.value = "";
  populateFilters();
  applyFilters();
}

function exportCsv() {
  const header = state.activeTab === "manager"
    ? ["管理人", "标题", "分类", "栏目", "发布时间", "要点", "链接"]
    : ["主题", "标题", "分类", "栏目", "发布时间", "观点", "链接"];
  const lines = [header.join(",")];
  state.filtered.forEach((item) => {
    const row = state.activeTab === "manager"
      ? [item.managerName, item.title, item.category, item.section, item.postTime, (item.highlights || []).join(" / "), item.url]
      : [item.topic, item.title, item.category, item.section, item.postTime, item.viewpoint, item.url];
    lines.push(row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","));
  });
  const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `sentiment-${state.activeTab}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

async function loadData() {
  try {
    const response = await fetch("./data/sentiment-data.json?ts=" + Date.now());
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    state.meta = data.meta || {};
    state.managerItems = data.managerItems || [];
    state.viewpointItems = data.viewpointItems || [];
    renderStatus();
    renderMetrics();
    populateFilters();
    applyFilters();
  } catch (error) {
    els.dataStatus.innerHTML = `<span>数据加载失败：${escapeHtml(error.message)}</span>`;
    els.list.innerHTML = `<div class="empty-state">请先运行抓取脚本生成 sentiment-data.json。</div>`;
  }
}

els.tabs.forEach((button) => button.addEventListener("click", () => switchTab(button.dataset.tab)));
[els.query, els.category, els.topic, els.sort].forEach((el) => el.addEventListener("input", applyFilters));
els.reset.addEventListener("click", () => {
  els.query.value = "";
  els.category.value = "";
  els.topic.value = "";
  els.sort.value = "dateDesc";
  applyFilters();
});
els.export.addEventListener("click", exportCsv);

async function loadAnalysis(){var p=document.getElementById('aiResults');if(!p)return;var r=await AiRender.loadAnalysisResult('./data/sentiment-analysis.json');if(!r||r._parseError){AiRender.mountCollapsibleAnalysis(p,AiRender.renderEmptyState(),{open:true});return}var h='',m=r.meta;if(m&&m.analyzedAt)h+='<div class="ai-update-time" style="margin-bottom:10px;text-align:right">分析时间：'+AiRender.fmtTime(m.analyzedAt)+' · 模型：'+AiRender.escapeHtml(m.model||'-')+'</div>';h+=AiRender.renderDualColumn(r);AiRender.mountCollapsibleAnalysis(p,h)}
loadData();loadAnalysis();
