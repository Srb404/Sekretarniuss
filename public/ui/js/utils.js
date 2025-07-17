// ui/js/utils.js
/* ***********  Uniwersalne helpery  *********** */

export const escapeHTML = (s = '') =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const pad = (n, len = 2) => n.toString().padStart(len, '0');           // NEW

export const debounce = (fn, ms = 300) => {                                   // NEW
    let id;
    return (...a) => {
        clearTimeout(id);
        id = setTimeout(() => fn(...a), ms);
    };
};

/* ---------- paginacja & numeracja stron ---------- */
export const paginate = (arr, size) =>                                         // NEW
    Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
        arr.slice(i * size, (i + 1) * size),
    );

/* zwraca listę stron lub „…” dla dużej ilości stron */
export function getVisiblePages(current, total, delta = 1) {                   // NEW
    const pages = [];
    if (total <= 7 + 2 * delta) {
        for (let i = 1; i <= total; i++) pages.push(i);
    } else {
        pages.push(1);
        if (current - delta > 2) pages.push('…');
        for (
            let i = Math.max(2, current - delta);
            i <= Math.min(total - 1, current + delta);
            i++
        )
            pages.push(i);
        if (current + delta < total - 1) pages.push('…');
        pages.push(total);
    }
    return pages;
}
