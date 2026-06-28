// Due Diligence Center - Detail Page
async function init() {
    const params = new URLSearchParams(window.location.search);
    const key = params.get('key');
    if (!key) { showError('未指定报告'); return; }

    try {
        const resp = await fetch(`./data/due-diligence-data.json?v=${Date.now()}`);
        const payload = await resp.json();
        const report = payload.reports.find(r => r.key === key);
        if (!report) { showError('未找到报告：' + key); return; }
        renderDetail(report);
    } catch (e) { showError('数据加载失败'); console.error(e); }
}

function showError(msg) {
    document.getElementById('detailCard').innerHTML =
        `<p style="color:var(--text-secondary);text-align:center;padding:40px;">${msg}</p>`;
}

function mdToHtml(text) {
    if (!text) return '';
    let html = text;
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/^### (.+)$/gm, '<h3 class="md-h3">$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2 class="md-h2">$1</h2>');
    html = html.replace(/^\|(.+)\|$/gm, (match) => {
        if (match.includes('---')) return '';
        const cells = match.split('|').filter(c => c.trim()).map(c => `<td>${c.trim()}</td>`).join('');
        return `<tr>${cells}</tr>`;
    });
    html = html.replace(/(<tr>.+<\/tr>\s*)+/g, '<table class="md-table">$&</table>');
    html = html.replace(/\n/g, '<br>');
    return html;
}

function renderDetail(r) {
    const strategyBadge = r.strategyCategory
        ? `<span class="badge badge-strategy">${r.strategyCategory}</span>` : '';

    const gridItems = [];
    if (r.strategy) gridItems.push(['策略类型', r.strategy]);
    if (r.founded) gridItems.push(['成立时间', r.founded]);
    if (r.scale) gridItems.push(['管理规模', r.scale]);
    if (r.team) gridItems.push(['团队规模', r.team]);
    if (r.reportDate) gridItems.push(['报告日期', r.reportDate]);

    const tagsHtml = (r.tags || []).map(t => `<span class="tag">${t}</span>`).join('');

    let bodyHtml = '';
    if (r.fulltextBody) {
        bodyHtml = `<div class="detail-section"><div class="report-body">${mdToHtml(r.fulltextBody)}</div></div>`;
    } else if (r.performance || r.risk) {
        bodyHtml = `
        ${r.keyPoints ? `<div class="detail-section"><h3>策略要点</h3><p>${r.keyPoints}</p></div>` : ''}
        ${r.performance ? `<div class="detail-section"><h3>业绩表现</h3><p>${r.performance}</p></div>` : ''}
        ${r.risk ? `<div class="detail-section"><h3>风控要点</h3><p>${r.risk}</p></div>` : ''}`;
    } else if (r.keyPoints) {
        bodyHtml = `<div class="detail-section"><p>${r.keyPoints}</p></div>`;
    }

    document.getElementById('detailCard').innerHTML = `
        <h1>${r.name}</h1>
        <div class="detail-subtitle">${strategyBadge}</div>
        <div class="detail-grid">${gridItems.map(([l, v]) => `<div class="dg-item"><div class="dg-label">${l}</div><div class="dg-value">${v}</div></div>`).join('')}</div>
        ${bodyHtml}
        <div class="detail-tags">${tagsHtml}</div>`;
}

init();
