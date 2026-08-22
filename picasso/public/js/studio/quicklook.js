import * as store from "./store";

const SKIP_NAMES = new Set(["new", "view", "list", "report", "tree", "dashboard"]);
const ROUTE_RE = /\/(?:app|desk)\/([^/]+)\/([^/?#]+)/;

let tip = null;
let expanded = null;
let show_timer = null;
let hide_timer = null;
let current = null;
let pending = null;
const cache = new Map();
const silenced = [];

function is_typing(el) {
	if (!el) return false;
	const tag = (el.tagName || "").toLowerCase();
	return tag === "input" || tag === "textarea" || tag === "select" || el.isContentEditable;
}

function same_target(a, b) {
	if (!a || !b || a.kind !== b.kind) return false;
	return a.kind === "file" ? a.url === b.url : a.doctype === b.doctype && a.name === b.name;
}

function slug(value) {
	return String(value || "")
		.toLowerCase()
		.replace(/_/g, "-")
		.replace(/\s+/g, "-");
}

function doc_allowed(doctype) {
	const list = (window.frappe && frappe.boot && frappe.boot.picasso_quicklook) || [];
	if (!doctype || !list.length) return false;
	const needle = slug(doctype);
	return list.some((d) => slug(d) === needle);
}

function parse_route(href) {
	if (!href) return null;
	const m = String(href).match(ROUTE_RE);
	if (!m) return null;
	let name;
	try {
		name = decodeURIComponent(m[2]);
	} catch (e) {
		name = m[2];
	}
	if (!name || SKIP_NAMES.has(name.toLowerCase())) return null;
	return { kind: "doc", doctype: m[1], name };
}

function file_url_of(href) {
	if (!href || href.startsWith("data:")) return null;
	if (!/\/(?:private\/)?files\//.test(href)) return null;
	const raw = href.split("?")[0];
	try {
		const path = raw.startsWith("http") ? new URL(raw).pathname : raw;
		return decodeURI(path);
	} catch (e) {
		return raw;
	}
}

function in_doctype_list(node) {
	return !!node.closest(".frappe-list, .list-row-container, .list-row, .image-view-item, .image-view-container");
}

function file_from(node) {
	if (!(node instanceof Element)) node = node?.parentElement;
	if (!node) return null;
	if (!in_doctype_list(node)) return null;

	const a = node.closest("a[href]");
	const href = (a && a.getAttribute("href")) || "";
	const from_a = file_url_of(href);
	if (from_a) return { kind: "file", url: from_a };

	const img = node.closest("img") || node.querySelector?.("img") || node.closest(".image-view-item")?.querySelector("img");
	const src = img && (img.getAttribute("src") || img.src);
	const from_img = file_url_of(src);
	if (from_img) return { kind: "file", url: from_img };

	return null;
}

function list_row_from(node) {
	if (!(node instanceof Element)) node = node?.parentElement;
	if (!node) return null;
	if (!in_doctype_list(node)) return null;

	const subject = node.closest(".list-subject a[href], .image-view-item a[href]");
	const named = node.closest("a[data-doctype][data-name]");
	const a = subject || named;
	if (!a) return null;

	if (a.hasAttribute("data-filter") && !a.closest(".list-subject")) return null;

	if (a.dataset.doctype && a.dataset.name) {
		return { kind: "doc", doctype: a.dataset.doctype, name: a.dataset.name };
	}
	return parse_route(a.getAttribute("href"));
}

function target_of(node) {
	if (!node || node === document) return null;
	if (tip && node instanceof Node && tip.contains(node)) return current;
	const t = file_from(node) || list_row_from(node);
	if (t && t.kind === "doc" && !doc_allowed(t.doctype)) return null;
	return t;
}

function ensure_tip() {
	if (tip) return tip;
	tip = document.createElement("div");
	tip.className = "picasso-peek";
	tip.hidden = true;
	tip.addEventListener("pointerenter", cancel_hide);
	tip.addEventListener("pointerleave", (e) => {
		if (expanded) return;
		if (e.relatedTarget && target_of(e.relatedTarget)) return;
		schedule_hide();
	});
	document.body.appendChild(tip);
	return tip;
}

function place(e) {
	const box = ensure_tip();
	const pad = 16;
	const rect = box.getBoundingClientRect();
	let x = e.clientX + 14;
	let y = e.clientY + 14;
	if (x + rect.width > window.innerWidth - pad) x = e.clientX - rect.width - 10;
	if (y + rect.height > window.innerHeight - pad) y = e.clientY - rect.height - 10;
	box.style.left = Math.max(pad, x) + "px";
	box.style.top = Math.max(pad, y) + "px";
}

function render_payload(payload) {
	const box = ensure_tip();
	box.innerHTML = "";
	const head = document.createElement("div");
	head.className = "picasso-peek__head";
	head.textContent = payload.title || payload.name || "Preview";
	box.appendChild(head);

	if (payload.image && !payload.kind) {
		const img = document.createElement("img");
		img.className = "picasso-peek__img";
		img.src = payload.image;
		img.alt = payload.title || "";
		box.appendChild(img);
	}

	if (payload.kind === "image") {
		const img = document.createElement("img");
		img.className = "picasso-peek__img";
		img.src = payload.url;
		img.alt = payload.name || "";
		box.appendChild(img);
	} else if (payload.kind === "pdf") {
		const frame = document.createElement("iframe");
		frame.className = "picasso-peek__frame";
		frame.src = payload.url;
		frame.title = payload.name || "PDF";
		box.appendChild(frame);
	} else if (payload.kind === "video") {
		const v = document.createElement("video");
		v.className = "picasso-peek__media";
		v.src = payload.url;
		v.controls = true;
		box.appendChild(v);
	} else if (payload.kind === "audio") {
		const a = document.createElement("audio");
		a.className = "picasso-peek__media";
		a.src = payload.url;
		a.controls = true;
		box.appendChild(a);
	} else if (payload.kind === "table") {
		const tabs = document.createElement("div");
		tabs.className = "picasso-peek__tabs";
		const table = document.createElement("div");
		table.className = "picasso-peek__table";
		(payload.sheets || []).forEach((sheet, i) => {
			const t = document.createElement("button");
			t.type = "button";
			t.textContent = sheet.name;
			if (i === 0) t.classList.add("is-on");
			t.addEventListener("click", () => {
				tabs.querySelectorAll("button").forEach((b) => b.classList.remove("is-on"));
				t.classList.add("is-on");
				draw_table(table, sheet.rows);
			});
			tabs.appendChild(t);
		});
		if (payload.sheets && payload.sheets[0]) draw_table(table, payload.sheets[0].rows);
		if ((payload.sheets || []).length > 1) box.appendChild(tabs);
		box.appendChild(table);
	} else if (payload.fields) {
		const dl = document.createElement("dl");
		dl.className = "picasso-peek__fields";
		payload.fields.forEach((f) => {
			const dt = document.createElement("dt");
			dt.textContent = f.label;
			const dd = document.createElement("dd");
			dd.textContent = f.value;
			dl.append(dt, dd);
		});
		box.appendChild(dl);
	} else {
		const p = document.createElement("p");
		p.className = "picasso-peek__note";
		p.textContent = payload.error || "Open to view this file.";
		box.appendChild(p);
	}

	const foot = document.createElement("div");
	foot.className = "picasso-peek__foot";
	foot.textContent = expanded ? "Esc to close" : "Space to open · Esc to dismiss";
	box.appendChild(foot);
}

function draw_table(host, rows) {
	host.innerHTML = "";
	const table = document.createElement("table");
	(rows || []).forEach((row, i) => {
		const tr = document.createElement("tr");
		row.forEach((cell) => {
			const cell_el = document.createElement(i === 0 ? "th" : "td");
			cell_el.textContent = cell;
			tr.appendChild(cell_el);
		});
		table.appendChild(tr);
	});
	host.appendChild(table);
}

function cache_key(target) {
	return target.kind === "file" ? target.url : target.doctype + "/" + target.name;
}

async function load(target) {
	const key = cache_key(target);
	if (cache.has(key)) return cache.get(key);
	const promise =
		target.kind === "file"
			? frappe
					.call({
						method: "picasso.appearance.peek_file",
						args: { file_url: target.url },
						freeze: false,
					})
					.then((r) => r.message)
			: frappe
					.call({
						method: "picasso.appearance.peek_doc",
						args: { doctype: target.doctype, name: target.name },
						freeze: false,
					})
					.then((r) => r.message);
	cache.set(key, promise);
	return promise;
}

function hide_bootstrap_tooltip(el) {
	if (!window.jQuery) return;
	const $el = window.jQuery(el);
	if (!$el.data("bs.tooltip") && $el.attr("data-toggle") !== "tooltip") return;
	try {
		$el.tooltip("hide");
		$el.tooltip("disable");
	} catch (e) {
		/* ignore */
	}
}

function silence_titles(node) {
	restore_titles();
	let el = node instanceof Element ? node : node?.parentElement;
	while (el && el !== document.body && el !== document.documentElement) {
		const title = el.getAttribute("title");
		if (title) {
			silenced.push({ el, title });
			el.removeAttribute("title");
			if (!el.getAttribute("aria-label")) el.setAttribute("aria-label", title);
		}
		hide_bootstrap_tooltip(el);
		el = el.parentElement;
	}
	document.querySelectorAll(".tooltip.show, .tooltip.in").forEach((pop) => {
		pop.classList.remove("show", "in");
		pop.style.display = "none";
	});
}

function restore_titles() {
	silenced.forEach(({ el, title }) => {
		if (!el.isConnected) return;
		if (!el.getAttribute("title")) el.setAttribute("title", title);
		if (window.jQuery) {
			try {
				window.jQuery(el).tooltip("enable");
			} catch (e) {
				/* ignore */
			}
		}
	});
	silenced.length = 0;
}

function cancel_hide() {
	clearTimeout(hide_timer);
	hide_timer = null;
}

function schedule_hide() {
	if (expanded) return;
	clearTimeout(hide_timer);
	hide_timer = setTimeout(hide, 180);
}

function hide() {
	clearTimeout(show_timer);
	clearTimeout(hide_timer);
	pending = null;
	current = null;
	restore_titles();
	if (tip && !expanded) {
		tip.hidden = true;
		tip.innerHTML = "";
	}
}

function expand() {
	if (!tip || tip.hidden) return;
	expanded = true;
	cancel_hide();
	tip.classList.add("is-expanded");
	tip.hidden = false;
	render_payload_foot();
}

function render_payload_foot() {
	const foot = tip?.querySelector(".picasso-peek__foot");
	if (foot) foot.textContent = expanded ? "Esc to close" : "Space to open · Esc to dismiss";
}

function collapse() {
	expanded = false;
	if (tip) {
		tip.classList.remove("is-expanded");
		tip.hidden = true;
		tip.innerHTML = "";
	}
	current = null;
	pending = null;
	restore_titles();
}

async function show(target, point) {
	current = target;
	try {
		const payload = await load(target);
		if (!same_target(current, target)) return;
		if (!payload) {
			hide();
			return;
		}
		render_payload(payload);
		ensure_tip().hidden = false;
		place(point);
	} catch (err) {
		cache.delete(cache_key(target));
		if (!same_target(current, target)) return;
		render_payload({
			title: target.name || "Preview",
			error: (err && err.message) || "Could not preview this item.",
		});
		ensure_tip().hidden = false;
		place(point);
	}
}

export function init() {
	document.addEventListener("pointerover", (e) => {
		if (!store.feature("quicklook") || expanded) return;
		if (e.target instanceof Element && e.target.closest(".picasso-panel, .picasso-palette, .picasso-dock")) {
			return;
		}
		const t = target_of(e.target);
		if (!t) return;
		if (!silenced.length || !same_target(t, current || pending)) {
			silence_titles(e.target);
		}
		cancel_hide();
		if (same_target(t, current) && tip && !tip.hidden) return;
		if (same_target(t, pending)) return;
		pending = t;
		clearTimeout(show_timer);
		const point = { clientX: e.clientX, clientY: e.clientY };
		show_timer = setTimeout(() => show(t, point), 240);
	});
	document.addEventListener("pointermove", (e) => {
		if (tip && !tip.hidden && !expanded) place(e);
	});
	document.addEventListener("pointerout", (e) => {
		if (expanded) return;
		const next = e.relatedTarget;
		if (next && tip?.contains(next)) return;
		if (next && same_target(target_of(next), current || pending)) return;
		if (pending || (tip && !tip.hidden)) schedule_hide();
	});
	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape") {
			if (expanded || (tip && !tip.hidden)) {
				e.preventDefault();
				collapse();
			}
			return;
		}
		if (e.key !== " " && e.code !== "Space") return;
		if (!store.feature("quicklook")) return;
		if (tip && !tip.hidden) {
			e.preventDefault();
			expand();
			return;
		}
		if (is_typing(e.target)) return;
		const t = target_of(document.activeElement);
		if (!t) return;
		e.preventDefault();
		show(t, { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 }).then(expand);
	});
	document.addEventListener(store.EVENT_NAME, () => {
		if (!store.feature("quicklook")) {
			collapse();
		}
	});
}
