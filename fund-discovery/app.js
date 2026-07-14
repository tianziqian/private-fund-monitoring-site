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
  cta: null,
  quality: null,
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

const qualityRules = [
  { key: "lastOneMonthReturn", label: "近1月收益 > 同策略中位数" },
  { key: "lastOneMonthMaxDrawdown", label: "近1月回撤优于同策略中位数" },
  { key: "lastOneMonthSharpeRatio", label: "近1月夏普 > 同策略中位数" },
  { key: "ytdReturn", label: "今年以来收益 > 同策略中位数" },
  { key: "lastOneYearReturn", label: "近1年收益 > 同策略中位数" },
];

const strategyOverviewColumns = [
  { key: "pastWeekReturn", label: "近1周收益", format: "percent" },
  { key: "lastOneMonthReturn", label: "近1月收益", format: "percent" },
  { key: "lastOneMonthMaxDrawdown", label: "近1月回撤", format: "percent" },
  { key: "lastOneMonthSharpeRatio", label: "近1月夏普", format: "number" },
  { key: "ytdReturn", label: "今年以来收益", format: "percent" },
  { key: "ytdMaxDrawdown", label: "今年以来回撤", format: "percent" },
  { key: "ytdSharpeRatio", label: "今年以来夏普", format: "number" },
  { key: "lastOneYearReturn", label: "近1年收益", format: "percent" },
  { key: "lastOneYearMaxDrawdown", label: "近1年回撤", format: "percent" },
  { key: "lastOneYearSharpeRatio", label: "近1年夏普", format: "number" },
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
  qualityPreset: document.querySelector("#qualityPresetBtn"),
  qualityRules: [...document.querySelectorAll("[data-quality-rule]")],
  qualityCap: document.querySelector("#qualityCapFilter"),
  qualityHint: document.querySelector("#qualityHint"),
  strategyOverview: document.querySelector("#strategyOverview"),
  strategyOverviewMeta: document.querySelector("#strategyOverviewMeta"),
  strategyOverviewToggle: document.querySelector("#strategyOverviewToggle"),
  strategyOverviewDetails: document.querySelector("#strategyOverviewDetails"),
  strategyOverviewTable: document.querySelector("#strategyOverviewTable"),
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

function selectedQualityRuleKeys() {
  return els.qualityRules.filter((input) => input.checked).map((input) => input.dataset.qualityRule);
}

function buildQualityProfiles() {
  const groups = new Map();
  state.funds.forEach((fund) => {
    const key = fund.strategyTwo || fund.strategyOne || "未分类策略";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(fund);
  });
  const profiles = new Map();
  groups.forEach((funds, key) => {
    const medians = {};
    qualityRules.forEach((rule) => {
      medians[rule.key] = median(funds.map((fund) => metricValue(fund, rule.key)));
    });
    profiles.set(key, { key, funds, medians });
  });
  return profiles;
}

function qualityScore(fund, profile, ruleKeys) {
  const scores = ruleKeys
    .map((key) => {
      const value = num(metricValue(fund, key));
      if (value === null) return null;
      const peers = profile.funds.map((item) => num(metricValue(item, key))).filter((item) => item !== null);
      if (!peers.length) return null;
      const lower = peers.filter((item) => item < value).length;
      const equal = peers.filter((item) => item === value).length;
      const percentile = (lower + equal * 0.5) / peers.length;
      return key.toLowerCase().includes("drawdown") ? 1 - percentile : percentile;
    })
    .filter((value) => value !== null);
  return scores.length ? scores.reduce((sum, value) => sum + value, 0) / scores.length : -Infinity;
}

function applyQualityRules(funds) {
  const ruleKeys = selectedQualityRuleKeys();
  const cap = Math.min(10, Math.max(3, Number(els.qualityCap.value || 5)));
  if (!ruleKeys.length) {
    return { funds, ruleKeys, qualifiedCount: funds.length, displayedCount: funds.length, cap, profiles: null, scores: new Map(), candidateIds: new Set() };
  }
  const profiles = buildQualityProfiles();
  const qualified = funds.filter((fund) => {
    const profile = profiles.get(fund.strategyTwo || fund.strategyOne || "未分类策略");
    return ruleKeys.every((key) => {
      const value = num(metricValue(fund, key));
      const benchmark = profile?.medians[key];
      return value !== null && benchmark !== null && value > benchmark;
    });
  });
  const scores = new Map();
  qualified.forEach((fund) => {
    const profile = profiles.get(fund.strategyTwo || fund.strategyOne || "未分类策略");
    scores.set(fund.id, qualityScore(fund, profile, ruleKeys));
  });
  const chosen = [];
  const candidateIds = new Set();
  const qualifiedByStrategy = new Map();
  qualified.forEach((fund) => {
    const key = fund.strategyTwo || fund.strategyOne || "未分类策略";
    if (!qualifiedByStrategy.has(key)) qualifiedByStrategy.set(key, []);
    qualifiedByStrategy.get(key).push(fund);
  });
  const baseByStrategy = new Map();
  funds.forEach((fund) => {
    const key = fund.strategyTwo || fund.strategyOne || "未分类策略";
    if (!baseByStrategy.has(key)) baseByStrategy.set(key, []);
    baseByStrategy.get(key).push(fund);
  });
  baseByStrategy.forEach((items, key) => {
    const strict = qualifiedByStrategy.get(key) || [];
    const profile = profiles.get(key);
    strict
      .sort((a, b) => scores.get(b.id) - scores.get(a.id) || safe(a.fundShortName, "").localeCompare(safe(b.fundShortName, ""), "zh-Hans-CN"))
      .slice(0, cap)
      .forEach((fund) => chosen.push(fund));
    if (strict.length >= 3) return;
    const strictIds = new Set(strict.map((fund) => fund.id));
    const needed = 3 - strict.length;
    const substitutes = items
      .filter((fund) => !strictIds.has(fund.id) && ruleKeys.every((metric) => num(metricValue(fund, metric)) !== null))
      .map((fund) => ({ fund, score: qualityScore(fund, profile, ruleKeys) }))
      .sort((a, b) => b.score - a.score || safe(a.fund.fundShortName, "").localeCompare(safe(b.fund.fundShortName, ""), "zh-Hans-CN"))
      .slice(0, needed);
    substitutes.forEach(({ fund }) => {
      chosen.push(fund);
      candidateIds.add(fund.id);
    });
  });
  return { funds: chosen, ruleKeys, qualifiedCount: qualified.length, displayedCount: chosen.length, cap, profiles, scores, candidateIds };
}

function updateQualityControls() {
  const selected = selectedQualityRuleKeys();
  const allSelected = selected.length === qualityRules.length;
  els.qualityPreset.classList.toggle("active", allSelected);
  els.qualityPreset.textContent = allSelected ? "已启用五项优选" : "一键五项优选";
  els.qualityCap.disabled = !selected.length;
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

// Lazy-load the Nanhua commodity index snapshot used by CTA 净值分析.
// Generated by scripts/fetch_cta_series.py; absence just disables CTA mode.
let ctaLoadPromise = null;
function loadCtaSeries() {
  if (ctaLoadPromise) return ctaLoadPromise;
  ctaLoadPromise = fetch("./data/cta-series.json", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error(`cta-series.json 加载失败（${response.status}）`);
      return response.json();
    })
    .then((payload) => {
      const series = {};
      for (const [name, rows] of Object.entries(payload.indices || {})) {
        series[name] = (rows || [])
          .filter((row) => row && row.date && num(row.close) !== null)
          .map((row) => ({ date: row.date, close: Number(row.close) }))
          .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
      }
      const groups = (payload.meta && payload.meta.groups) || {};
      state.cta = {
        series,
        composite: (groups.composite || []).filter((n) => series[n]),
        sectors: (groups.sectors || []).filter((n) => series[n]),
        varieties: Object.fromEntries(Object.entries(groups.varieties || {}).filter(([n]) => series[n])),
        env: null,
      };
      return state.cta;
    })
    .catch((error) => {
      state.cta = null;
      ctaLoadPromise = null;
      throw error;
    });
  return ctaLoadPromise;
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
      const best = values.length ? fmtPercent(Math.max(...values)) : "-";
      const worst = values.length ? fmtPercent(Math.min(...values)) : "-";
      return `
        <article class="metric-card">
          <div class="metric-head">
            <span class="metric-title">${period.label}</span>
            <strong class="metric-stat">中位数 ${med}</strong>
          </div>
          <div class="metric-sub">平均 ${avg} · 正收益 ${positive}/${valued.length}</div>
          <div class="metric-range"><span>最佳 <b class="pos">${best}</b></span><span>最弱 <b class="neg">${worst}</b></span></div>
          <button class="rank-sort-btn" type="button" data-rank-sort="${period.key}">按此指标排序下方名单</button>
        </article>
      `;
    })
    .join("");
}

function renderStrategyOverview(funds) {
  const groups = new Map();
  funds.forEach((fund) => {
    const key = fund.strategyTwo || fund.strategyOne || "未分类策略";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(fund);
  });
  const rows = [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0], "zh-Hans-CN"));
  els.strategyOverviewMeta.textContent = `当前范围 ${funds.length} 只代表产品 · ${rows.length} 个二级策略`;
  if (!rows.length) {
    els.strategyOverviewTable.innerHTML = `<tbody><tr><td>当前条件下没有可汇总的数据</td></tr></tbody>`;
    return;
  }
  els.strategyOverviewTable.innerHTML = `
    <thead><tr><th>二级策略</th><th>样本</th>${strategyOverviewColumns.map((column) => `<th>${column.label}中位数</th>`).join("")}</tr></thead>
    <tbody>${rows
      .map(([strategy, items]) => {
        const values = strategyOverviewColumns
          .map((column) => {
            const value = median(items.map((fund) => metricValue(fund, column.key)));
            return `<td>${column.format === "percent" ? fmtPercent(value) : fmtNumber(value, 2)}</td>`;
          })
          .join("");
        return `<tr><th>${safe(strategy)}</th><td>${items.length}</td>${values}</tr>`;
      })
      .join("")}</tbody>
  `;
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
  const baseFiltered = state.funds.filter((fund) => {
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
  updateQualityControls();
  renderStrategyOverview(baseFiltered);
  state.quality = applyQualityRules(baseFiltered);
  state.filtered = state.quality.funds;
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
  const substituteCount = state.quality?.candidateIds?.size || 0;
  const qualityText = state.quality?.ruleKeys?.length
    ? `；优选 ${state.quality.ruleKeys.length} 项，符合 ${state.quality.qualifiedCount} 只，每二级策略前 ${state.quality.cap} 只${substituteCount ? `，候补 ${substituteCount} 只` : ""}`
    : "";
  els.summary.textContent = `筛选：近一年收益/超额收益 ${minReturnLabel}，一级策略 ${strategyOneLabel}，二级策略 ${strategyTwoLabel}，规模 ${scaleLabel}，视图 ${els.viewMode.value === "ranking" ? "全局排名" : "按规模分组"}${qualityText}`;
  if (state.quality?.ruleKeys?.length) {
    const candidateText = substituteCount ? `；${substituteCount} 只“候补”来自同策略综合分位评分，用于将不足 3 只的策略补足` : "";
    els.qualityHint.textContent = `同二级策略内比较，指增产品采用超额口径；${state.quality.qualifiedCount} 只符合当前规则；每策略最多展示 ${state.quality.cap} 只${candidateText}。`;
  } else {
    els.qualityHint.textContent = "同二级策略内比较；指增产品采用超额口径；启用规则后，样本不足时以候补补足 3 只。";
  }
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
                <td class="fund-cell"><strong>${safe(fund.fundShortName)}${state.quality?.candidateIds?.has(fund.id) ? '<span class="quality-candidate-tag">候补</span>' : ""}</strong><div class="subtle">${safe(fund.registerNumber)} · 净值 ${(state.navByFund[fund.id] || []).length} 条</div></td>
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

const analysisState = { funds: [], mode: "equity" };

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
// seriesMap: name -> [{date, close}] (defaults to equity index snapshot).
function buildReturnSeries(navRows, indexNames, seriesMap = state.indexSeries) {
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
  const idxList = indexNames.map((name) => ({ name, rows: seriesMap[name] || [] }));
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

// annualized return / vol / sortino / calmar / win-rate from interval returns
function extraPerfStats(rFund, rBench, ppy, maxDD) {
  const n = rFund.length;
  if (!n) return null;
  let cum = 1;
  for (const r of rFund) cum *= 1 + r;
  const annRet = n > 0 ? Math.pow(cum, ppy / n) - 1 : null;
  const mean = rFund.reduce((s, v) => s + v, 0) / n;
  let varSum = 0, dnSum = 0, dnN = 0, beat = 0;
  for (let i = 0; i < n; i += 1) {
    const d = rFund[i] - mean;
    varSum += d * d;
    if (rFund[i] < 0) { dnSum += rFund[i] * rFund[i]; dnN += 1; }
    if (rBench && rFund[i] > rBench[i]) beat += 1;
  }
  const annVol = n > 1 ? Math.sqrt(varSum / (n - 1)) * Math.sqrt(ppy) : null;
  const downDev = dnN ? Math.sqrt(dnSum / n) * Math.sqrt(ppy) : null;
  const sortino = downDev > 0 ? (mean * ppy) / downDev : null;
  const calmar = maxDD !== null && maxDD < 0 && annRet !== null ? annRet / Math.abs(maxDD) : null;
  const winRate = rBench ? beat / n : null;
  return { annRet, annVol, sortino, calmar, winRate };
}

// Treynor–Mazuy timing test: rFund = α + β·rB + γ·rB². γ>0 & significant = timing skill.
function tmTiming(rFund, rBench) {
  if (rFund.length < 8) return null;
  const sq = rBench.map((v) => v * v);
  const fit = ols(rFund, [rBench, sq]);
  if (!fit) return null;
  return { gamma: fit.beta[2], p: fit.pVal[2] };
}

function rollingAlphaSeries(dates, rFund, X, names, win, ppy) {
  const out = [];
  for (let i = win - 1; i < rFund.length; i += 1) {
    const y = rFund.slice(i - win + 1, i + 1);
    const cols = names.map((name) => X[name].slice(i - win + 1, i + 1));
    const fit = ols(y, cols);
    if (fit) out.push({ date: dates[i], value: fit.alpha * ppy });
  }
  return out;
}

/* ===================== CTA 环境指标（趋势顺滑 / 板块反转 / 动量宽度） ===================== */

function trailingPercentile(values, win, minObs) {
  const out = new Array(values.length).fill(null);
  const hist = [];
  for (let i = 0; i < values.length; i += 1) {
    const v = values[i];
    if (v === null || !Number.isFinite(v)) continue;
    hist.push(v);
    // drop values older than win valid observations
    while (hist.length > win) hist.shift();
    if (hist.length >= minObs) {
      let below = 0, equal = 0;
      for (const h of hist) { if (h < v) below += 1; else if (h === v) equal += 1; }
      out[i] = ((below + 0.5 * equal) / hist.length) * 100;
    }
  }
  return out;
}

function spearmanRankCorr(a, b) {
  const rank = (arr) => {
    const order = arr.map((v, i) => [v, i]).sort((x, y) => x[0] - y[0]);
    const r = new Array(arr.length);
    order.forEach(([, idx], pos) => { r[idx] = pos; });
    return r;
  };
  return pearson(rank(a), rank(b));
}

// Classify a (smoothness percentile, reversal percentile) pair into an
// environment regime, following the FundTalk framework:
// 深蓝=趋势顺滑+反转压力低（CTA 顺风），深红=趋势不顺+板块快速反转（CTA 逆风）。
function ctaRegime(smooth, rev) {
  if (smooth === null || rev === null) return null;
  if (smooth >= 70 && rev <= 30) return "深蓝";
  if (smooth <= 30 && rev >= 70) return "深红";
  if (smooth >= 55 && rev <= 45) return "浅蓝";
  if (smooth <= 45 && rev >= 55) return "浅红";
  return "混合";
}

const regimeBucket = { 深蓝: "顺风", 浅蓝: "顺风", 混合: "中性", 浅红: "逆风", 深红: "逆风" };
const regimeColor = { 深蓝: "#1d4ed8", 浅蓝: "#60a5fa", 混合: "#98a2b3", 浅红: "#f97066", 深红: "#b42318" };

// forward-fill a series' closes onto a reference date grid
function alignCloses(rows, dates) {
  const out = new Array(dates.length).fill(null);
  let j = 0;
  let last = null;
  for (let i = 0; i < dates.length; i += 1) {
    while (j < rows.length && rows[j].date <= dates[i]) { last = rows[j].close; j += 1; }
    out[i] = last;
  }
  return out;
}

// Compute (and cache) the market-level CTA environment time series from the
// commodity index snapshot. All indicators are daily on the composite's grid.
function computeCtaEnv() {
  const cta = state.cta;
  if (!cta) return null;
  if (cta.env) return cta.env;
  const compName = cta.composite[0];
  const comp = compName ? cta.series[compName] : null;
  if (!comp || comp.length < 300) return null;
  const dates = comp.map((r) => r.date);
  const n = dates.length;

  // 1) 趋势顺滑指数：各品种 20 日效率系数（净位移/总路程）的横截面均值 → 2 年滚动分位。
  // 用品种均值而非综合指数：指数单边行情下个别品种仍可能反复折返，均值口径更贴近
  // CTA 的实际持仓体验（同 indicators.py 的 mean_er / FundTalk 口径）。
  const varNamesEr = Object.keys(cta.varieties);
  const varAlignedEr = varNamesEr.map((name) => alignCloses(cta.series[name], dates));
  const er = new Array(n).fill(null);
  for (let i = 20; i < n; i += 1) {
    let sum = 0, cnt = 0;
    for (const s of varAlignedEr) {
      if (s[i] === null || s[i - 20] === null) continue;
      let noise = 0;
      let ok = true;
      for (let k = i - 19; k <= i; k += 1) {
        if (s[k] === null || s[k - 1] === null) { ok = false; break; }
        noise += Math.abs(s[k] - s[k - 1]);
      }
      if (!ok || !(noise > 0)) continue;
      sum += Math.abs(s[i] - s[i - 20]) / noise;
      cnt += 1;
    }
    if (cnt >= 10) er[i] = sum / cnt;
  }
  const smoothPct = trailingPercentile(er, 504, 250);

  // 2) 板块反转压力指数：板块前 5 日 vs 近 5 日收益排名的负相关强度 → 平滑 → 分位
  const sectorAligned = cta.sectors.map((name) => alignCloses(cta.series[name], dates));
  const revRaw = new Array(n).fill(null);
  for (let i = 10; i < n; i += 1) {
    const prev = [], rec = [];
    let ok = true;
    for (const s of sectorAligned) {
      const c0 = s[i - 10], c1 = s[i - 5], c2 = s[i];
      if (!(c0 > 0) || !(c1 > 0) || c2 === null) { ok = false; break; }
      prev.push(c1 / c0 - 1);
      rec.push(c2 / c1 - 1);
    }
    if (!ok || prev.length < 4) continue;
    const corr = spearmanRankCorr(prev, rec);
    if (corr !== null) revRaw[i] = Math.max(0, -corr);
  }
  const revSm = new Array(n).fill(null);
  for (let i = 0; i < n; i += 1) {
    let s = 0, c = 0;
    for (let k = Math.max(0, i - 9); k <= i; k += 1) {
      if (revRaw[k] !== null) { s += revRaw[k]; c += 1; }
    }
    if (c >= 5) revSm[i] = s / c;
  }
  const revPct = trailingPercentile(revSm, 504, 250);

  // 3) 动量宽度：正动量品种占比（20/60/120 日）
  const varNames = Object.keys(cta.varieties);
  const varAligned = varNames.map((name) => alignCloses(cta.series[name], dates));
  const breadthAt = (i, lb) => {
    let pos = 0, tot = 0;
    for (const s of varAligned) {
      const c0 = i >= lb ? s[i - lb] : null;
      if (!(c0 > 0) || s[i] === null) continue;
      tot += 1;
      if (s[i] / c0 - 1 > 0) pos += 1;
    }
    return tot >= 10 ? pos / tot : null;
  };
  const b20 = new Array(n).fill(null), b60 = new Array(n).fill(null), b120 = new Array(n).fill(null);
  for (let i = 0; i < n; i += 1) {
    b20[i] = breadthAt(i, 20);
    b60[i] = breadthAt(i, 60);
    b120[i] = breadthAt(i, 120);
  }

  const regime = dates.map((_, i) => ctaRegime(smoothPct[i], revPct[i]));
  cta.env = { dates, er, smoothPct, revPct, b20, b60, b120, regime, compName };
  return cta.env;
}

// Average smoothness/reversal percentiles over (d0, d1], classify the interval.
function intervalRegime(env, d0, d1) {
  let s = 0, r = 0, c = 0;
  for (let i = 0; i < env.dates.length; i += 1) {
    const d = env.dates[i];
    if (d <= d0) continue;
    if (d > d1) break;
    if (env.smoothPct[i] === null || env.revPct[i] === null) continue;
    s += env.smoothPct[i];
    r += env.revPct[i];
    c += 1;
  }
  if (!c) return null;
  return ctaRegime(s / c, r / c);
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

// Populate the "聚焦指数" select from the currently checked comparison indices
// and keep the previous selection if it's still valid. When only one index is
// checked there's nothing to switch to, so disable it with an explanatory hint
// instead of leaving it looking clickable-but-broken.
function syncFocusSelect(focusControl, focusSelect, names, multi) {
  if (!multi) {
    focusControl.hidden = true;
    return names[0];
  }
  focusControl.hidden = false;
  const prev = focusSelect.value;
  focusSelect.innerHTML = names.map((n) => `<option value="${n}">${n}</option>`).join("");
  const focus = names.includes(prev) ? prev : names[0];
  focusSelect.value = focus;
  const onlyOne = names.length <= 1;
  focusSelect.disabled = onlyOne;
  const hint = focusControl.querySelector("#focusIndexHint");
  if (hint) {
    hint.textContent = onlyOne
      ? `当前只勾选了【${names[0] || "-"}】一个对比指数，滚动图只能看这一个；在上方"对比指数"里再勾选其它指数，这里才能切换聚焦`
      : `滚动图按各产品对所选指数的暴露画线；可选项来自上方"对比指数"的勾选`;
  }
  return focus;
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
        <li><b>择时 γ（T-M 模型）</b>：在回归中加入市场收益的平方项。γ 显著为正=市场涨时敢加仓、跌时会减仓（有择时能力）；显著为负=常被行情反向打。</li>
        <li><b>索提诺 / 卡玛</b>：只惩罚下行波动的夏普（索提诺）、年化收益÷最大回撤（卡玛），都是越高越好。</li>
        <li><b>滚动 α</b>：α 随时间的变化（年化）。看超额能力是持续的，还是只集中在某一段。</li>
      </ul>
      <p class="analysis-help-warn">提示：回归只是参考。若某指数恰好与产品真实持仓高度相关，也会显示出高暴露——不能盲信，需结合管理人、策略口径等其它信息综合判断。</p>
    </div>
  </details>
`;

const ctaHelpHtml = `
  <details class="analysis-help">
    <summary>怎么看 CTA 分析？（点击展开）</summary>
    <div class="analysis-help-body">
      <p><b>这页在做什么：</b>CTA 收益不看"跑赢哪个指数"，而看两件事——① 产品对商品市场的暴露方向和幅度（β）；② 商品市场当前是否给趋势策略"顺风"（趋势顺不顺、板块主线是否延续）。</p>
      <ul>
        <li><b>β · 南华商品指数</b>：衡量多头偏向。β 明显为正=偏多头趋势跟踪；接近 0=多空平衡或截面策略；回归 R² 低是正常的（CTA 本就不该被单一指数解释）。</li>
        <li><b>板块 β</b>：勾选南华板块指数后，可看产品的收益更贴近哪个板块（能化 / 黑色 / 有色 / 贵金属 / 农产品）。</li>
        <li><b>趋势顺滑指数（0-100 分位）</b>：南华商品指数 20 日"净位移 ÷ 总路程"的历史分位。低于 30=价格反复折返、假突破多，趋势策略难受。</li>
        <li><b>板块反转压力指数（0-100 分位）</b>：板块前 5 日强弱排名与最近 5 日排名的负相关强度。高于 70=强弱结构快速反转，"刚确认、就反转"。</li>
        <li><b>环境状态</b>：顺滑高+反转低=<b style="color:#1d4ed8">深蓝（顺风）</b>；顺滑低+反转高=<b style="color:#b42318">深红（逆风）</b>；其余为浅蓝 / 混合 / 浅红。</li>
        <li><b>动量宽度</b>：20/60/120 日正动量品种占比。三线同向抬升=趋势逐步扩散、被多周期确认，是 CTA 最舒服的行情。</li>
        <li><b>环境适应性</b>：把产品每期收益按当期环境归入顺风 / 中性 / 逆风。好的 CTA 应当顺风赚得动、逆风守得住；<b>逆风回吐比</b>=逆风亏损 ÷ 顺风盈利，越低越好。</li>
        <li><b>股指相关性</b>：CTA 与沪深300 的相关性应接近 0。明显偏正=可能含股指多头暴露，危机保护属性打折。</li>
      </ul>
      <p class="analysis-help-warn">提示：环境指标基于南华指数体系（参考 FundTalk 趋势顺滑 / 板块反转框架），只刻画商品趋势类 CTA 的适应环境；套利、截面、期权类策略不完全适用。</p>
    </div>
  </details>
`;

function openAnalysis(funds) {
  if (!state.indexNames.length) return;
  const list = (Array.isArray(funds) ? funds : [funds]).filter(Boolean);
  if (!list.length) return;
  analysisState.funds = list;
  const ctaLike = (f) => f.strategyOne === "期货策略" || /CTA|期货|管理期货/.test(safe(f.strategyOne, "") + safe(f.strategyTwo, ""));
  analysisState.mode = list.every(ctaLike) ? "cta" : "equity";
  // open the modal BEFORE rendering: charts read clientWidth, which is 0 while hidden
  els.analysisModal.classList.add("open");
  els.analysisModal.setAttribute("aria-hidden", "false");
  els.analysisModal.scrollTop = 0;
  renderAnalysisShell();
}

function renderAnalysisShell() {
  const list = analysisState.funds;
  els.analysisContent.innerHTML = `
    <div class="analysis-head">
      <h2>净值分析${list.length > 1 ? `（${list.length} 只产品）` : ` · ${safe(list[0].fundShortName)}`}</h2>
      <p>${list.map((f) => safe(f.fundShortName)).join(" / ")} · 区间收益回归 / 滚动暴露 / 策略环境</p>
    </div>
    <div class="analysis-mode-toggle" id="analysisModeToggle">
      <button type="button" data-mode="equity" class="${analysisState.mode === "equity" ? "active" : ""}">股票策略分析</button>
      <button type="button" data-mode="cta" class="${analysisState.mode === "cta" ? "active" : ""}">CTA 策略分析</button>
    </div>
    <div id="analysisBody"></div>
  `;
  els.analysisContent.querySelector("#analysisModeToggle").addEventListener("click", (event) => {
    const btn = event.target.closest("[data-mode]");
    if (!btn || btn.dataset.mode === analysisState.mode) return;
    analysisState.mode = btn.dataset.mode;
    els.analysisContent.querySelectorAll("#analysisModeToggle button").forEach((b) => b.classList.toggle("active", b.dataset.mode === analysisState.mode));
    renderAnalysisBody();
  });
  renderAnalysisBody();
}

function renderAnalysisBody() {
  if (analysisState.mode === "cta") renderCtaBody();
  else renderEquityBody();
}

function analysisControlsHtml(pickNames, defaults, pickerNote) {
  return `
    <div id="analysisControls" class="analysis-controls">
      <div class="analysis-control">
        <span>对比指数（多选）</span>
        <div id="analysisIndexPicker" class="analysis-index-picker">
          ${pickNames
            .map(
              (name) => `
                <label class="multi-option"><input type="checkbox" value="${name}" ${defaults.has(name) ? "checked" : ""} /><span>${name}</span></label>
              `
            )
            .join("")}
        </div>
        ${pickerNote ? `<small class="analysis-hint">${pickerNote}</small>` : ""}
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
        <small class="analysis-hint" id="focusIndexHint">多产品对比时，滚动图按各产品对该指数的暴露画线；可选项来自上方"对比指数"的勾选，勾选多个才能切换</small>
      </div>
    </div>
  `;
}

function renderEquityBody() {
  const list = analysisState.funds;
  const body = els.analysisContent.querySelector("#analysisBody");
  const defaults = new Set();
  list.forEach((f) => defaultIndicesFor(f).forEach((n) => defaults.add(n)));
  if (list.length > 1) defaults.add(indexAlias["沪深300"]); // ensure a shared broad index for multi-fund
  body.innerHTML = `
    ${analysisHelpHtml}
    ${analysisControlsHtml(state.indexNames, defaults, "宽基看仓位风格，国证成长/价值、中证红利看风格暴露")}
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
    <h3 class="analysis-sub" id="alphaTitle">滚动年化 α · 超额能力持续性</h3>
    <div class="chart-wrap analysis-chart-wrap"><canvas id="alphaChart"></canvas></div>
  `;
  body.querySelector("#analysisControls").addEventListener("change", updateAnalysis);
  updateAnalysis();
}

function renderCtaBody() {
  const body = els.analysisContent.querySelector("#analysisBody");
  if (!state.cta) {
    body.innerHTML = `<div class="empty-state">正在加载商品指数数据…</div>`;
    loadCtaSeries()
      .then(() => {
        if (analysisState.mode === "cta") renderCtaBody();
      })
      .catch(() => {
        if (analysisState.mode !== "cta") return;
        body.innerHTML = `<div class="empty-state">商品指数数据（cta-series.json）尚未生成。<br />请运行 <code>python scripts/fetch_cta_series.py</code> 后刷新页面。</div>`;
      });
    return;
  }
  const pickNames = [...state.cta.composite, ...state.cta.sectors];
  // check composite + all sectors by default so the sector β breakdown is visible
  // immediately and (when comparing 2+ products) the "聚焦指数" selector below has
  // more than one option to switch between right away.
  const defaults = new Set(pickNames);
  body.innerHTML = `
    ${ctaHelpHtml}
    ${analysisControlsHtml(pickNames, defaults, "默认全选南华商品指数及五个板块指数；取消勾选可精简回归")}
    <h3 class="analysis-sub">分析解读</h3>
    <div id="analysisReading" class="analysis-reading"></div>
    <h3 class="analysis-sub">商品指数回归（区间收益 OLS）· β 暴露</h3>
    <div id="analysisReg" class="reg-table-wrap"></div>
    <h3 class="analysis-sub">净值深加工指标</h3>
    <div id="analysisMetrics" class="reg-table-wrap"></div>
    <h3 class="analysis-sub">环境适应性 · 顺风 / 逆风表现拆解</h3>
    <div id="ctaAdaptTable" class="reg-table-wrap"></div>
    <h3 class="analysis-sub">CTA 策略环境 · 当前状态</h3>
    <div id="ctaEnvCards" class="analysis-cards"></div>
    <h3 class="analysis-sub">趋势顺滑指数 vs 板块反转压力指数（历史分位 0-100）</h3>
    <div class="chart-wrap analysis-chart-wrap"><canvas id="ctaEnvChart"></canvas></div>
    <h3 class="analysis-sub">商品动量宽度 · 正动量品种占比</h3>
    <div class="chart-wrap analysis-chart-wrap"><canvas id="ctaBreadthChart"></canvas></div>
    <div id="analysisLegend" class="legend"></div>
    <h3 class="analysis-sub" id="corrTitle">滚动相关系数（×100%）</h3>
    <div class="chart-wrap analysis-chart-wrap"><canvas id="corrChart"></canvas></div>
    <h3 class="analysis-sub" id="betaTitle">滚动 β 暴露（×100%）</h3>
    <div class="chart-wrap analysis-chart-wrap"><canvas id="betaChart"></canvas></div>
  `;
  body.querySelector("#analysisControls").addEventListener("change", updateCtaAnalysis);
  updateCtaAnalysis();
}

// build {fund, navRows, aligned, fit} for each fund against the selected indices
function analysisBundles(names, seriesMap = state.indexSeries) {
  return analysisState.funds.map((fund) => {
    const navRows = state.navByFund[fund.id] || [];
    const aligned = buildReturnSeries(navRows, names, seriesMap);
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

function metricsComparisonTable(names, bundles, opts = {}) {
  const primary = names[0];
  const mode = opts.mode || "equity";
  const stat = bundles.map((b) => {
    if (!b.fit) return null;
    const annAlpha = b.fit.alpha * b.aligned.ppy;
    const ir = b.fit.sigmaResid > 0 ? (b.fit.alpha / b.fit.sigmaResid) * Math.sqrt(b.aligned.ppy) : null;
    const cap = captureRatios(b.aligned.rFund, b.aligned.X[primary]);
    const dd = drawdownRecovery(b.navRows);
    const perf = extraPerfStats(b.aligned.rFund, b.aligned.X[primary], b.aligned.ppy, dd.maxDD);
    const tm = mode === "equity" ? tmTiming(b.aligned.rFund, b.aligned.X[primary]) : null;
    let eqCorr = null;
    if (mode === "cta" && state.indexSeries["沪深300"]) {
      const pair = buildReturnSeries(b.navRows, ["沪深300"], state.indexSeries);
      if (pair.rFund.length >= 8) eqCorr = pearson(pair.rFund, pair.X["沪深300"]);
    }
    return { annAlpha, ir, r2: b.fit.r2, cap, dd, perf, tm, eqCorr };
  });
  const row = (label, render) =>
    `<tr><td>${label}</td>${bundles.map((b, i) => render(stat[i])).join("")}</tr>`;
  const dash = `<td class="num">-</td>`;
  const pct = (v, cls = true) => `<td class="num ${cls ? clsByNumber(v) : ""}">${(v * 100).toFixed(2)}%</td>`;
  const equityRows = mode === "equity"
    ? `
        ${row("择时 γ（T-M）", (s) => (s && s.tm ? `<td class="num ${clsByNumber(s.tm.gamma)}">${fmtSigned(s.tm.gamma, 2)}<sup class="star">${pStars(s.tm.p)}</sup></td>` : dash))}
        ${row(`对基准胜率 · ${primary}`, (s) => (s && s.perf && s.perf.winRate !== null ? `<td class="num">${(s.perf.winRate * 100).toFixed(0)}%</td>` : dash))}
      `
    : "";
  const ctaRows = mode === "cta"
    ? `
        ${row("股指相关性 · 沪深300", (s) => (s && s.eqCorr !== null ? `<td class="num ${Math.abs(s.eqCorr) > 0.4 ? "neg" : ""}">${s.eqCorr.toFixed(2)}</td>` : dash))}
      `
    : "";
  return `
    <table class="reg-table">
      <thead><tr><th>指标</th>${bundles.map((b) => `<th class="num">${safe(b.fund.fundShortName)}</th>`).join("")}</tr></thead>
      <tbody>
        ${row("年化收益", (s) => (s && s.perf && s.perf.annRet !== null ? pct(s.perf.annRet) : dash))}
        ${row("年化波动", (s) => (s && s.perf && s.perf.annVol !== null ? pct(s.perf.annVol, false) : dash))}
        ${row("年化 α", (s) => (s ? pct(s.annAlpha) : dash))}
        ${row("信息比率 IR", (s) => (s && s.ir !== null ? `<td class="num ${clsByNumber(s.ir)}">${s.ir.toFixed(2)}</td>` : dash))}
        ${row("索提诺比率", (s) => (s && s.perf && s.perf.sortino !== null ? `<td class="num ${clsByNumber(s.perf.sortino)}">${s.perf.sortino.toFixed(2)}</td>` : dash))}
        ${row("卡玛比率", (s) => (s && s.perf && s.perf.calmar !== null ? `<td class="num ${clsByNumber(s.perf.calmar)}">${s.perf.calmar.toFixed(2)}</td>` : dash))}
        ${row("拟合优度 R²", (s) => (s ? `<td class="num">${s.r2.toFixed(3)}</td>` : dash))}
        ${equityRows}
        ${row(`上行捕获 · ${primary}`, (s) => (s && s.cap.up !== null ? `<td class="num">${(s.cap.up * 100).toFixed(0)}%</td>` : dash))}
        ${row(`下行捕获 · ${primary}`, (s) => (s && s.cap.down !== null ? `<td class="num">${(s.cap.down * 100).toFixed(0)}%</td>` : dash))}
        ${ctaRows}
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
  const alphaCanvas = els.analysisContent.querySelector("#alphaChart");
  const corrTitle = els.analysisContent.querySelector("#corrTitle");
  const betaTitle = els.analysisContent.querySelector("#betaTitle");
  const alphaTitle = els.analysisContent.querySelector("#alphaTitle");
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
    if (alphaCanvas) renderChart(alphaCanvas, []);
    return;
  }

  // focus index control (multi-fund rolling charts pick one index)
  const focus = syncFocusSelect(focusControl, focusSelect, names, multi);

  const bundles = analysisBundles(names);

  readingEl.innerHTML = buildReading(names, bundles);
  regEl.innerHTML = regComparisonTable(names, bundles);
  metricsEl.innerHTML = metricsComparisonTable(names, bundles, { mode: "equity" });

  // ---- rolling charts ----
  let corrDatasets;
  let betaDatasets;
  let alphaDatasets;
  let legendItems;
  if (multi) {
    corrTitle.textContent = `滚动相关系数 · 各产品对【${focus}】（×100%）`;
    betaTitle.textContent = `滚动 β · 各产品对【${focus}】（×100%）`;
    if (alphaTitle) alphaTitle.textContent = `滚动年化 α · 各产品对【${focus}】`;
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
    alphaDatasets = bundles
      .map((b, i) => {
        const pair = buildReturnSeries(b.navRows, [focus]);
        return { color: palette[i % palette.length], label: b.fund.fundShortName, series: rollingAlphaSeries(pair.dates, pair.rFund, pair.X, [focus], win, pair.ppy) };
      })
      .filter((ds) => ds.series.length);
    legendItems = bundles.map((b, i) => ({ color: palette[i % palette.length], label: `${safe(b.fund.fundShortName)} · ${safe(b.fund.advisor)}` }));
  } else {
    corrTitle.textContent = `滚动相关系数 · 对各指数（×100%）`;
    betaTitle.textContent = `滚动 β 暴露 · 风格漂移（×100%）`;
    if (alphaTitle) alphaTitle.textContent = `滚动年化 α · 剔除所选指数暴露后的超额（多指数联合回归）`;
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
    alphaDatasets = b.fit
      ? [{ color: palette[0], label: `${safe(b.fund.fundShortName)} · 年化α`, series: rollingAlphaSeries(b.aligned.dates, b.aligned.rFund, b.aligned.X, names, win, b.aligned.ppy) }].filter((ds) => ds.series.length)
      : [];
    legendItems = names.map((name, i) => ({ color: palette[i % palette.length], label: name }));
  }
  legendEl.innerHTML = legendItems
    .map((it) => `<span><i style="background:${it.color}"></i>${it.label}</span>`)
    .join("");
  renderChart(corrCanvas, corrDatasets, { fmt: numFmt2 });
  renderChart(betaCanvas, betaDatasets, { fmt: numFmt2 });
  if (alphaCanvas) renderChart(alphaCanvas, alphaDatasets);
}

/* ===================== CTA 净值分析 ===================== */

// Bucket each NAV interval by the prevailing CTA environment and aggregate
// per-bucket performance. Interval i spans (dates[i-1], dates[i]]; the first
// interval has no recorded start so it is skipped.
function ctaAdaptStats(aligned, env) {
  const mk = () => ({ n: 0, sum: 0, wins: 0, cum: 1 });
  const buckets = { 顺风: mk(), 中性: mk(), 逆风: mk() };
  for (let i = 1; i < aligned.dates.length; i += 1) {
    const regime = intervalRegime(env, aligned.dates[i - 1], aligned.dates[i]);
    if (!regime) continue;
    const bucket = buckets[regimeBucket[regime]];
    const r = aligned.rFund[i];
    bucket.n += 1;
    bucket.sum += r;
    if (r > 0) bucket.wins += 1;
    bucket.cum *= 1 + r;
  }
  const tail = buckets.顺风.cum - 1;
  const head = buckets.逆风.cum - 1;
  const giveBack = tail > 0 && head < 0 ? Math.min(-head / tail, 9.99) : null;
  return { buckets, giveBack };
}

function ctaAdaptTable(bundles, adaptStats) {
  const bucketCell = (s, key) => {
    const b = s ? s.buckets[key] : null;
    if (!b || !b.n) return `<td class="num">-</td>`;
    const avg = b.sum / b.n;
    const cum = b.cum - 1;
    return `<td class="num"><b class="${clsByNumber(cum)}">${fmtPercent(cum)}</b><div class="subtle">${b.n} 期 · 均 ${fmtPercent(avg)} · 胜率 ${((b.wins / b.n) * 100).toFixed(0)}%</div></td>`;
  };
  const row = (label, render) => `<tr><td>${label}</td>${bundles.map((b, i) => render(adaptStats[i])).join("")}</tr>`;
  return `
    <table class="reg-table">
      <thead><tr><th>环境</th>${bundles.map((b) => `<th class="num">${safe(b.fund.fundShortName)}</th>`).join("")}</tr></thead>
      <tbody>
        ${row("顺风（深蓝/浅蓝）累计", (s) => bucketCell(s, "顺风"))}
        ${row("中性（混合）累计", (s) => bucketCell(s, "中性"))}
        ${row("逆风（浅红/深红）累计", (s) => bucketCell(s, "逆风"))}
        ${row("逆风回吐比", (s) => (s && s.giveBack !== null ? `<td class="num ${s.giveBack > 0.6 ? "neg" : ""}">${(s.giveBack * 100).toFixed(0)}%</td>` : `<td class="num">-</td>`))}
      </tbody>
    </table>
    <div class="reg-foot">按每个净值区间内趋势顺滑/板块反转分位的均值归类环境；逆风回吐比 = 逆风累计亏损 ÷ 顺风累计盈利（越低越好，&gt;60% 标红）。样本期以产品净值与商品指数重叠区间为准。</div>
  `;
}

function ctaEnvCardsHtml(env) {
  const last = (arr) => {
    for (let i = arr.length - 1; i >= 0; i -= 1) if (arr[i] !== null) return { v: arr[i], date: env.dates[i] };
    return null;
  };
  const sm = last(env.smoothPct);
  const rv = last(env.revPct);
  const regime = sm && rv ? ctaRegime(sm.v, rv.v) : null;
  const b20 = last(env.b20), b60 = last(env.b60), b120 = last(env.b120);
  const card = (title, value, note, color) => `
    <div class="analysis-card">
      <div class="analysis-card-title">${title}</div>
      <div class="analysis-card-value" ${color ? `style="color:${color}"` : ""}>${value}</div>
      <div class="analysis-card-note">${note}</div>
    </div>
  `;
  return [
    regime ? card("当前环境状态", regime, `截至 ${sm.date} · ${regimeBucket[regime]}环境`, regimeColor[regime]) : "",
    sm ? card("趋势顺滑指数", sm.v.toFixed(0), sm.v < 30 ? "价格路径不顺，假突破多" : sm.v > 70 ? "趋势有效，路径顺滑" : "中等") : "",
    rv ? card("板块反转压力", rv.v.toFixed(0), rv.v > 70 ? "板块主线快速切换" : rv.v < 30 ? "强弱结构延续" : "中等") : "",
    b20 && b60 && b120 ? card("动量宽度 20/60/120", `${(b20.v * 100).toFixed(0)}% / ${(b60.v * 100).toFixed(0)}% / ${(b120.v * 100).toFixed(0)}%`, "正动量品种占比，三线同升=趋势扩散") : "",
  ].join("");
}

function buildCtaReading(names, bundles, adaptStats, env) {
  const compName = env ? env.compName : names[0];
  const items = bundles.map((b, i) => {
    const name = safe(b.fund.fundShortName);
    if (!b.fit) return `<li><b>${name}</b>：样本不足（${b.aligned.rFund.length} 个重叠观测点），无法稳定回归。</li>`;
    const ci = names.indexOf(compName);
    const beta = ci >= 0 ? b.fit.beta[ci + 1] : b.fit.beta[1];
    const betaP = ci >= 0 ? b.fit.pVal[ci + 1] : b.fit.pVal[1];
    let dir;
    if (beta > 0.3 && pStars(betaP)) dir = `对商品指数有明显多头暴露（β=${beta.toFixed(2)}${pStars(betaP)}），偏多头趋势跟踪`;
    else if (beta < -0.3 && pStars(betaP)) dir = `对商品指数呈显著负暴露（β=${beta.toFixed(2)}${pStars(betaP)}），当前偏空头持仓`;
    else dir = `对商品指数暴露不明显（β=${beta.toFixed(2)}），多空较平衡或以截面/套利为主`;
    const s = adaptStats[i];
    let adaptText = "";
    if (s) {
      const t = s.buckets.顺风, h = s.buckets.逆风;
      if (t.n >= 3 && h.n >= 3) {
        adaptText = `；顺风期累计 ${fmtPercent(t.cum - 1)}（${t.n} 期），逆风期累计 ${fmtPercent(h.cum - 1)}（${h.n} 期）` +
          (s.giveBack !== null ? `，逆风回吐比 ${(s.giveBack * 100).toFixed(0)}%${s.giveBack > 0.6 ? "，回吐偏多需关注" : "，控制尚可"}` : "");
      }
    }
    return `<li><b>${name}</b>：${dir}；R²=${b.fit.r2.toFixed(2)}${b.fit.r2 < 0.3 ? "（低 R² 对 CTA 属正常）" : ""}${adaptText}。</li>`;
  }).join("");
  let envText = "";
  if (env) {
    const li = (arr) => { for (let i = arr.length - 1; i >= 0; i -= 1) if (arr[i] !== null) return arr[i]; return null; };
    const sm = li(env.smoothPct), rv = li(env.revPct);
    const regime = sm !== null && rv !== null ? ctaRegime(sm, rv) : null;
    if (regime) {
      const desc = {
        深蓝: "趋势顺滑且板块主线延续，CTA 明确顺风，可关注顺风期进攻能力强的产品",
        浅蓝: "环境偏友好，趋势可做但强度一般",
        混合: "顺逆信号交织，管理人分化会加大，更看重风控与周期分散",
        浅红: "环境转差，趋势延续性不足，注意仓位",
        深红: "趋势不顺 + 板块快速反转的典型逆风区，警惕净值回吐，逆风守得住的产品更可贵",
      }[regime];
      envText = `<p class="analysis-reading-compare">当前商品市场环境为 <b style="color:${regimeColor[regime]}">${regime}</b>（趋势顺滑分位 ${sm.toFixed(0)}，板块反转压力分位 ${rv.toFixed(0)}）：${desc}。</p>`;
    }
  }
  return `<ul class="analysis-reading-list">${items}</ul>${envText}`;
}

function updateCtaAnalysis() {
  const funds = analysisState.funds;
  if (!funds.length || !state.cta) return;
  const seriesMap = state.cta.series;
  const names = analysisSelectedIndices();
  const win = Number(els.analysisContent.querySelector("#analysisWindow").value) || 26;
  const readingEl = els.analysisContent.querySelector("#analysisReading");
  const regEl = els.analysisContent.querySelector("#analysisReg");
  const metricsEl = els.analysisContent.querySelector("#analysisMetrics");
  const adaptEl = els.analysisContent.querySelector("#ctaAdaptTable");
  const envCardsEl = els.analysisContent.querySelector("#ctaEnvCards");
  const legendEl = els.analysisContent.querySelector("#analysisLegend");
  const envCanvas = els.analysisContent.querySelector("#ctaEnvChart");
  const breadthCanvas = els.analysisContent.querySelector("#ctaBreadthChart");
  const corrCanvas = els.analysisContent.querySelector("#corrChart");
  const betaCanvas = els.analysisContent.querySelector("#betaChart");
  const corrTitle = els.analysisContent.querySelector("#corrTitle");
  const betaTitle = els.analysisContent.querySelector("#betaTitle");
  const focusControl = els.analysisContent.querySelector("#focusIndexControl");
  const focusSelect = els.analysisContent.querySelector("#focusIndexSelect");
  const numFmt2 = (value) => value.toFixed(2);
  const multi = funds.length > 1;

  const env = computeCtaEnv();

  // ---- market environment (independent of index selection) ----
  if (env) {
    envCardsEl.innerHTML = ctaEnvCardsHtml(env);
    const clip = Math.max(0, env.dates.length - 750);
    const toSeries = (arr) => {
      const out = [];
      for (let i = clip; i < env.dates.length; i += 1) {
        if (arr[i] !== null) out.push({ date: env.dates[i], value: arr[i] });
      }
      return out;
    };
    renderChart(envCanvas, [
      { color: "#1d4ed8", label: "趋势顺滑指数", series: toSeries(env.smoothPct) },
      { color: "#b42318", label: "板块反转压力指数", series: toSeries(env.revPct) },
    ], { fmt: (v) => v.toFixed(0) });
    renderChart(breadthCanvas, [
      { color: palette[1], label: "20日正动量占比", series: toSeries(env.b20) },
      { color: palette[0], label: "60日正动量占比", series: toSeries(env.b60) },
      { color: palette[3], label: "120日正动量占比", series: toSeries(env.b120) },
    ]);
  } else {
    envCardsEl.innerHTML = `<div class="empty-state">商品指数历史不足，无法计算环境指标</div>`;
    renderChart(envCanvas, []);
    renderChart(breadthCanvas, []);
  }

  if (!names.length) {
    readingEl.innerHTML = "";
    regEl.innerHTML = `<div class="empty-state">请至少选择一个对比指数</div>`;
    metricsEl.innerHTML = "";
    adaptEl.innerHTML = "";
    legendEl.innerHTML = "";
    focusControl.hidden = true;
    renderChart(corrCanvas, []);
    renderChart(betaCanvas, []);
    return;
  }

  const focus = syncFocusSelect(focusControl, focusSelect, names, multi);

  const bundles = analysisBundles(names, seriesMap);
  const adaptStats = bundles.map((b) => (env ? ctaAdaptStats(b.aligned, env) : null));

  readingEl.innerHTML = buildCtaReading(names, bundles, adaptStats, env);
  regEl.innerHTML = regComparisonTable(names, bundles);
  metricsEl.innerHTML = metricsComparisonTable(names, bundles, { mode: "cta" });
  adaptEl.innerHTML = env ? ctaAdaptTable(bundles, adaptStats) : `<div class="empty-state">环境指标不可用</div>`;

  // ---- rolling charts vs commodity indices ----
  let corrDatasets;
  let betaDatasets;
  let legendItems;
  if (multi) {
    corrTitle.textContent = `滚动相关系数 · 各产品对【${focus}】（×100%）`;
    betaTitle.textContent = `滚动 β · 各产品对【${focus}】（×100%）`;
    corrDatasets = bundles
      .map((b, i) => {
        const pair = buildReturnSeries(b.navRows, [focus], seriesMap);
        return { color: palette[i % palette.length], label: b.fund.fundShortName, series: rollingCorrSeries(pair.dates, pair.rFund, pair.X[focus], win) };
      })
      .filter((ds) => ds.series.length);
    betaDatasets = bundles
      .map((b, i) => {
        const pair = buildReturnSeries(b.navRows, [focus], seriesMap);
        const bs = rollingBetaSeries(pair.dates, pair.rFund, pair.X, [focus], win);
        return { color: palette[i % palette.length], label: b.fund.fundShortName, series: bs[0] || [] };
      })
      .filter((ds) => ds.series.length);
    legendItems = bundles.map((b, i) => ({ color: palette[i % palette.length], label: `${safe(b.fund.fundShortName)} · ${safe(b.fund.advisor)}` }));
  } else {
    corrTitle.textContent = `滚动相关系数 · 对各商品指数（×100%）`;
    betaTitle.textContent = `滚动 β 暴露 · 多空切换（×100%）`;
    const b = bundles[0];
    corrDatasets = names
      .map((name, i) => {
        const pair = buildReturnSeries(b.navRows, [name], seriesMap);
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
  els.strategyOverview.hidden = !isBrowse;
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

els.strategyOverviewToggle.addEventListener("click", () => {
  const opening = els.strategyOverviewDetails.hidden;
  els.strategyOverviewDetails.hidden = !opening;
  els.strategyOverviewToggle.innerHTML = `${opening ? "收起" : "查看"}策略中位数 <span class="overview-toggle-arrow" aria-hidden="true">${opening ? "⌃" : "⌄"}</span>`;
  els.strategyOverviewToggle.setAttribute("aria-expanded", String(opening));
});

els.query.addEventListener("input", applyFilters);
els.strategyOneButton.addEventListener("click", () => toggleMultiMenu(els.strategyOneButton, els.strategyOne));
els.strategyTwoButton.addEventListener("click", () => toggleMultiMenu(els.strategyTwoButton, els.strategyTwo));
els.scaleButton.addEventListener("click", () => toggleMultiMenu(els.scaleButton, els.scale));
els.strategyOne.addEventListener("change", applyFilters);
els.strategyTwo.addEventListener("change", applyFilters);
els.scale.addEventListener("change", applyFilters);
els.viewMode.addEventListener("change", applyFilters);
els.minReturn.addEventListener("input", applyFilters);
els.qualityRules.forEach((input) => input.addEventListener("change", applyFilters));
els.qualityCap.addEventListener("change", applyFilters);
els.qualityPreset.addEventListener("click", () => {
  const enable = selectedQualityRuleKeys().length !== qualityRules.length;
  els.qualityRules.forEach((input) => {
    input.checked = enable;
  });
  applyFilters();
});
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
  els.qualityRules.forEach((input) => {
    input.checked = false;
  });
  els.qualityCap.value = "5";
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
