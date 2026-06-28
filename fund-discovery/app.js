const state = {
  funds: [],
  navByFund: {},
  filtered: [],
  selectedIds: new Set(),
  sortKey: "lastOneYearReturn",
  sortDir: "desc",
  meta: null,
  indexSeries: {},
  indexNames: [],
};

const scaleOrder = ["100亿元以上", "50-100亿元", "20-50亿元", "10-20亿元", "5-10亿元", "0-5亿元", "规模待匹配"];
const palette = ["#1f7a6d", "#2563eb", "#b54708", "#7c3aed", "#be123c", "#0f766e", "#475467", "#ca8a04"];
const indexEnhancedStrategies = new Set(["300指增", "500指增", "A500指增", "1000指增", "2000指增"]);
const excessMetricMap = {
  pastWeekReturn: "pastWeekExcessReturn",
  lastOneMonthReturn: "lastOneMonthExcessReturn",
  lastOneMonthMaxDrawdown: "lastOneMonthExcessMaxDrawdown",
  lastOneMonthSharpeRatio: "lastOneMonthExcessSharpeRatio",
  ytdReturn: "ytdExcessReturn",
  ytdMaxDrawdown: "ytdExcessMaxDrawdown",
  ytdSharpeRatio: "ytdExcessSharpeRatio",
  lastOneYearReturn: "lastOneYearExcessReturn",
  lastOneYearMaxDrawdown: "lastOneYearExcessMaxDrawdown",
  lastOneYearSharpeRatio: "lastOneYearExcessSharpeRatio",
};

const tableColumns = [
  { key: "advisor", label: "管理人", type: "text" },
  { key: "fundShortName", label: "产品", type: "text" },
  { key: "inceptionDate", label: "成立日期", type: "text" },
  { key: "strategyOne", label: "一级策略", type: "text" },
  { key: "strategyTwo", label: "二级策略", type: "text" },
  { key: "pastWeekReturn", label: "近一周收益/超额收益", type: "number", format: "percent" },
  { key: "lastOneMonthReturn", label: "近一月收益/超额收益", type: "number", format: "percent" },
  { key: "lastOneMonthMaxDrawdown", label: "近一月最大回撤/超额最大回撤", type: "number", format: "percent" },
  { key: "lastOneMonthSharpeRatio", label: "近一月夏普/超额夏普", type: "number", format: "number2" },
  { key: "ytdReturn", label: "今年以来收益/超额收益", type: "number", format: "percent" },
  { key: "ytdMaxDrawdown", label: "今年以来最大回撤/超额最大回撤", type: "number", format: "percent" },
  { key: "ytdSharpeRatio", label: "今年以来夏普/超额夏普", type: "number", format: "number2" },
  { key: "lastOneYearReturn", label: "近一年收益/超额收益", type: "number", format: "percent" },
  { key: "lastOneYearMaxDrawdown", label: "近一年最大回撤/超额最大回撤", type: "number", format: "percent" },
  { key: "lastOneYearSharpeRatio", label: "近一年夏普/超额夏普", type: "number", format: "number2" },
];

const columns = Object.fromEntries(tableColumns.map((item) => [item.key, item]));

const compareMetrics = [
  { key: "pastWeekReturn", label: "近一周收益/超额收益", type: "return" },
  { key: "lastOneMonthReturn", label: "近一月收益/超额收益", type: "return" },
  { key: "lastOneMonthMaxDrawdown", label: "近一月最大回撤/超额最大回撤", type: "risk" },
  { key: "lastOneMonthSharpeRatio", label: "近一月夏普/超额夏普", type: "ratio" },
  { key: "ytdReturn", label: "今年以来收益/超额收益", type: "return" },
  { key: "ytdMaxDrawdown", label: "今年以来最大回撤/超额最大回撤", type: "risk" },
  { key: "ytdSharpeRatio", label: "今年以来夏普/超额夏普", type: "ratio" },
  { key: "lastOneYearReturn", label: "近一年收益/超额收益", type: "return" },
  { key: "lastOneYearMaxDrawdown", label: "近一年最大回撤/超额最大回撤", type: "risk" },
  { key: "lastOneYearSharpeRatio", label: "近一年夏普/超额夏普", type: "ratio" },
];

const els = {
  dataStatus: document.querySelector("#dataStatus"),
  metrics: document.querySelector("#metrics"),
  query: document.querySelector("#queryInput"),
  strategyOne: document.querySelector("#strategyOneFilter"),
  strategyOneButton: document.querySelector("#strategyOneFilterButton"),
  strategyTwo: document.querySelector("#strategyTwoFilter"),
  strategyTwoButton: document.querySelector("#strategyTwoFilterButton"),
  scale: document.querySelector("#scaleFilter"),
  scaleButton: document.querySelector("#scaleFilterButton"),
  viewMode: document.querySelector("#viewModeFilter"),
  minReturn: document.querySelector("#minReturnInput"),
  reset: document.querySelector("#resetBtn"),
  export: document.querySelector("#exportBtn"),
  resultCount: document.querySelector("#resultCount"),
  summary: document.querySelector("#filterSummary"),
  scaleGroups: document.querySelector("#scaleGroups"),
  drawer: document.querySelector("#drawer"),
  drawerContent: document.querySelector("#drawerContent"),
  closeDrawer: document.querySelector("#closeDrawer"),
  compareBar: document.querySelector("#compareBar"),
  compareCount: document.querySelector("#compareCount"),
  clearCompare: document.querySelector("#clearCompareBtn"),
  openCompare: document.querySelector("#openCompareBtn"),
  openAnalysisBar: document.querySelector("#openAnalysisBarBtn"),
  compareModal: document.querySelector("#compareModal"),
  compareContent: document.querySelector("#compareContent"),
  closeCompare: document.querySelector("#closeCompare"),
  analysisModal: document.querySelector("#analysisModal"),
  analysisContent: document.querySelector("#analysisContent"),
  closeAnalysis: document.querySelector("#closeAnalysis"),
  subTabs: document.querySelector("#subTabs"),
  tabPrompt: document.querySelector("#tabPrompt"),
  browseSection: document.querySelector("#browseSection"),
  tableSection: document.querySelector("#tableSection"),
};

function safe(value, fallback = "-") {
  return value === undefined || value === null || value === "" ? fallback : String(value);
}

function num(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function fmtNumber(value, digits = 4) {
  const parsed = num(value);
  return parsed === null ? "-" : parsed.toFixed(digits).replace(/\.?0+$/, "");
}

function fmtPercent(value, digits = 2) {
  const parsed = num(value);
  return parsed === null ? "-" : `${(parsed * 100).toFixed(digits)}%`;
}

function fmtByColumn(value, column) {
  if (column?.format === "percent") return fmtPercent(value);
  if (column?.format === "number2") return fmtNumber(value, 2);
  return safe(value);
}

function clsByNumber(value) {
  const parsed = num(value);
  if (parsed === null || parsed === 0) return "";
  return parsed > 0 ? "pos" : "neg";
}

function isIndexEnhanced(fund) {
  return indexEnhancedStrategies.has(fund.strategyTwo);
}

function metricKey(fund, key) {
  const mapped = isIndexEnhanced(fund) ? excessMetricMap[key] : "";
  return mapped && num(fund[mapped]) !== null ? mapped : key;
}

function metricValue(fund, key) {
  return fund[metricKey(fund, key)];
}

function metricBasis(fund) {
  return isIndexEnhanced(fund) ? "超额" : "收益";
}

function option(select, value) {
  const el = document.createElement("option");
  el.value = value;
  el.textContent = value;
  select.appendChild(el);
}

function checkboxOption(container, groupName, value, labelText = value) {
  const label = document.createElement("label");
  label.className = "multi-option";
  const input = document.createElement("input");
  input.type = "checkbox";
  input.name = groupName;
  input.value = value;
  const span = document.createElement("span");
  span.textContent = labelText;
  label.append(input, span);
  container.appendChild(label);
}

function selectedValues(container) {
  return [...container.querySelectorAll("input:checked")].map((input) => input.value);
}

function selectedLabels(container) {
  return [...container.querySelectorAll("input:checked")].map((input) => input.nextElementSibling?.textContent || input.value);
}

function clearChecks(container) {
  container.querySelectorAll("input:checked").forEach((input) => {
    input.checked = false;
  });
}

function summarizeValues(values) {
  if (!values.length) return "全部";
  if (values.length <= 2) return values.join("、");
  return `${values.slice(0, 2).join("、")}等 ${values.length} 项`;
}

function updateMultiButton(button, values, emptyLabel) {
  if (!values.length) button.textContent = emptyLabel;
  else if (values.length === 1) button.textContent = values[0];
  else button.textContent = `已选 ${values.length} 项`;
}

function closeMultiMenus(except = null) {
  document.querySelectorAll("[data-multi-select]").forEach((wrapper) => {
    if (wrapper === except) return;
    const menu = wrapper.querySelector(".multi-select-menu");
    const button = wrapper.querySelector(".multi-select-button");
    if (menu) menu.hidden = true;
    if (button) button.setAttribute("aria-expanded", "false");
  });
}

function toggleMultiMenu(button, menu) {
  const wrapper = button.closest("[data-multi-select]");
  const nextHidden = !menu.hidden ? true : false;
  closeMultiMenus(wrapper);
  menu.hidden = nextHidden;
  button.setAttribute("aria-expanded", nextHidden ? "false" : "true");
}

function average(values) {
  const valid = values.map(num).filter((value) => value !== null);
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
}

function median(values) {
  const valid = values.map(num).filter((value) => value !== null).sort((a, b) => a - b);
  if (!valid.length) return null;
  const mid = Math.floor(valid.length / 2);
  return valid.length % 2 ? valid[mid] : (valid[mid - 1] + valid[mid]) / 2;
}

function topFunds(funds, key, size = 3) {
  return funds
    .filter((fund) => num(metricValue(fund, key)) !== null)
    .slice()
    .sort((a, b) => Number(metricValue(b, key)) - Number(metricValue(a, key)))
    .slice(0, size);
}

function bottomFunds(funds, key, size = 5) {
  return funds
    .filter((fund) => num(metricValue(fund, key)) !== null)
    .slice()
    .sort((a, b) => Number(metricValue(a, key)) - Number(metricValue(b, key)))
    .slice(0, size);
}

function setupFilters() {
  const strategyOnes = [...new Set(state.funds.map((item) => item.strategyOne).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "zh-Hans-CN")
  );
  strategyOnes.forEach((item) => checkboxOption(els.strategyOne, "strategyOne", item));
  const strategyTwos = [...new Set(state.funds.map((item) => item.strategyTwo).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "zh-Hans-CN")
  );
  strategyTwos.forEach((item) => checkboxOption(els.strategyTwo, "strategyTwo", item));
  const scales = [...new Set(state.funds.map((item) => item.managerScale || "规模待匹配"))].sort(
    (a, b) => scaleOrder.indexOf(a) - scaleOrder.indexOf(b)
  );
  scales.forEach((item) => checkboxOption(els.scale, "scale", item));
}

async function loadData() {
  const response = await fetch("./data/fund-discovery-data.json", { cache: "no-store" });
  if (!response.ok) throw new Error(`数据加载失败：${response.status}`);
  const payload = await response.json();
  state.funds = (payload.funds || []).map((fund) => ({ ...fund, managerScale: fund.managerScale || "规模待匹配" }));
  state.navByFund = payload.navByFund || {};
  state.meta = payload.meta || {};
  setupFilters();
  applyFilters();
  const generatedAt = state.meta.generatedAt ? new Date(state.meta.generatedAt).toLocaleString("zh-CN") : "-";
  els.dataStatus.textContent = `更新：${generatedAt}`;
  loadIndexSeries();
}

// Load the index daily-close snapshot used by 净值分析 (regression / rolling
// correlation). Non-fatal: if the file is missing, analysis just stays disabled.
async function loadIndexSeries() {
  try {
    const response = await fetch("./data/index-series.json", { cache: "no-store" });
    if (!response.ok) throw new Error(String(response.status));
    const payload = await response.json();
    const indices = payload.indices || {};
    state.indexSeries = {};
    for (const [name, rows] of Object.entries(indices)) {
      state.indexSeries[name] = (rows || [])
        .filter((row) => row && row.date && num(row.close) !== null)
        .map((row) => ({ date: row.date, close: Number(row.close) }))
        .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    }
    state.indexNames = Object.keys(state.indexSeries);
    renderCompareBar();
  } catch (error) {
    state.indexSeries = {};
    state.indexNames = [];
  }
}

function rankRows(funds, key) {
  if (!funds.length) return `<li class="rank-empty">暂无数据</li>`;
  return funds
    .map(
      (fund) =>
        `<li><span class="rank-name">${safe(fund.advisor)}</span><b class="${clsByNumber(metricValue(fund, key))}">${fmtPercent(metricValue(fund, key))}</b></li>`
    )
    .join("");
}

function renderMetrics() {
  const periods = [
    { key: "pastWeekReturn", label: "近一周收益/超额收益" },
    { key: "lastOneMonthReturn", label: "近一月收益/超额收益" },
    { key: "lastOneYearReturn", label: "近一年收益/超额收益" },
  ];
  els.metrics.innerHTML = periods
    .map((period) => {
      const valued = state.filtered.filter((fund) => num(metricValue(fund, period.key)) !== null);
      const values = valued.map((fund) => metricValue(fund, period.key));
      const positive = valued.filter((fund) => metricValue(fund, period.key) > 0).length;
      const med = fmtPercent(median(values));
      const avg = fmtPercent(average(values));
      const top = topFunds(valued, period.key, 5);
      const bottom = bottomFunds(valued, period.key, 5).reverse();
      return `
        <article class="metric-card">
          <div class="metric-head">
            <span class="metric-title">${period.label}</span>
            <strong class="metric-stat">中位数 ${med}</strong>
          </div>
          <div class="metric-sub">平均 ${avg} · 上涨 ${positive}/${valued.length}</div>
          <button class="rank-sort-btn" type="button" data-rank-sort="${period.key}">按此指标看列表</button>
          <div class="rank-grid">
            <div class="rank-block">
              <div class="rank-title">当前筛选全局前五</div>
              <ol class="rank-list">${rankRows(top, period.key)}</ol>
            </div>
            <div class="rank-block">
              <div class="rank-title">当前筛选全局后五</div>
              <ol class="rank-list">${rankRows(bottom, period.key)}</ol>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function applyFilters() {
  const q = els.query.value.trim().toLowerCase();
  const minReturnRaw = els.minReturn.value.trim();
  const minReturn = minReturnRaw === "" ? null : Number(minReturnRaw) / 100;
  const selectedStrategyOnes = selectedValues(els.strategyOne);
  const selectedStrategyTwos = selectedValues(els.strategyTwo);
  const selectedScales = selectedValues(els.scale);
  updateMultiButton(els.strategyOneButton, selectedLabels(els.strategyOne), "全部一级策略");
  updateMultiButton(els.strategyTwoButton, selectedLabels(els.strategyTwo), "全部二级策略");
  updateMultiButton(els.scaleButton, selectedLabels(els.scale), "全部规模");
  state.filtered = state.funds.filter((fund) => {
    const haystack = [
      fund.advisor,
      fund.managerFullName,
      fund.managerScale,
      fund.fundName,
      fund.fundShortName,
      fund.inceptionDate,
      fund.registerNumber,
      fund.fundType,
      fund.strategyOne,
      fund.strategyTwo,
    ]
      .join(" ")
      .toLowerCase();
    if (q && !haystack.includes(q)) return false;
    if (selectedStrategyOnes.length && !selectedStrategyOnes.includes(fund.strategyOne)) return false;
    if (selectedStrategyTwos.length && !selectedStrategyTwos.includes(fund.strategyTwo)) return false;
    if (selectedScales.length && !selectedScales.includes(fund.managerScale)) return false;
    const returnForFilter = metricValue(fund, "lastOneYearReturn");
    if (minReturn !== null && num(returnForFilter) !== null && returnForFilter < minReturn) return false;
    return true;
  });
  sortRows();
  renderMetrics();
  renderGroups();
  renderCompareBar();
}

function sortRows() {
  const config = columns[state.sortKey] || { type: "text" };
  const dir = state.sortDir === "asc" ? 1 : -1;
  state.filtered.sort((a, b) => {
    const av = config.type === "number" ? metricValue(a, state.sortKey) : a[state.sortKey];
    const bv = config.type === "number" ? metricValue(b, state.sortKey) : b[state.sortKey];
    if (config.type === "number") return ((num(av) ?? -Infinity) - (num(bv) ?? -Infinity)) * dir;
    return safe(av, "").localeCompare(safe(bv, ""), "zh-Hans-CN") * dir;
  });
}

function groupedFunds() {
  const groups = new Map();
  for (const fund of state.filtered) {
    const scale = fund.managerScale || "规模待匹配";
    if (!groups.has(scale)) groups.set(scale, []);
    groups.get(scale).push(fund);
  }
  return [...groups.entries()].sort((a, b) => {
    const ai = scaleOrder.includes(a[0]) ? scaleOrder.indexOf(a[0]) : scaleOrder.length;
    const bi = scaleOrder.includes(b[0]) ? scaleOrder.indexOf(b[0]) : scaleOrder.length;
    return ai - bi || a[0].localeCompare(b[0], "zh-Hans-CN");
  });
}

function renderHeader() {
  const sortClass = (key) => {
    if (state.sortKey !== key) return "";
    return state.sortDir === "desc" ? " sorted desc" : " sorted";
  };
  return `
    <thead>
      <tr>
        <th class="check-col"></th>
        ${tableColumns.map((column) => `<th data-sort="${column.key}" class="${sortClass(column.key)}">${column.label}</th>`).join("")}
      </tr>
    </thead>
  `;
}

function renderGroups() {
  els.resultCount.textContent = state.filtered.length.toLocaleString("zh-CN");
  const minReturnLabel = els.minReturn.value.trim() === "" ? "不限" : `> ${els.minReturn.value}%`;
  const strategyOneLabel = summarizeValues(selectedLabels(els.strategyOne));
  const strategyTwoLabel = summarizeValues(selectedLabels(els.strategyTwo));
  const scaleLabel = summarizeValues(selectedLabels(els.scale));
  els.summary.textContent = `筛选：近一年收益/超额收益 ${minReturnLabel}，一级策略 ${strategyOneLabel}，二级策略 ${strategyTwoLabel}，规模 ${scaleLabel}，视图 ${els.viewMode.value === "ranking" ? "全局排名" : "按规模分组"}`;
  if (!state.filtered.length) {
    els.scaleGroups.innerHTML = `<div class="empty-state">没有匹配的产品</div>`;
    return;
  }
  if (els.viewMode.value === "ranking") {
    els.scaleGroups.innerHTML = `
      <section class="scale-section">
        <div class="scale-head">
          <div>
            <h2>全局排名</h2>
            <span>${state.filtered.length} 个管理人，按 ${columns[state.sortKey]?.label || state.sortKey} ${state.sortDir === "desc" ? "降序" : "升序"} 排列</span>
          </div>
        </div>
        ${renderFundTable(state.filtered)}
      </section>
    `;
    return;
  }
  els.scaleGroups.innerHTML = groupedFunds()
    .map(([scale, funds]) => {
      const avgYear = fmtPercent(average(funds.map((fund) => metricValue(fund, "lastOneYearReturn"))));
      return `
        <section class="scale-section">
          <div class="scale-head">
            <div>
              <h2>${scale}</h2>
              <span>${funds.length} 个管理人，近一年收益/超额收益平均 ${avgYear}</span>
            </div>
          </div>
          ${renderFundTable(funds)}
        </section>
      `;
    })
    .join("");
}

function renderFundTable(funds) {
  return `
    <table>
      ${renderHeader()}
      <tbody>
        ${funds
          .map((fund) => {
            const checked = state.selectedIds.has(fund.id) ? "checked" : "";
            return `
              <tr data-id="${fund.id}">
                <td class="check-col"><input type="checkbox" class="compare-check" data-id="${fund.id}" ${checked} aria-label="选择 ${safe(fund.fundShortName)}" /></td>
                <td class="manager-cell"><strong>${safe(fund.advisor)}</strong><div class="subtle">${safe(fund.managerFullName || fund.companyId)}</div></td>
                <td class="fund-cell"><strong>${safe(fund.fundShortName)}</strong><div class="subtle">${safe(fund.registerNumber)} · 净值 ${(state.navByFund[fund.id] || []).length} 条</div></td>
                <td>${safe(fund.inceptionDate)}</td>
                <td>${safe(fund.strategyOne)}</td>
                <td><span class="tag">${safe(fund.strategyTwo)}</span><div class="subtle">${metricBasis(fund)}口径</div></td>
                <td class="num ${clsByNumber(metricValue(fund, "pastWeekReturn"))}">${fmtPercent(metricValue(fund, "pastWeekReturn"))}</td>
                <td class="num ${clsByNumber(metricValue(fund, "lastOneMonthReturn"))}">${fmtPercent(metricValue(fund, "lastOneMonthReturn"))}</td>
                <td class="num neg-risk">${fmtPercent(metricValue(fund, "lastOneMonthMaxDrawdown"))}</td>
                <td class="num">${fmtNumber(metricValue(fund, "lastOneMonthSharpeRatio"), 2)}</td>
                <td class="num ${clsByNumber(metricValue(fund, "ytdReturn"))}">${fmtPercent(metricValue(fund, "ytdReturn"))}</td>
                <td class="num neg-risk">${fmtPercent(metricValue(fund, "ytdMaxDrawdown"))}</td>
                <td class="num">${fmtNumber(metricValue(fund, "ytdSharpeRatio"), 2)}</td>
                <td class="num ${clsByNumber(metricValue(fund, "lastOneYearReturn"))}">${fmtPercent(metricValue(fund, "lastOneYearReturn"))}</td>
                <td class="num neg-risk">${fmtPercent(metricValue(fund, "lastOneYearMaxDrawdown"))}</td>
                <td class="num">${fmtNumber(metricValue(fund, "lastOneYearSharpeRatio"), 2)}</td>
              </tr>
            `;
          })
          .join("")}
      </tbody>
    </table>
  `;
}

function chartSeries(rows) {
  const series = rows
    .filter((row) => num(row.cumulative_nav) !== null)
    .slice()
    .sort((a, b) => safe(a.price_date, "").localeCompare(safe(b.price_date, "")));
  if (series.length < 2) return [];
  const base = Number(series[0].cumulative_nav);
  if (!base) return [];
  return series.map((row) => ({
    date: row.price_date,
    value: Number(row.cumulative_nav) / base - 1,
  }));
}

function parseDate(value) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function fmtDateLabel(timestamp) {
  const date = new Date(timestamp);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function nearestPoint(points, timestamp) {
  if (!points.length) return null;
  let best = points[0];
  let bestDiff = Math.abs(points[0].t - timestamp);
  for (const point of points) {
    const diff = Math.abs(point.t - timestamp);
    if (diff < bestDiff) {
      best = point;
      bestDiff = diff;
    }
  }
  return best;
}

// Renders one or more cumulative-return series on a shared DATE axis so lines
// with different numbers of NAV points still align in time. Adds x-axis date
// labels and a hover crosshair + tooltip that reads out the value on each date.
function renderChart(canvas, datasets, opts = {}) {
  const fmt = opts.fmt || ((value) => `${(value * 100).toFixed(2)}%`);
  const norm = datasets
    .map((dataset) => ({
      color: dataset.color,
      label: dataset.label || "",
      points: (dataset.series || [])
        .map((point) => ({ t: parseDate(point.date), date: point.date, value: num(point.value) }))
        .filter((point) => point.t !== null && point.value !== null)
        .sort((a, b) => a.t - b.t),
    }))
    .filter((dataset) => dataset.points.length);

  const ctx = canvas.getContext("2d");
  const pad = { left: 56, right: 20, top: 18, bottom: 38 };

  const wrap = canvas.parentElement;
  let tip = wrap.querySelector(".chart-tip");
  if (!tip) {
    tip = document.createElement("div");
    tip.className = "chart-tip";
    tip.hidden = true;
    wrap.appendChild(tip);
  }

  function sizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w, h };
  }

  const allPoints = norm.flatMap((dataset) => dataset.points);
  if (!allPoints.length) {
    const { w, h } = sizeCanvas();
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#667085";
    ctx.font = "13px Microsoft YaHei";
    ctx.fillText("暂无足够净值数据", pad.left, pad.top + 18);
    tip.hidden = true;
    canvas.onmousemove = null;
    canvas.onmouseleave = null;
    return;
  }

  const minT = Math.min(...allPoints.map((point) => point.t));
  const maxT = Math.max(...allPoints.map((point) => point.t));
  const tRange = maxT - minT || 1;
  const minY = Math.min(...allPoints.map((point) => point.value), 0);
  const maxY = Math.max(...allPoints.map((point) => point.value), 0.01);
  const yRange = maxY - minY || 1;
  const unionT = [...new Set(allPoints.map((point) => point.t))].sort((a, b) => a - b);

  function xOf(t, w) {
    return pad.left + ((t - minT) / tRange) * (w - pad.left - pad.right);
  }
  function yOf(value, h) {
    return pad.top + (1 - (value - minY) / yRange) * (h - pad.top - pad.bottom);
  }

  function draw(highlightT) {
    const { w, h } = sizeCanvas();
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = "#d9dde5";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top);
    ctx.lineTo(pad.left, h - pad.bottom);
    ctx.lineTo(w - pad.right, h - pad.bottom);
    ctx.stroke();

    ctx.font = "12px Microsoft YaHei";
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
    for (let i = 0; i <= 4; i += 1) {
      const value = minY + (yRange * i) / 4;
      const y = yOf(value, h);
      ctx.fillStyle = "#667085";
      ctx.fillText(fmt(value), 8, y + 4);
      ctx.strokeStyle = "#edf0f4";
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(w - pad.right, y);
      ctx.stroke();
    }

    const ticks = 4;
    ctx.fillStyle = "#667085";
    for (let i = 0; i <= ticks; i += 1) {
      const t = minT + (tRange * i) / ticks;
      const x = xOf(t, w);
      ctx.textAlign = i === 0 ? "left" : i === ticks ? "right" : "center";
      ctx.fillText(fmtDateLabel(t), x, h - pad.bottom + 18);
    }
    ctx.textAlign = "left";

    norm.forEach((dataset) => {
      if (dataset.points.length < 2) {
        const point = dataset.points[0];
        ctx.fillStyle = dataset.color;
        ctx.beginPath();
        ctx.arc(xOf(point.t, w), yOf(point.value, h), 3, 0, Math.PI * 2);
        ctx.fill();
        return;
      }
      ctx.strokeStyle = dataset.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      dataset.points.forEach((point, index) => {
        const x = xOf(point.t, w);
        const y = yOf(point.value, h);
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });

    if (highlightT !== null && highlightT !== undefined) {
      const x = xOf(highlightT, w);
      ctx.strokeStyle = "#98a2b3";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(x, pad.top);
      ctx.lineTo(x, h - pad.bottom);
      ctx.stroke();
      ctx.setLineDash([]);
      norm.forEach((dataset) => {
        const point = nearestPoint(dataset.points, highlightT);
        if (!point) return;
        ctx.fillStyle = dataset.color;
        ctx.beginPath();
        ctx.arc(xOf(point.t, w), yOf(point.value, h), 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    }
  }

  function snap(mouseX, w) {
    const ratio = (mouseX - pad.left) / (w - pad.left - pad.right);
    const t = minT + Math.min(Math.max(ratio, 0), 1) * tRange;
    let best = unionT[0];
    let bestDiff = Math.abs(unionT[0] - t);
    for (const ut of unionT) {
      const diff = Math.abs(ut - t);
      if (diff < bestDiff) {
        best = ut;
        bestDiff = diff;
      }
    }
    return best;
  }

  draw(null);

  canvas.onmousemove = (event) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const w = canvas.clientWidth;
    if (mouseX < pad.left - 6 || mouseX > w - pad.right + 6) {
      tip.hidden = true;
      draw(null);
      return;
    }
    const t = snap(mouseX, w);
    draw(t);
    const rows = norm
      .map((dataset) => {
        const point = nearestPoint(dataset.points, t);
        if (!point) return "";
        const tone = point.value > 0 ? "pos" : point.value < 0 ? "neg" : "";
        return `<div class="chart-tip-row"><i style="background:${dataset.color}"></i><span>${safe(dataset.label, "")}</span><b class="${tone}">${fmt(point.value)}</b></div>`;
      })
      .join("");
    tip.innerHTML = `<div class="chart-tip-date">${fmtDateLabel(t)}</div>${rows}`;
    tip.hidden = false;
    const tipX = xOf(t, w);
    const place = tipX > w / 2 ? tipX - tip.offsetWidth - 16 : tipX + 16;
    tip.style.left = `${canvas.offsetLeft + Math.max(0, place)}px`;
    tip.style.top = `${canvas.offsetTop + pad.top + 4}px`;
  };
  canvas.onmouseleave = () => {
    tip.hidden = true;
    draw(null);
  };
}

function drawDetailChart(canvas, rows, label) {
  renderChart(canvas, [{ color: palette[0], label, series: chartSeries(rows) }]);
}

/* ===================== 净值分析（回归 / 滚动相关 / 深加工） ===================== */

const analysisState = { funds: [] };

// fundIndexName / strategyTwo -> the index name used in state.indexSeries.
const indexAlias = {
  沪深300: "沪深300", "300指增": "沪深300",
  中证500: "中证500", "500指增": "中证500",
  中证1000: "中证1000", "1000指增": "中证1000",
  中证2000: "中证2000", "2000指增": "中证2000", 微盘股: "中证2000",
  中证A500: "中证A500", A500: "中证A500", "A500指增": "中证A500",
  创业板: "创业板指", 创业板指: "创业板指",
  科创板: "科创50", 科创50: "科创50", 科创综指: "科创综指",
};

function defaultIndicesFor(fund) {
  const available = new Set(state.indexNames);
  const picks = [];
  const add = (name) => {
    const mapped = indexAlias[name] || name;
    if (available.has(mapped) && !picks.includes(mapped)) picks.push(mapped);
  };
  add(fund.fundIndexName);
  add(fund.strategyTwo);
  if (!picks.length) {
    ["沪深300", "中证1000"].forEach(add);
  }
  return picks;
}

// ---- linear algebra + stats (no dependencies) ----
function pearson(a, b) {
  const n = Math.min(a.length, b.length);
  if (n < 2) return null;
  let sa = 0, sb = 0;
  for (let i = 0; i < n; i += 1) { sa += a[i]; sb += b[i]; }
  const ma = sa / n, mb = sb / n;
  let cov = 0, va = 0, vb = 0;
  for (let i = 0; i < n; i += 1) {
    const x = a[i] - ma, y = b[i] - mb;
    cov += x * y; va += x * x; vb += y * y;
  }
  if (va <= 0 || vb <= 0) return null;
  return cov / Math.sqrt(va * vb);
}

function invertMatrix(A) {
  const n = A.length;
  const M = A.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
  for (let col = 0; col < n; col += 1) {
    let piv = col;
    for (let r = col + 1; r < n; r += 1) {
      if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
    }
    if (Math.abs(M[piv][col]) < 1e-12) return null;
    [M[col], M[piv]] = [M[piv], M[col]];
    const d = M[col][col];
    for (let j = 0; j < 2 * n; j += 1) M[col][j] /= d;
    for (let r = 0; r < n; r += 1) {
      if (r === col) continue;
      const f = M[r][col];
      if (f === 0) continue;
      for (let j = 0; j < 2 * n; j += 1) M[r][j] -= f * M[col][j];
    }
  }
  return M.map((row) => row.slice(n));
}

function logGamma(x) {
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
  x -= 1;
  let a = c[0];
  const t = x + 7.5;
  for (let i = 1; i < 9; i += 1) a += c[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

function betacf(a, b, x) {
  const FPMIN = 1e-300;
  let c = 1, d = 1 - ((a + b) * x) / (a + 1);
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= 200; m += 1) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((a - 1 + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d; h *= d * c;
    aa = (-(a + m) * (a + b + m) * x) / ((a + m2) * (a + 1 + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c; h *= del;
    if (Math.abs(del - 1) < 3e-12) break;
  }
  return h;
}

function ibeta(x, a, b) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const front = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  if (x < (a + 1) / (a + b + 2)) return (front * betacf(a, b, x)) / a;
  return 1 - (front * betacf(b, a, 1 - x)) / b;
}

// two-sided p-value of Student-t statistic
function studentTwoSidedP(tStat, df) {
  if (!Number.isFinite(tStat) || df <= 0) return NaN;
  return ibeta(df / (df + tStat * tStat), df / 2, 0.5);
}

function pStars(p) {
  if (!(p >= 0)) return "";
  if (p < 0.01) return "***";
  if (p < 0.05) return "**";
  if (p < 0.1) return "*";
  return "";
}

// OLS: y on columns Xcols (each an array), with intercept. Returns null if singular.
function ols(y, Xcols) {
  const n = y.length;
  const k = Xcols.length;
  const p = k + 1;
  if (n <= p) return null;
  const XtX = Array.from({ length: p }, () => new Array(p).fill(0));
  const Xty = new Array(p).fill(0);
  for (let i = 0; i < n; i += 1) {
    const row = new Array(p);
    row[0] = 1;
    for (let j = 0; j < k; j += 1) row[j + 1] = Xcols[j][i];
    for (let a = 0; a < p; a += 1) {
      Xty[a] += row[a] * y[i];
      for (let b = 0; b < p; b += 1) XtX[a][b] += row[a] * row[b];
    }
  }
  const inv = invertMatrix(XtX);
  if (!inv) return null;
  const beta = new Array(p).fill(0);
  for (let a = 0; a < p; a += 1) {
    let s = 0;
    for (let b = 0; b < p; b += 1) s += inv[a][b] * Xty[b];
    beta[a] = s;
  }
  const my = y.reduce((s, v) => s + v, 0) / n;
  let sse = 0, sst = 0;
  for (let i = 0; i < n; i += 1) {
    let pred = beta[0];
    for (let j = 0; j < k; j += 1) pred += beta[j + 1] * Xcols[j][i];
    const e = y[i] - pred;
    sse += e * e;
    const dv = y[i] - my;
    sst += dv * dv;
  }
  const dof = n - p;
  const sigma2 = dof > 0 ? sse / dof : NaN;
  const se = inv.map((rowI, a) => Math.sqrt(Math.max(sigma2 * inv[a][a], 0)));
  const tStat = beta.map((b, i) => (se[i] > 0 ? b / se[i] : NaN));
  const pVal = tStat.map((t) => studentTwoSidedP(Math.abs(t), dof));
  const r2 = sst > 0 ? 1 - sse / sst : NaN;
  const adjR2 = sst > 0 && dof > 0 ? 1 - (1 - r2) * (n - 1) / dof : NaN;
  return { n, p, beta, se, tStat, pVal, r2, adjR2, alpha: beta[0], sigmaResid: Math.sqrt(Math.max(sigma2, 0)) };
}

function dayMs(d) {
  return Date.parse(d);
}

// Build aligned interval-return matrix on the fund's NAV dates: each observation
// requires every selected index to have a close at both endpoints, so the joint
// regression uses only the common overlapping window.
function buildReturnSeries(navRows, indexNames) {
  const fund = navRows
    .filter((row) => num(row.cumulative_nav) !== null && row.price_date)
    .map((row) => ({ date: row.price_date, cum: Number(row.cumulative_nav) }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  // dedupe by date (keep last)
  const dedup = [];
  for (const row of fund) {
    if (dedup.length && dedup[dedup.length - 1].date === row.date) dedup[dedup.length - 1] = row;
    else dedup.push(row);
  }
  const idxList = indexNames.map((name) => ({ name, rows: state.indexSeries[name] || [] }));
  const closeBefore = (rows, date) => {
    let lo = 0, hi = rows.length - 1, ans = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (rows[mid].date <= date) { ans = mid; lo = mid + 1; } else hi = mid - 1;
    }
    return ans >= 0 ? rows[ans].close : null;
  };
  const out = { dates: [], rFund: [], X: {} };
  idxList.forEach((ix) => { out.X[ix.name] = []; });
  for (let i = 1; i < dedup.length; i += 1) {
    const d0 = dedup[i - 1].date, d1 = dedup[i].date;
    const c0 = dedup[i - 1].cum, c1 = dedup[i].cum;
    if (!(c0 > 0)) continue;
    const idxRet = [];
    let ok = true;
    for (const ix of idxList) {
      const p0 = closeBefore(ix.rows, d0);
      const p1 = closeBefore(ix.rows, d1);
      if (p0 === null || p1 === null || !(p0 > 0)) { ok = false; break; }
      idxRet.push(p1 / p0 - 1);
    }
    if (!ok) continue;
    out.dates.push(d1);
    out.rFund.push(c1 / c0 - 1);
    idxList.forEach((ix, j) => out.X[ix.name].push(idxRet[j]));
  }
  // periods per year from average gap
  let ppy = 52;
  if (out.dates.length >= 2) {
    const span = (dayMs(out.dates[out.dates.length - 1]) - dayMs(out.dates[0])) / 86400000;
    const avgGap = span / (out.dates.length - 1);
    if (avgGap > 0) ppy = 365.25 / avgGap;
  }
  out.ppy = ppy;
  return out;
}

function rollingCorrSeries(dates, rFund, rIdx, win) {
  const out = [];
  for (let i = win - 1; i < rFund.length; i += 1) {
    const c = pearson(rFund.slice(i - win + 1, i + 1), rIdx.slice(i - win + 1, i + 1));
    if (c !== null) out.push({ date: dates[i], value: c });
  }
  return out;
}

function rollingBetaSeries(dates, rFund, X, names, win) {
  const series = names.map(() => []);
  for (let i = win - 1; i < rFund.length; i += 1) {
    const y = rFund.slice(i - win + 1, i + 1);
    const cols = names.map((name) => X[name].slice(i - win + 1, i + 1));
    const fit = ols(y, cols);
    if (!fit) continue;
    names.forEach((name, j) => series[j].push({ date: dates[i], value: fit.beta[j + 1] }));
  }
  return series;
}

function captureRatios(rFund, rBench) {
  let upF = 0, upB = 0, upN = 0, dnF = 0, dnB = 0, dnN = 0;
  for (let i = 0; i < rFund.length; i += 1) {
    if (rBench[i] > 0) { upF += rFund[i]; upB += rBench[i]; upN += 1; }
    else if (rBench[i] < 0) { dnF += rFund[i]; dnB += rBench[i]; dnN += 1; }
  }
  const up = upN && upB !== 0 ? (upF / upN) / (upB / upN) : null;
  const down = dnN && dnB !== 0 ? (dnF / dnN) / (dnB / dnN) : null;
  return { up, down, upN, dnN };
}

// max drawdown + recovery (in observation count) on cumulative_nav.
function drawdownRecovery(navRows) {
  const rows = navRows
    .filter((row) => num(row.cumulative_nav) !== null && row.price_date)
    .map((row) => ({ date: row.price_date, v: Number(row.cumulative_nav) }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  if (rows.length < 2) return { maxDD: null, troughDate: null, recoverObs: null, recovered: false };
  let peak = rows[0].v, peakIdx = 0, maxDD = 0, troughIdx = 0, ddPeakIdx = 0;
  for (let i = 0; i < rows.length; i += 1) {
    if (rows[i].v > peak) { peak = rows[i].v; peakIdx = i; }
    const dd = rows[i].v / peak - 1;
    if (dd < maxDD) { maxDD = dd; troughIdx = i; ddPeakIdx = peakIdx; }
  }
  const recoverLevel = rows[ddPeakIdx].v;
  let recoverObs = null, recovered = false;
  for (let i = troughIdx + 1; i < rows.length; i += 1) {
    if (rows[i].v >= recoverLevel) { recoverObs = i - troughIdx; recovered = true; break; }
  }
  return { maxDD, troughDate: rows[troughIdx].date, recoverObs, recovered };
}

function fmtSigned(value, digits = 2) {
  const parsed = num(value);
  if (parsed === null) return "-";
  return `${parsed >= 0 ? "+" : ""}${parsed.toFixed(digits)}`;
}

function analysisSelectedIndices() {
  const wrap = els.analysisContent.querySelector("#analysisIndexPicker");
  if (!wrap) return [];
  return [...wrap.querySelectorAll("input:checked")].map((input) => input.value);
}

const analysisHelpHtml = `
  <details class="analysis-help">
    <summary>怎么看这些分析？（点击展开）</summary>
    <div class="analysis-help-body">
      <p><b>这页在做什么：</b>把产品的净值收益，拆成"跟着哪些指数走（Beta 暴露）"和"指数解释不了的部分（α 超额）"，用来判断收益究竟来自市场风格还是真本事。</p>
      <ul>
        <li><b>β（暴露）</b>：该指数每涨 1%，产品平均跟涨 β%。越接近 1 越像该指数；多个指数里 β 最大的，就是产品最主要的风格锚。</li>
        <li><b>显著性星标</b>：<code>***</code> p&lt;0.01、<code>**</code> p&lt;0.05、<code>*</code> p&lt;0.1。星越多，这个暴露越可信；没有星说明可能是噪声。</li>
        <li><b>α（截距）</b>：剔除所有指数暴露后剩下的超额收益（每期）。<b>正且显著</b>=有真 Alpha；不显著=收益基本被指数解释，靠 Beta。</li>
        <li><b>R² / 调整R²</b>：所选指数能解释产品收益波动的比例。越高越是 Beta 驱动；越低说明越多收益来自指数之外（选股/择时/其它风格）。</li>
        <li><b>滚动相关系数</b>：每个时间窗口内产品与指数的同涨同跌程度（−1~1，图中×100%）。看相关性随时间怎么变。</li>
        <li><b>滚动 β（风格漂移）</b>：β 随时间变化。曲线平稳=风格稳定；β 明显跳变=持仓风格切换了。</li>
        <li><b>上 / 下行捕获</b>：基准上涨 / 下跌时，产品平均捕获了多少。上行高、下行低=进攻强守得住。</li>
        <li><b>信息比率 IR</b>：超额收益的稳定性（年化），越高越好；约 &gt;0.5 算不错。</li>
      </ul>
      <p class="analysis-help-warn">提示：回归只是参考。若某指数恰好与产品真实持仓高度相关，也会显示出高暴露——不能盲信，需结合管理人、策略口径等其它信息综合判断。</p>
    </div>
  </details>
`;

function openAnalysis(funds) {
  if (!state.indexNames.length) return;
  const list = (Array.isArray(funds) ? funds : [funds]).filter(Boolean);
  if (!list.length) return;
  analysisState.funds = list;
  const defaults = new Set();
  list.forEach((f) => defaultIndicesFor(f).forEach((n) => defaults.add(n)));
  if (list.length > 1) defaults.add(indexAlias["沪深300"]); // ensure a shared broad index for multi-fund
  els.analysisContent.innerHTML = `
    <div class="analysis-head">
      <h2>净值分析${list.length > 1 ? `（${list.length} 只产品）` : ` · ${safe(list[0].fundShortName)}`}</h2>
      <p>${list.map((f) => safe(f.fundShortName)).join(" / ")} · 区间收益回归 / 滚动暴露</p>
    </div>
    ${analysisHelpHtml}
    <div id="analysisControls" class="analysis-controls">
      <div class="analysis-control">
        <span>对比指数（多选）</span>
        <div id="analysisIndexPicker" class="analysis-index-picker">
          ${state.indexNames
            .map(
              (name) => `
                <label class="multi-option"><input type="checkbox" value="${name}" ${defaults.has(name) ? "checked" : ""} /><span>${name}</span></label>
              `
            )
            .join("")}
        </div>
      </div>
      <div class="analysis-control">
        <span>滚动窗口（观测点 / 期）</span>
        <select id="analysisWindow">
          <option value="12">12 期</option>
          <option value="26" selected>26 期</option>
          <option value="52">52 期</option>
        </select>
        <small class="analysis-hint">注：私募净值多为周频，窗口按"期/观测点"计</small>
      </div>
      <div class="analysis-control" id="focusIndexControl" hidden>
        <span>滚动图聚焦指数</span>
        <select id="focusIndexSelect"></select>
        <small class="analysis-hint">多产品对比时，滚动图按各产品对该指数的暴露画线</small>
      </div>
    </div>
    <h3 class="analysis-sub">分析解读</h3>
    <div id="analysisReading" class="analysis-reading"></div>
    <h3 class="analysis-sub">多指数回归（区间收益 OLS）· β 暴露</h3>
    <div id="analysisReg" class="reg-table-wrap"></div>
    <h3 class="analysis-sub">净值深加工指标</h3>
    <div id="analysisMetrics" class="reg-table-wrap"></div>
    <div id="analysisLegend" class="legend"></div>
    <h3 class="analysis-sub" id="corrTitle">滚动相关系数（×100%）</h3>
    <div class="chart-wrap analysis-chart-wrap"><canvas id="corrChart"></canvas></div>
    <h3 class="analysis-sub" id="betaTitle">滚动 β 暴露 · 风格漂移（×100%）</h3>
    <div class="chart-wrap analysis-chart-wrap"><canvas id="betaChart"></canvas></div>
  `;
  els.analysisModal.classList.add("open");
  els.analysisModal.setAttribute("aria-hidden", "false");
  els.analysisModal.scrollTop = 0;
  els.analysisContent.querySelector("#analysisControls").addEventListener("change", updateAnalysis);
  updateAnalysis();
}

// build {fund, navRows, aligned, fit} for each fund against the selected indices
function analysisBundles(names) {
  return analysisState.funds.map((fund) => {
    const navRows = state.navByFund[fund.id] || [];
    const aligned = buildReturnSeries(navRows, names);
    const fit = aligned.rFund.length >= 5 ? ols(aligned.rFund, names.map((n) => aligned.X[n])) : null;
    return { fund, navRows, aligned, fit };
  });
}

function regComparisonTable(names, bundles) {
  const colHead = bundles
    .map((b) => `<th class="num">${safe(b.fund.fundShortName)}<div class="subtle">${safe(b.fund.advisor)}</div></th>`)
    .join("");
  const cell = (b, j) =>
    b.fit
      ? `<td class="num">${b.fit.beta[j + 1].toFixed(3)}<sup class="star">${pStars(b.fit.pVal[j + 1])}</sup></td>`
      : `<td class="num">-</td>`;
  const indexRows = names
    .map((name, j) => `<tr><td>β · ${name}</td>${bundles.map((b) => cell(b, j)).join("")}</tr>`)
    .join("");
  const alphaRow = `<tr class="reg-alpha"><td>α（截距 / 期）</td>${bundles
    .map((b) => (b.fit ? `<td class="num ${clsByNumber(b.fit.alpha)}">${(b.fit.alpha * 100).toFixed(3)}%<sup class="star">${pStars(b.fit.pVal[0])}</sup></td>` : `<td class="num">-</td>`))
    .join("")}</tr>`;
  const r2Row = `<tr><td>R²</td>${bundles.map((b) => `<td class="num">${b.fit ? b.fit.r2.toFixed(3) : "-"}</td>`).join("")}</tr>`;
  const adjRow = `<tr><td>调整 R²</td>${bundles.map((b) => `<td class="num">${b.fit ? b.fit.adjR2.toFixed(3) : "-"}</td>`).join("")}</tr>`;
  const nRow = `<tr><td>样本 n</td>${bundles.map((b) => `<td class="num">${b.fit ? b.fit.n : (b.aligned.rFund.length || 0)}</td>`).join("")}</tr>`;
  return `
    <table class="reg-table">
      <thead><tr><th>指标</th>${colHead}</tr></thead>
      <tbody>${indexRows}${alphaRow}${r2Row}${adjRow}${nRow}</tbody>
    </table>
    <div class="reg-foot">β=指数暴露，α=每期超额；显著性 * p&lt;0.1 ** p&lt;0.05 *** p&lt;0.01。各产品按自身可用历史与指数重叠区间回归，样本 n 可能不同。</div>
  `;
}

function metricsComparisonTable(names, bundles) {
  const primary = names[0];
  const stat = bundles.map((b) => {
    if (!b.fit) return null;
    const annAlpha = b.fit.alpha * b.aligned.ppy;
    const ir = b.fit.sigmaResid > 0 ? (b.fit.alpha / b.fit.sigmaResid) * Math.sqrt(b.aligned.ppy) : null;
    const cap = captureRatios(b.aligned.rFund, b.aligned.X[primary]);
    const dd = drawdownRecovery(b.navRows);
    return { annAlpha, ir, r2: b.fit.r2, cap, dd };
  });
  const row = (label, render) =>
    `<tr><td>${label}</td>${bundles.map((b, i) => render(stat[i])).join("")}</tr>`;
  const dash = `<td class="num">-</td>`;
  return `
    <table class="reg-table">
      <thead><tr><th>指标</th>${bundles.map((b) => `<th class="num">${safe(b.fund.fundShortName)}</th>`).join("")}</tr></thead>
      <tbody>
        ${row("年化 α", (s) => (s ? `<td class="num ${clsByNumber(s.annAlpha)}">${(s.annAlpha * 100).toFixed(2)}%</td>` : dash))}
        ${row("信息比率 IR", (s) => (s && s.ir !== null ? `<td class="num ${clsByNumber(s.ir)}">${s.ir.toFixed(2)}</td>` : dash))}
        ${row("拟合优度 R²", (s) => (s ? `<td class="num">${s.r2.toFixed(3)}</td>` : dash))}
        ${row(`上行捕获 · ${primary}`, (s) => (s && s.cap.up !== null ? `<td class="num">${(s.cap.up * 100).toFixed(0)}%</td>` : dash))}
        ${row(`下行捕获 · ${primary}`, (s) => (s && s.cap.down !== null ? `<td class="num">${(s.cap.down * 100).toFixed(0)}%</td>` : dash))}
        ${row("最大回撤", (s) => (s && s.dd.maxDD !== null ? `<td class="num neg">${(s.dd.maxDD * 100).toFixed(2)}%</td>` : dash))}
        ${row("回撤修复", (s) => (s && s.dd.maxDD !== null ? `<td class="num">${s.dd.recovered ? s.dd.recoverObs + " 期" : "未修复"}</td>` : dash))}
      </tbody>
    </table>
  `;
}

function readingFor(name, b) {
  if (!b.fit) return `<li><b>${safe(name)}</b>：样本不足（${b.aligned.rFund.length} 个重叠观测点），无法稳定回归。</li>`;
  const exposures = b.aligned ? Object.keys(b.aligned.X).map((nm, j) => ({ nm, beta: b.fit.beta[j + 1], p: b.fit.pVal[j + 1] })) : [];
  const dom = exposures.reduce((a, c) => (Math.abs(c.beta) > Math.abs(a.beta) ? c : a), exposures[0]);
  const annAlpha = b.fit.alpha * b.aligned.ppy;
  const aSig = Number.isFinite(b.fit.pVal[0]) && b.fit.pVal[0] < 0.1;
  let alphaText;
  if (aSig && b.fit.alpha > 0) alphaText = `α 显著为正（年化约 ${(annAlpha * 100).toFixed(1)}%），剔除指数暴露后仍有超额，体现一定 Alpha 能力`;
  else if (aSig && b.fit.alpha < 0) alphaText = `α 显著为负（年化约 ${(annAlpha * 100).toFixed(1)}%），扣除指数暴露后跑输`;
  else alphaText = `α 不显著，收益基本被所选指数解释，超额主要来自 Beta 暴露`;
  return `<li><b>${safe(name)}</b>：最主要暴露是 <b>${dom.nm}</b>（β=${dom.beta.toFixed(2)}${pStars(dom.p)}）；${alphaText}；R²=${b.fit.r2.toFixed(2)}，所选指数解释了周度收益波动的约 ${(b.fit.r2 * 100).toFixed(0)}%。</li>`;
}

function buildReading(names, bundles) {
  const items = bundles.map((b) => readingFor(b.fund.fundShortName, b)).join("");
  let compare = "";
  const fitted = bundles.filter((b) => b.fit);
  if (fitted.length >= 2) {
    const doms = fitted.map((b) => {
      const exps = Object.keys(b.aligned.X).map((nm, j) => ({ nm, beta: b.fit.beta[j + 1] }));
      const d = exps.reduce((a, c) => (Math.abs(c.beta) > Math.abs(a.beta) ? c : a), exps[0]);
      return `${safe(b.fund.fundShortName)} 偏 ${d.nm}`;
    });
    const r2s = fitted.map((b) => b.fit.r2);
    const bestAlpha = fitted.reduce((a, c) => (c.fit.alpha > a.fit.alpha ? c : a), fitted[0]);
    compare = `<p class="analysis-reading-compare">对比来看：${doms.join("、")}；其中 <b>${safe(bestAlpha.fund.fundShortName)}</b> 的 α 最高。R² 越低的产品，收益越不依赖这些宽基指数（更多来自选股/择时或其它风格）。</p>`;
  }
  return `<ul class="analysis-reading-list">${items}</ul>${compare}`;
}

function updateAnalysis() {
  const funds = analysisState.funds;
  if (!funds.length) return;
  const names = analysisSelectedIndices();
  const win = Number(els.analysisContent.querySelector("#analysisWindow").value) || 26;
  const readingEl = els.analysisContent.querySelector("#analysisReading");
  const regEl = els.analysisContent.querySelector("#analysisReg");
  const metricsEl = els.analysisContent.querySelector("#analysisMetrics");
  const legendEl = els.analysisContent.querySelector("#analysisLegend");
  const corrCanvas = els.analysisContent.querySelector("#corrChart");
  const betaCanvas = els.analysisContent.querySelector("#betaChart");
  const corrTitle = els.analysisContent.querySelector("#corrTitle");
  const betaTitle = els.analysisContent.querySelector("#betaTitle");
  const focusControl = els.analysisContent.querySelector("#focusIndexControl");
  const focusSelect = els.analysisContent.querySelector("#focusIndexSelect");
  const numFmt2 = (value) => value.toFixed(2);
  const multi = funds.length > 1;

  if (!names.length) {
    readingEl.innerHTML = "";
    regEl.innerHTML = `<div class="empty-state">请至少选择一个对比指数</div>`;
    metricsEl.innerHTML = "";
    legendEl.innerHTML = "";
    focusControl.hidden = true;
    renderChart(corrCanvas, []);
    renderChart(betaCanvas, []);
    return;
  }

  // focus index control (multi-fund rolling charts pick one index)
  let focus = names[0];
  if (multi) {
    focusControl.hidden = false;
    const prev = focusSelect.value;
    focusSelect.innerHTML = names.map((n) => `<option value="${n}">${n}</option>`).join("");
    focus = names.includes(prev) ? prev : names[0];
    focusSelect.value = focus;
  } else {
    focusControl.hidden = true;
  }

  const bundles = analysisBundles(names);

  readingEl.innerHTML = buildReading(names, bundles);
  regEl.innerHTML = regComparisonTable(names, bundles);
  metricsEl.innerHTML = metricsComparisonTable(names, bundles);

  // ---- rolling charts ----
  let corrDatasets;
  let betaDatasets;
  let legendItems;
  if (multi) {
    corrTitle.textContent = `滚动相关系数 · 各产品对【${focus}】（×100%）`;
    betaTitle.textContent = `滚动 β · 各产品对【${focus}】（×100%）`;
    corrDatasets = bundles
      .map((b, i) => {
        const pair = buildReturnSeries(b.navRows, [focus]);
        return { color: palette[i % palette.length], label: b.fund.fundShortName, series: rollingCorrSeries(pair.dates, pair.rFund, pair.X[focus], win) };
      })
      .filter((ds) => ds.series.length);
    betaDatasets = bundles
      .map((b, i) => {
        const pair = buildReturnSeries(b.navRows, [focus]);
        const bs = rollingBetaSeries(pair.dates, pair.rFund, pair.X, [focus], win);
        return { color: palette[i % palette.length], label: b.fund.fundShortName, series: bs[0] || [] };
      })
      .filter((ds) => ds.series.length);
    legendItems = bundles.map((b, i) => ({ color: palette[i % palette.length], label: `${safe(b.fund.fundShortName)} · ${safe(b.fund.advisor)}` }));
  } else {
    corrTitle.textContent = `滚动相关系数 · 对各指数（×100%）`;
    betaTitle.textContent = `滚动 β 暴露 · 风格漂移（×100%）`;
    const b = bundles[0];
    corrDatasets = names
      .map((name, i) => {
        const pair = buildReturnSeries(b.navRows, [name]);
        return { color: palette[i % palette.length], label: name, series: rollingCorrSeries(pair.dates, pair.rFund, pair.X[name], win) };
      })
      .filter((ds) => ds.series.length);
    const betaSeries = b.fit ? rollingBetaSeries(b.aligned.dates, b.aligned.rFund, b.aligned.X, names, win) : names.map(() => []);
    betaDatasets = names
      .map((name, i) => ({ color: palette[i % palette.length], label: name, series: betaSeries[i] || [] }))
      .filter((ds) => ds.series.length);
    legendItems = names.map((name, i) => ({ color: palette[i % palette.length], label: name }));
  }
  legendEl.innerHTML = legendItems
    .map((it) => `<span><i style="background:${it.color}"></i>${it.label}</span>`)
    .join("");
  renderChart(corrCanvas, corrDatasets, { fmt: numFmt2 });
  renderChart(betaCanvas, betaDatasets, { fmt: numFmt2 });
}

function openDetail(fund) {
  const rows = (state.navByFund[fund.id] || []).slice().sort((a, b) => safe(b.price_date, "").localeCompare(safe(a.price_date, "")));
  els.drawerContent.innerHTML = `
    <div class="detail-head">
      <h2>${safe(fund.fundShortName)}</h2>
      <p>${safe(fund.advisor)} · ${safe(fund.managerScale)} · ${safe(fund.strategyOne)} / ${safe(fund.strategyTwo)} · <a href="https://mp.fof99.com/fund/view/${fund.id}" target="_blank" rel="noreferrer">火富牛详情</a></p>
    </div>
    <div class="detail-grid">
      <div class="detail-item"><span>指标口径</span><strong>${metricBasis(fund)}</strong></div>
      <div class="detail-item"><span>成立日期</span><strong>${safe(fund.inceptionDate)}</strong></div>
      <div class="detail-item"><span>平台净值条数</span><strong>${rows.length}</strong></div>
    </div>
    <div class="detail-perf-wrap">
      <table class="detail-perf-table">
        <thead>
          <tr>
            <th>区间</th>
            <th class="num">收益/超额收益</th>
            <th class="num">最大回撤/超额回撤</th>
            <th class="num">夏普/超额夏普</th>
          </tr>
        </thead>
        <tbody>
          ${[
            { label: "近一周", ret: "pastWeekReturn", dd: null, sharpe: null },
            { label: "近一月", ret: "lastOneMonthReturn", dd: "lastOneMonthMaxDrawdown", sharpe: "lastOneMonthSharpeRatio" },
            { label: "今年以来", ret: "ytdReturn", dd: "ytdMaxDrawdown", sharpe: "ytdSharpeRatio" },
            { label: "近一年", ret: "lastOneYearReturn", dd: "lastOneYearMaxDrawdown", sharpe: "lastOneYearSharpeRatio" },
          ]
            .map(
              (row) => `
                <tr>
                  <td>${row.label}</td>
                  <td class="num ${clsByNumber(metricValue(fund, row.ret))}">${fmtPercent(metricValue(fund, row.ret))}</td>
                  <td class="num neg-risk">${row.dd ? fmtPercent(metricValue(fund, row.dd)) : "-"}</td>
                  <td class="num">${row.sharpe ? fmtNumber(metricValue(fund, row.sharpe), 2) : "-"}</td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </div>
    <div class="chart-wrap">
      <canvas id="navChart"></canvas>
    </div>
    <div class="nav-table">
      <table>
        <thead>
          <tr>
            <th>日期</th>
            <th>单位净值</th>
            <th>累计净值</th>
            <th>复权净值</th>
            <th>涨跌幅</th>
          </tr>
        </thead>
        <tbody>
          ${
            rows.length
              ? rows
                  .map(
                    (row) => `
                      <tr>
                        <td>${safe(row.price_date)}</td>
                        <td class="num">${fmtNumber(row.nav, 4)}</td>
                        <td class="num">${fmtNumber(row.cumulative_nav_withdrawal, 4)}</td>
                        <td class="num">${fmtNumber(row.cumulative_nav, 4)}</td>
                        <td class="num ${clsByNumber(row.price_change)}">${fmtPercent(row.price_change)}</td>
                      </tr>
                    `
                  )
                  .join("")
              : `<tr><td colspan="5"><div class="empty-state">暂无平台净值数据，请重新运行抓取脚本补齐</div></td></tr>`
          }
        </tbody>
      </table>
    </div>
  `;
  els.drawer.classList.add("open");
  els.drawer.setAttribute("aria-hidden", "false");
  drawDetailChart(document.querySelector("#navChart"), rows, fund.fundShortName);
}

function selectedFunds() {
  const byId = new Map(state.funds.map((fund) => [fund.id, fund]));
  return [...state.selectedIds].map((id) => byId.get(id)).filter(Boolean);
}

function renderCompareBar() {
  const count = state.selectedIds.size;
  els.compareCount.textContent = `已选 ${count} 只产品`;
  els.compareBar.classList.toggle("open", count > 0);
  els.compareBar.setAttribute("aria-hidden", count > 0 ? "false" : "true");
  els.openCompare.disabled = count < 2;
  els.openAnalysisBar.disabled = count < 1 || !state.indexNames.length;
  els.openAnalysisBar.title = state.indexNames.length ? "" : "指数数据未生成，无法分析";
  updateTabPrompt();
}

let activeTab = "browse";
function switchTab(tab) {
  activeTab = tab;
  els.subTabs.querySelectorAll(".sub-tab").forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === tab));
  const isBrowse = tab === "browse";
  els.browseSection.hidden = !isBrowse;
  els.metrics.hidden = !isBrowse;
  updateTabPrompt();
}

function updateTabPrompt() {
  const count = state.selectedIds.size;
  if (activeTab === "browse") {
    els.tabPrompt.hidden = true;
    return;
  }
  if (activeTab === "compare") {
    if (count >= 2) {
      els.tabPrompt.innerHTML = `<span>已选 <strong class="prompt-count">${count}</strong> 只产品，可进行横向对比</span><button id="tabCompareBtn">开始对比</button><button class="ghost-btn" id="tabClearBtn">清空选择</button>`;
      els.tabPrompt.hidden = false;
      els.tabPrompt.querySelector("#tabCompareBtn").addEventListener("click", renderCompareModal);
      els.tabPrompt.querySelector("#tabClearBtn").addEventListener("click", () => {
        state.selectedIds.clear();
        renderGroups();
        renderCompareBar();
      });
    } else {
      els.tabPrompt.innerHTML = `<span>请先在表格中勾选 <strong>至少 2 只</strong> 产品（当前已选 <span class="prompt-count">${count}</span> 只）</span>`;
      els.tabPrompt.hidden = false;
    }
    return;
  }
  if (activeTab === "analysis") {
    if (count >= 1 && state.indexNames.length) {
      els.tabPrompt.innerHTML = `<span>已选 <strong class="prompt-count">${count}</strong> 只产品，可进行多指数回归分析</span><button id="tabAnalysisBtn">开始分析</button><button class="ghost-btn" id="tabClearBtn2">清空选择</button>`;
      els.tabPrompt.hidden = false;
      els.tabPrompt.querySelector("#tabAnalysisBtn").addEventListener("click", () => openAnalysis(selectedFunds()));
      els.tabPrompt.querySelector("#tabClearBtn2").addEventListener("click", () => {
        state.selectedIds.clear();
        renderGroups();
        renderCompareBar();
      });
    } else if (!state.indexNames.length) {
      els.tabPrompt.innerHTML = `<span>指数数据尚未加载完成，请稍候再试</span>`;
      els.tabPrompt.hidden = false;
    } else {
      els.tabPrompt.innerHTML = `<span>请先在表格中勾选 <strong>至少 1 只</strong> 产品（当前已选 <span class="prompt-count">${count}</span> 只）</span>`;
      els.tabPrompt.hidden = false;
    }
    return;
  }
}

function bestMetricClass(funds, metric, fund) {
  const values = funds.map((item) => num(metricValue(item, metric.key))).filter((value) => value !== null);
  const current = num(metricValue(fund, metric.key));
  if (current === null || !values.length) return "";
  const target = metric.type === "risk" ? Math.min(...values) : Math.max(...values);
  return current === target ? "best-cell" : "";
}

function renderCompareModal() {
  const funds = selectedFunds();
  const datasets = funds.map((fund, index) => ({
    fund,
    color: palette[index % palette.length],
    label: fund.fundShortName,
    series: chartSeries(state.navByFund[fund.id] || []),
  }));
  els.compareContent.innerHTML = `
    <div class="compare-head">
      <h2>基金对比</h2>
      <p>${funds.map((fund) => fund.fundShortName).join(" / ")}</p>
    </div>
    <div class="legend">
      ${datasets
        .map(
          (dataset) => `
            <span><i style="background:${dataset.color}"></i>${safe(dataset.fund.fundShortName)} · ${safe(dataset.fund.advisor)}</span>
          `
        )
        .join("")}
    </div>
    <div class="chart-wrap compare-chart-wrap">
      <canvas id="compareChart"></canvas>
    </div>
    <div class="compare-table-wrap">
      <table class="compare-table">
        <thead>
          <tr>
            <th>指标</th>
            ${funds.map((fund) => `<th>${safe(fund.fundShortName)}<div class="subtle">${safe(fund.advisor)}</div></th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${compareMetrics
            .map(
              (metric) => `
                <tr>
                  <td>${metric.label}</td>
                  ${funds
                    .map((fund) => {
                      const metricRaw = metricValue(fund, metric.key);
                      const value = metric.type === "ratio" ? fmtNumber(metricRaw, 2) : fmtPercent(metricRaw);
                      const tone = metric.type === "ratio" ? "" : clsByNumber(metric.type === "risk" ? -metricRaw : metricRaw);
                      return `<td class="num ${tone} ${bestMetricClass(funds, metric, fund)}">${value}</td>`;
                    })
                    .join("")}
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
  els.compareModal.classList.add("open");
  els.compareModal.setAttribute("aria-hidden", "false");
  renderChart(document.querySelector("#compareChart"), datasets);
}

function exportCsv() {
  const header = ["管理人", "产品", "备案编号", "管理人规模", "指标口径", ...tableColumns.slice(2).map((column) => column.label)];
  const lines = [header.join(",")];
  state.filtered.forEach((fund) => {
    lines.push(
      [
        fund.advisor,
        fund.fundShortName,
        fund.registerNumber,
        fund.managerScale,
        metricBasis(fund),
        fund.inceptionDate,
        fund.strategyOne,
        fund.strategyTwo,
        fmtPercent(metricValue(fund, "pastWeekReturn")),
        fmtPercent(metricValue(fund, "lastOneMonthReturn")),
        fmtPercent(metricValue(fund, "lastOneMonthMaxDrawdown")),
        fmtNumber(metricValue(fund, "lastOneMonthSharpeRatio"), 2),
        fmtPercent(metricValue(fund, "ytdReturn")),
        fmtPercent(metricValue(fund, "ytdMaxDrawdown")),
        fmtNumber(metricValue(fund, "ytdSharpeRatio"), 2),
        fmtPercent(metricValue(fund, "lastOneYearReturn")),
        fmtPercent(metricValue(fund, "lastOneYearMaxDrawdown")),
        fmtNumber(metricValue(fund, "lastOneYearSharpeRatio"), 2),
      ]
        .map((value) => `"${safe(value, "").replaceAll('"', '""')}"`)
        .join(",")
    );
  });
  const blob = new Blob([`\ufeff${lines.join("\n")}`], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "fund-discovery.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

els.query.addEventListener("input", applyFilters);
els.strategyOneButton.addEventListener("click", () => toggleMultiMenu(els.strategyOneButton, els.strategyOne));
els.strategyTwoButton.addEventListener("click", () => toggleMultiMenu(els.strategyTwoButton, els.strategyTwo));
els.scaleButton.addEventListener("click", () => toggleMultiMenu(els.scaleButton, els.scale));
els.strategyOne.addEventListener("change", applyFilters);
els.strategyTwo.addEventListener("change", applyFilters);
els.scale.addEventListener("change", applyFilters);
els.viewMode.addEventListener("change", applyFilters);
els.minReturn.addEventListener("input", applyFilters);
els.metrics.addEventListener("click", (event) => {
  const button = event.target.closest("[data-rank-sort]");
  if (!button) return;
  state.sortKey = button.dataset.rankSort;
  state.sortDir = "desc";
  els.viewMode.value = "ranking";
  sortRows();
  renderGroups();
});
els.reset.addEventListener("click", () => {
  els.query.value = "";
  clearChecks(els.strategyOne);
  clearChecks(els.strategyTwo);
  clearChecks(els.scale);
  els.viewMode.value = "scale";
  els.minReturn.value = "";
  applyFilters();
});
els.export.addEventListener("click", exportCsv);
document.addEventListener("click", (event) => {
  if (!event.target.closest("[data-multi-select]")) closeMultiMenus();
});

els.scaleGroups.addEventListener("click", (event) => {
  const header = event.target.closest("th[data-sort]");
  if (header) {
    const key = header.dataset.sort;
    if (state.sortKey === key) state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
    else {
      state.sortKey = key;
      state.sortDir = columns[key]?.type === "number" ? "desc" : "asc";
    }
    sortRows();
    renderGroups();
    return;
  }
  const checkbox = event.target.closest(".compare-check");
  if (checkbox) {
    const id = checkbox.dataset.id;
    if (checkbox.checked) state.selectedIds.add(id);
    else state.selectedIds.delete(id);
    renderCompareBar();
    return;
  }
  const row = event.target.closest("tr[data-id]");
  if (!row) return;
  const fund = state.funds.find((item) => item.id === row.dataset.id);
  if (fund) openDetail(fund);
});

els.clearCompare.addEventListener("click", () => {
  state.selectedIds.clear();
  renderGroups();
  renderCompareBar();
});
els.openCompare.addEventListener("click", renderCompareModal);
els.openAnalysisBar.addEventListener("click", () => openAnalysis(selectedFunds()));
els.subTabs.addEventListener("click", (event) => {
  const btn = event.target.closest(".sub-tab");
  if (!btn) return;
  switchTab(btn.dataset.tab);
});
els.closeCompare.addEventListener("click", () => {
  els.compareModal.classList.remove("open");
  els.compareModal.setAttribute("aria-hidden", "true");
});
els.compareModal.addEventListener("click", (event) => {
  if (event.target === els.compareModal) els.closeCompare.click();
});
els.closeAnalysis.addEventListener("click", () => {
  els.analysisModal.classList.remove("open");
  els.analysisModal.setAttribute("aria-hidden", "true");
});
els.analysisModal.addEventListener("click", (event) => {
  if (event.target === els.analysisModal) els.closeAnalysis.click();
});
els.closeDrawer.addEventListener("click", () => {
  els.drawer.classList.remove("open");
  els.drawer.setAttribute("aria-hidden", "true");
});
els.drawer.addEventListener("click", (event) => {
  if (event.target === els.drawer) els.closeDrawer.click();
});

loadData().catch((error)=>{els.dataStatus.textContent=error.message;els.scaleGroups.innerHTML='<div class="empty-state">'+AiRender.escapeHtml(error.message)+'</div>'});
function renderFDAnalysis(r){var h='',m=r.meta;if(m&&m.analyzedAt)h+='<div class="ai-update-time" style="margin-bottom:10px;text-align:right">分析时间：'+AiRender.fmtTime(m.analyzedAt)+' · 模型：'+AiRender.escapeHtml(m.model||'-')+'</div>';var bs=r.byStrategy||{},ov=r.overall||{};var ks=Object.keys(bs);if(ks.length){h+='<h3 style="margin:16px 0 10px;font-size:15px;font-weight:800">按二级策略分组分析</h3><div class="ai-strategy-groups">';ks.forEach(function(n){var g=bs[n];h+='<div class="ai-strategy-group"><div class="ai-strategy-group-head"><h4>'+AiRender.escapeHtml(n)+'</h4>';if(g.strategySummary)h+='<p>'+AiRender.escapeHtml(g.strategySummary)+'</p>';h+='</div><div class="ai-strategy-group-body">'+AiRender.renderDualColumn(g)+'</div></div>'});h+='</div>'}if(ov.worthWatching||ov.atRisk||ov.summary){h+='<h3 style="margin:16px 0 10px;font-size:15px;font-weight:800">综合总览</h3>'+AiRender.renderDualColumn(ov)}if(!ks.length&&!ov.worthWatching&&!ov.atRisk)h+=AiRender.renderEmptyState();return h}
async function loadAnalysis(){var p=document.getElementById('aiResults');if(!p)return;var r=await AiRender.loadAnalysisResult('./data/fund-discovery-analysis.json');if(!r||r._parseError){AiRender.mountCollapsibleAnalysis(p,AiRender.renderEmptyState(),{open:true});return}AiRender.mountCollapsibleAnalysis(p,renderFDAnalysis(r))}
loadAnalysis();
