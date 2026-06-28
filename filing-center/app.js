const state = {
  meta: {},
  weeklyCounts: [],
  top15: [],
  filings: [],
  filtered: [],
  page: 1,
  pageSize: 50,
};

const els = {
  dataStatus: document.querySelector("#dataStatus"),
  metrics: document.querySelector("#metrics"),
  trendSubtitle: document.querySelector("#trendSubtitle"),
  topSubtitle: document.querySelector("#topSubtitle"),
  detailSubtitle: document.querySelector("#detailSubtitle"),
  weeklyChart: document.querySelector("#weeklyChart"),
  topTable: document.querySelector("#topTable"),
  query: document.querySelector("#queryInput"),
  managerType: document.querySelector("#managerTypeFilter"),
  state: document.querySelector("#stateFilter"),
  sort: document.querySelector("#sortSelect"),
  reset: document.querySelector("#resetBtn"),
  resultCount: document.querySelector("#resultCount"),
  table: document.querySelector("#filingTable"),
  prev: document.querySelector("#prevPage"),
  next: document.querySelector("#nextPage"),
  pageInfo: document.querySelector("#pageInfo"),
  export: document.querySelector("#exportBtn"),
};

function formatNumber(value) {
  return Number(value || 0).toLocaleString("zh-CN");
}

function safe(value, fallback = "未披露") {
  return value === undefined || value === null || String(value).trim() === "" ? fallback : String(value);
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

async function loadData() {
  try {
    const response = await fetch("./data/filing-data.json?ts=" + Date.now());
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    state.meta = data.meta || {};
    state.weeklyCounts = data.weeklyCounts || [];
    state.top15 = data.currentWeekTop15 || [];
    state.filings = data.currentWeekFilings || [];
    renderAll();
  } catch (error) {
    els.dataStatus.innerHTML = `<span class="tag warn">数据加载失败：${escapeHtml(error.message)}</span>`;
    els.weeklyChart.innerHTML = `<div class="empty-state">暂无备案数据，请先运行抓取与构建脚本生成 data/filing-data.json。</div>`;
  }
}

function renderAll() {
  renderStatus();
  renderMetrics();
  renderChart();
  renderTop15();
  populateFilters();
  applyFilters();
}

function renderStatus() {
  const m = state.meta;
  els.dataStatus.innerHTML = [
    `<span>口径：${escapeHtml(m.fundTypeLabel || "证券类私募")}</span>`,
    `<span>本周：${escapeHtml(m.currentWeekLabel || "-")}</span>`,
    `<span>更新：${escapeHtml((m.generatedAt || "").slice(0, 10))}</span>`,
  ].join("");
  els.trendSubtitle.textContent = `近 ${m.weeks || state.weeklyCounts.length} 周新增备案产品数量（按备案日期所在自然周统计）`;
  els.topSubtitle.textContent = `本周（${safe(m.currentWeekLabel, "-")}）备案产品数量最多的管理人`;
  els.detailSubtitle.textContent = `本周（${safe(m.currentWeekLabel, "-")}）新增备案的证券类私募产品`;
}

function renderMetrics() {
  const m = state.meta;
  const wow = m.weekOverWeekChange ?? 0;
  const wowPct = m.weekOverWeekPct;
  const wowClass = wow > 0 ? "ok" : wow < 0 ? "warn" : "neutral";
  const wowText =
    `${wow > 0 ? "+" : ""}${formatNumber(wow)}` + (wowPct === null || wowPct === undefined ? "" : ` (${wowPct > 0 ? "+" : ""}${wowPct}%)`);
  const cards = [
    { label: "本周备案数量", value: formatNumber(m.currentWeekCount), note: `上周 ${formatNumber(m.previousWeekCount)} 只` },
    { label: "周环比", value: wowText, note: "相比上一自然周", cls: wowClass },
    { label: "本周备案管理人", value: formatNumber(m.currentWeekManagerCount), note: "本周有新备案的管理人家数" },
    { label: `近${m.weeks || state.weeklyCounts.length}周周均`, value: formatNumber(m.averageWeeklyCount), note: "周度备案数量均值" },
    { label: `近${m.weeks || state.weeklyCounts.length}周累计`, value: formatNumber(m.totalFilings), note: "窗口期累计新增备案" },
  ];
  els.metrics.innerHTML = cards
    .map(
      (card) => `
      <div class="metric-card">
        <span>${escapeHtml(card.label)}</span>
        <strong${card.cls ? ` class="${card.cls === "ok" ? "" : ""}"` : ""} style="${card.cls === "ok" ? "color:var(--green)" : card.cls === "warn" ? "color:var(--red)" : ""}">${escapeHtml(card.value)}</strong>
        <small>${escapeHtml(card.note)}</small>
      </div>`
    )
    .join("");
}

function renderChart() {
  const data = state.weeklyCounts;
  if (!data.length) {
    els.weeklyChart.innerHTML = `<div class="empty-state">暂无周度数据</div>`;
    return;
  }
  const width = Math.max(720, data.length * 92);
  const height = 320;
  const padTop = 28;
  const padBottom = 56;
  const padX = 24;
  const innerW = width - padX * 2;
  const innerH = height - padTop - padBottom;
  const maxVal = Math.max(...data.map((d) => d.fundCount), 1);
  const slot = innerW / data.length;
  const barW = Math.min(54, slot * 0.62);
  const currentKey = state.meta.currentWeekMonday;

  const bars = data
    .map((d, i) => {
      const x = padX + i * slot + (slot - barW) / 2;
      const barH = (d.fundCount / maxVal) * innerH;
      const y = padTop + innerH - barH;
      const isCurrent = d.weekMonday === currentKey;
      return `
        <rect class="chart-bar${isCurrent ? " current" : ""}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${Math.max(barH, 0).toFixed(1)}" rx="6">
          <title>${escapeHtml(d.weekLabel)}：${formatNumber(d.fundCount)} 只 / ${formatNumber(d.managerCount)} 家管理人</title>
        </rect>
        <text class="chart-value" x="${(x + barW / 2).toFixed(1)}" y="${(y - 6).toFixed(1)}" text-anchor="middle">${formatNumber(d.fundCount)}</text>
        <text class="chart-label" x="${(x + barW / 2).toFixed(1)}" y="${(height - 32).toFixed(1)}" text-anchor="middle">${escapeHtml(d.weekLabel)}</text>`;
    })
    .join("");

  els.weeklyChart.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="周度备案数量柱状图">
      <line x1="${padX}" y1="${padTop + innerH}" x2="${width - padX}" y2="${padTop + innerH}" stroke="#e5e7eb" stroke-width="1" />
      ${bars}
    </svg>`;
}

function renderTop15() {
  if (!state.top15.length) {
    els.topTable.innerHTML = `<tr><td colspan="4"><div class="empty-state">本周暂无备案产品</div></td></tr>`;
    return;
  }
  const maxCount = Math.max(...state.top15.map((d) => d.fundCount), 1);
  els.topTable.innerHTML = state.top15
    .map((row) => {
      const pct = Math.max(8, (row.fundCount / maxCount) * 100);
      const funds = (row.funds || []).slice(0, 6).map(escapeHtml).join("、");
      const more = (row.funds || []).length > 6 ? ` 等 ${row.funds.length} 只` : "";
      const managerLabel = row.registerNo
        ? `<a class="person-name-link" href="../change-center/manager-detail.html?registerNo=${encodeURIComponent(row.registerNo)}">${escapeHtml(row.managerName)}</a>`
        : escapeHtml(row.managerName);
      return `
      <tr>
        <td class="rank-cell${row.rank <= 3 ? " top" : ""}">${row.rank}</td>
        <td class="name-cell"><strong>${managerLabel}</strong></td>
        <td>
          <div class="count-bar-track" style="max-width:200px">
            <div class="count-bar-fill" style="width:${pct.toFixed(1)}%"></div>
            <span class="count-bar-text">${formatNumber(row.fundCount)} 只</span>
          </div>
        </td>
        <td class="fund-list-cell">${funds}${escapeHtml(more)}</td>
      </tr>`;
    })
    .join("");
}

function populateFilters() {
  const types = [...new Set(state.filings.map((f) => f.managerType).filter(Boolean))].sort();
  const states = [...new Set(state.filings.map((f) => f.workingState).filter(Boolean))].sort();
  els.managerType.innerHTML =
    `<option value="">全部管理类型</option>` + types.map((t) => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join("");
  els.state.innerHTML =
    `<option value="">全部状态</option>` + states.map((s) => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join("");
}

function applyFilters() {
  const q = els.query.value.trim().toLowerCase();
  const mt = els.managerType.value;
  const st = els.state.value;
  let rows = state.filings.filter((f) => {
    if (mt && f.managerType !== mt) return false;
    if (st && f.workingState !== st) return false;
    if (q) {
      const hay = `${f.fundName} ${f.managerName} ${f.fundNo}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const sort = els.sort.value;
  rows.sort((a, b) => {
    if (sort === "dateAsc") return (a.putOnRecordDate || "").localeCompare(b.putOnRecordDate || "");
    if (sort === "nameAsc") return (a.fundName || "").localeCompare(b.fundName || "", "zh-CN");
    if (sort === "managerAsc") return (a.managerName || "").localeCompare(b.managerName || "", "zh-CN");
    return (b.putOnRecordDate || "").localeCompare(a.putOnRecordDate || "");
  });

  state.filtered = rows;
  state.page = 1;
  renderTable();
}

function renderTable() {
  const total = state.filtered.length;
  els.resultCount.textContent = formatNumber(total);
  const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
  if (state.page > totalPages) state.page = totalPages;
  const start = (state.page - 1) * state.pageSize;
  const pageRows = state.filtered.slice(start, start + state.pageSize);

  if (!pageRows.length) {
    els.table.innerHTML = `<tr><td colspan="6"><div class="empty-state">没有匹配的备案产品</div></td></tr>`;
  } else {
    els.table.innerHTML = pageRows
      .map(
        (f) => `
      <tr>
        <td class="name-cell"><strong>${escapeHtml(f.fundName)}</strong>${f.mandatorName ? `<span class="subtle">托管/管理：${escapeHtml(f.mandatorName)}</span>` : ""}</td>
        <td class="manager-cell"><div class="truncate">${escapeHtml(f.managerName)}</div></td>
        <td>${escapeHtml(safe(f.fundNo, "-"))}</td>
        <td><span class="tag neutral">${escapeHtml(safe(f.managerType, "-"))}</span></td>
        <td>${escapeHtml(safe(f.putOnRecordDate, "-"))}</td>
        <td><span class="tag ${f.workingState && f.workingState.includes("正在运作") ? "ok" : "neutral"}">${escapeHtml(safe(f.workingState, "-"))}</span></td>
      </tr>`
      )
      .join("");
  }
  els.pageInfo.textContent = `第 ${state.page} / ${totalPages} 页`;
  els.prev.disabled = state.page <= 1;
  els.next.disabled = state.page >= totalPages;
}

function exportCsv() {
  const header = ["产品名称", "管理人", "产品编码", "管理类型", "备案日期", "成立日期", "运作状态"];
  const lines = [header.join(",")];
  state.filtered.forEach((f) => {
    const cells = [f.fundName, f.managerName, f.fundNo, f.managerType, f.putOnRecordDate, f.establishDate, f.workingState].map(
      (v) => `"${String(v ?? "").replace(/"/g, '""')}"`
    );
    lines.push(cells.join(","));
  });
  const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `证券类私募备案产品_${state.meta.currentWeekMonday || "本周"}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

els.query.addEventListener("input", applyFilters);
els.managerType.addEventListener("change", applyFilters);
els.state.addEventListener("change", applyFilters);
els.sort.addEventListener("change", applyFilters);
els.reset.addEventListener("click", () => {
  els.query.value = "";
  els.managerType.value = "";
  els.state.value = "";
  els.sort.value = "dateDesc";
  applyFilters();
});
els.prev.addEventListener("click", () => {
  if (state.page > 1) {
    state.page -= 1;
    renderTable();
  }
});
els.next.addEventListener("click", () => {
  state.page += 1;
  renderTable();
});
els.export.addEventListener("click", exportCsv);

async function loadAnalysis(){var p=document.getElementById('aiResults');if(!p)return;var r=await AiRender.loadAnalysisResult('./data/filing-analysis.json');if(!r||r._parseError){AiRender.mountCollapsibleAnalysis(p,AiRender.renderEmptyState(),{open:true});return}var h='',m=r.meta;if(m&&m.analyzedAt)h+='<div class="ai-update-time" style="margin-bottom:10px;text-align:right">分析时间：'+AiRender.fmtTime(m.analyzedAt)+' · 模型：'+AiRender.escapeHtml(m.model||'-')+'</div>';var w=r.worthWatching||[],s=r.summary||'';if(s)h+='<div class="ai-result-summary">'+AiRender.escapeHtml(s)+'</div>';h+='<div class="ai-result-col worth" style="max-width:640px"><h3>值得关注的管理人</h3><div class="ai-manager-cards">';if(w.length)w.forEach(function(it,i){h+=AiRender.renderManagerCard(it,i,'worth')});else h+='<div class="ai-state-msg"><p>暂无数据</p></div>';h+='</div></div>';AiRender.mountCollapsibleAnalysis(p,h)}
loadData();loadAnalysis();
