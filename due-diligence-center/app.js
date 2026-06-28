// Due Diligence Center - List Page
let allReports = [];
let currentFilter = 'all';
let currentQuery = '';

async function init() {
    try {
        const resp = await fetch(`./data/due-diligence-data.json?v=${Date.now()}`);
        const payload = await resp.json();
        allReports = payload.reports || [];
        renderStats(payload.meta);
        renderFilterPills(payload.categories || []);
        renderCards();
        bindEvents();
    } catch (e) {
        document.getElementById('cardGrid').innerHTML =
            '<div class="empty-state"><div class="empty-icon">📭</div><p>数据加载失败，请检查网络后重试</p></div>';
    }
}

function renderStats(meta) {
    document.getElementById('statsBar').innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${meta.totalReports}</div>
            <div class="stat-label">管理人尽调报告</div>
        </div>`;
}

function renderFilterPills(categories) {
    const container = document.getElementById('filterPills');
    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'filter-pill';
        btn.dataset.category = cat;
        btn.textContent = cat;
        btn.onclick = () => {
            document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = cat;
            renderCards();
        };
        container.appendChild(btn);
    });
    document.querySelectorAll('.filter-pill[data-category="all"]').forEach(b => {
        b.onclick = () => { currentFilter = 'all'; setActivePill(b); renderCards(); };
    });
}

function setActivePill(btn) {
    document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function bindEvents() {
    document.getElementById('queryInput').addEventListener('input', (e) => {
        currentQuery = e.target.value.trim().toLowerCase();
        renderCards();
    });
}

function filterReports() {
    return allReports.filter(r => {
        if (currentQuery) {
            const haystack = (r.name + r.strategy + r.keyPoints).toLowerCase();
            if (!haystack.includes(currentQuery)) return false;
        }
        if (currentFilter === 'all') return true;
        return r.strategyCategory === currentFilter;
    });
}

function renderCards() {
    const filtered = filterReports();
    const grid = document.getElementById('cardGrid');
    document.getElementById('resultInfo').textContent = `共 ${filtered.length} 份报告`;

    if (filtered.length === 0) {
        grid.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div><p>没有匹配的报告</p></div>';
        return;
    }

    grid.innerHTML = filtered.map(r => {
        const strategyBadge = r.strategyCategory
            ? `<span class="badge badge-strategy">${r.strategyCategory}</span>` : '';

        const metaItems = [];
        if (r.scale) metaItems.push(`💰 ${r.scale}`);
        if (r.founded) metaItems.push(`📅 ${r.founded}`);
        if (r.team) metaItems.push(`👥 ${r.team}`);

        const tagsHtml = (r.tags || []).slice(0, 5).map(t =>
            `<span class="tag">${t}</span>`).join('');

        return `
        <a class="manager-card" href="./detail.html?key=${encodeURIComponent(r.key)}">
            <div class="card-header">
                <div class="card-name">${r.name}</div>
                <div class="card-badges">${strategyBadge}</div>
            </div>
            <div class="card-meta">
                ${metaItems.map(m => `<span>${m}</span>`).join('')}
                ${r.reportDate ? `<span>📄 ${r.reportDate}</span>` : ''}
            </div>
            <div class="card-summary">${r.keyPoints || r.strategy}</div>
            <div class="card-footer">${tagsHtml}</div>
        </a>`;
    }).join('');
}

init();
