import * as store from "./store";

let tip = null;
let expanded = null;
let timer = null;
let current = null;
const cache = new Map();

function is_typing(el) {
	if (!el) return false;
	const tag = (el.tagName || "").toLowerCase();
	return tag === "input" || tag === "textarea" || tag === "select" || el.isContentEditable;
}

function file_from(node) {
	const a = node.closest("a");
	const href = (a && a.getAttribute("href")) || node.getAttribute("src") || "";
	if (/\/(?:private\/)?files\//.test(href)) {
		return { kind: "file", url: href.split("?")[0] };
	}
	const img = node.closest(".image-view-item")?.querySelector("img");
	if (img && img.src) return { kind: "file", url: img.getAttribute("src") };
	return null;
}

function link_from(node) {
	const a = node.closest("a");
	const href = (a && a.getAttribute("href")) || "";
	const m = href.match(/\/app\/([^/]+)\/([^/?#]+)/);
	if (!m) return null;
	const name = decodeURIComponent(m[2]);
	if (!name || name === "new") return null;
	return { kind: "doc", doctype: m[1], name };
}

function target_of(node) {
	return file_from(node) || link_from(node);
}

function ensure_tip() {
	if (tip) return tip;
	tip = document.createElement("div");
	tip.className = "picasso-peek";
	tip.hidden = true;
	document.body.appendChild(tip);
	return tip;
}

function place(e) {
	const box = ensure_tip();
	const pad = 16;
	const rect = box.getBoundingClientRect();
	let x = e.clientX + 18;
	let y = e.clientY + 18;
	if (x + rect.width > window.innerWidth - pad) x = e.clientX - rect.width - 12;
	if (y + rect.height > window.innerHeight - pad) y = e.clientY - rect.height - 12;
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
		p.textContent = "Open to view this file.";
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

async function load(target) {
	const key = target.kind === "file" ? target.url : target.doctype + "/" + target.name;
	if (cache.has(key)) return cache.get(key);
	const promise =
		target.kind === "file"
			? frappe.call({
					method: "picasso.appearance.peek_file",
					args: { file_url: target.url },
					freeze: false,
				}).then((r) => r.message)
			: frappe.call({
					method: "picasso.appearance.peek_doc",
					args: { doctype: target.doctype, name: target.name },
					freeze: false,
				}).then((r) => r.message);
	cache.set(key, promise);
	return promise;
}

function hide() {
	clearTimeout(timer);
	current = null;
	if (tip && !expanded) {
		tip.hidden = true;
		tip.innerHTML = "";
	}
}

function expand() {
	if (!tip || tip.hidden) return;
	expanded = true;
	tip.classList.add("is-expanded");
	tip.hidden = false;
}

function collapse() {
	expanded = false;
	if (tip) {
		tip.classList.remove("is-expanded");
		tip.hidden = true;
		tip.innerHTML = "";
	}
	current = null;
}

export function init() {
	document.addEventListener("pointerover", (e) => {
		if (!store.feature("quicklook") || expanded) return;
		const t = target_of(e.target);
		if (!t) return;
		clearTimeout(timer);
		timer = setTimeout(async () => {
			current = t;
			try {
				const payload = await load(t);
				if (current !== t) return;
				render_payload(payload);
				ensure_tip().hidden = false;
				place(e);
			} catch (err) {
				cache.delete(t.kind === "file" ? t.url : t.doctype + "/" + t.name);
			}
		}, 240);
	});
	document.addEventListener("pointermove", (e) => {
		if (tip && !tip.hidden && !expanded) place(e);
	});
	document.addEventListener("pointerout", (e) => {
		if (expanded) return;
		if (e.relatedTarget && (tip?.contains(e.relatedTarget) || target_of(e.relatedTarget))) return;
		hide();
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
		if (is_typing(e.target)) return;
		if (!store.feature("quicklook")) return;
		if (tip && !tip.hidden) {
			e.preventDefault();
			expand();
			return;
		}
		const t = target_of(document.activeElement);
		if (!t) return;
		e.preventDefault();
		load(t).then((payload) => {
			current = t;
			render_payload(payload);
			ensure_tip().hidden = false;
			expand();
		});
	});
}
