// ui/js/logsViewer.js
import {
    escapeHTML,
    paginate,
    getVisiblePages,
    debounce,
} from './utils.js';

/* ---------------- helper paginacji ---------------- */
function renderPagination(totalRows, perPage, current, container, onClick) {
    const totalPages = Math.ceil(totalRows / perPage);
    if (totalPages <= 1) return (container.innerHTML = '');

    const visible = getVisiblePages(current, totalPages);
    const btn = (p, lbl = p) =>
        `<button ${p === current ? 'class="active" disabled' : ''} data-page="${p}">${lbl}</button>`;

    let html = btn(1, '«') + btn(current - 1 < 1 ? 1 : current - 1, '‹');
    visible.forEach((p) => (html += p === '…' ? '<span class="dots">…</span>' : btn(p)));
    html += btn(current + 1 > totalPages ? totalPages : current + 1, '›') + btn(totalPages, '»');

    container.innerHTML = html;
    container
        .querySelectorAll('button[data-page]')
        .forEach((b) => b.addEventListener('click', () => onClick(Number(b.dataset.page))));
}

/* ************************************************************ */
/*             TABELA RANKINGU  (Tylko do-czytania)             */
/* ************************************************************ */
export async function renderRankingTable(endpoint, opts) {
    const { container, searchInput, pageSize = 30 } = opts;
    const tbody  = document.getElementById(container);
    const search = document.querySelector(searchInput);
    const pager  = document.getElementById('pagination');

    const res    = await fetch(endpoint);
    const { top } = await res.json();

    const rows = top.map((e, i) => ({
        place   : `#${i + 1}`,
        user    : e.user,
        points  : e.points.toString(),
        lastSeen: e.lastSeen ? new Date(e.lastSeen * 1000).toLocaleString('pl-PL') : '—',
    }));

    let currentPage = 1;
    let filtered    = rows;
    let sortKey     = 'points';
    let asc         = false;

    function applyFilter() {
        const q = search.value.toLowerCase();
        filtered = rows.filter((r) =>
            [r.user, r.points, r.lastSeen].some((v) => v.toLowerCase().includes(q)),
        );
    }

    function applySort() {
        filtered.sort((a, b) => {
            const A = isNaN(a[sortKey]) ? a[sortKey] : Number(a[sortKey]);
            const B = isNaN(b[sortKey]) ? b[sortKey] : Number(b[sortKey]);
            return asc ? A - B : B - A;
        });
    }

    function render(page = currentPage) {
        currentPage = page;
        applyFilter();
        applySort();

        const pages = paginate(filtered, pageSize);
        const view  = pages[currentPage - 1] || [];

        tbody.innerHTML =
            view.length
                ? view
                    .map(
                        (r) =>
                            `<tr>
                                <td>${r.place}</td>
                                <td>${escapeHTML(r.user)}</td>
                                <td>${r.points}</td>
                                <td>${escapeHTML(r.lastSeen)}</td>
                             </tr>`,
                    )
                    .join('')
                : '<tr><td colspan="4">Brak wyników.</td></tr>';

        renderPagination(filtered.length, pageSize, currentPage, pager, (p) => render(p));
    }

    search.addEventListener('input', debounce(() => render(1), 300));
    document.querySelectorAll('th[data-key]').forEach((th) =>
        th.addEventListener('click', () => {
            const key = th.dataset.key;
            asc = sortKey === key ? !asc : key === 'points' ? false : true;
            sortKey = key;
            render(1);
        }),
    );

    render(1);
}

/* ************************************************************ */
/*         TABELA UNIKALNIUSSÓW  (Tylko do-czytania)            */
/* ************************************************************ */
export async function renderLogTable(endpoint, opts) {
    const { container, searchInput, columns, pageSize = 30 } = opts;

    const tableBody = document.getElementById(container);
    const searchBox = document.querySelector(searchInput);
    const pager     = document.getElementById('pagination');

    const res = await fetch(endpoint);
    const data = await res.json();
    const raw  = data.uniqueLog;

    const rows = raw
        .split('\n')
        .filter(Boolean)
        .map((l) => {
            const [d, t, nick, word] = l.split('\t');
            const [day, mon, yr] = d.split('.');
            return {
                datetime: `${yr}-${mon.padStart(2, '0')}-${day.padStart(2, '0')} ${t}`,
                nick,
                message: word,
            };
        });

    let currentPage = 1;
    let filtered    = rows;

    function applyFilter() {
        const q = searchBox.value.toLowerCase();
        filtered = rows.filter((r) =>
            columns.some((c) => String(r[c]).toLowerCase().includes(q)),
        );
    }

    function render(page = currentPage) {
        currentPage = page;
        applyFilter();

        const pages = paginate(filtered, pageSize);
        const view  = pages[currentPage - 1] || [];

        tableBody.innerHTML =
            view.length
                ? view
                    .map(
                        (r) =>
                            `<tr>${columns
                                .map((c) => `<td>${escapeHTML(r[c] ?? '')}</td>`)
                                .join('')}</tr>`,
                    )
                    .join('')
                : `<tr><td colspan="${columns.length}">Brak wyników.</td></tr>`;

        renderPagination(filtered.length, pageSize, currentPage, pager, (p) => render(p));
    }

    searchBox.addEventListener('input', debounce(() => render(1), 300));
    render(1);
}
