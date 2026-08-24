import * as store from "./store";
import { list as recent_list } from "./recents";

let overlay = null;
let items = [];
let active = 0;

function fuzzy(hay, needle) {
	hay = (hay || "").toLowerCase();
	needle = (needle || "").toLowerCase().trim();
	if (!needle) return 1;
	let i = 0;
	for (const ch of needle) {
		i = hay.indexOf(ch, i);
		if (i < 0) return 0;
		i += 1;
	}
	return needle.length / (hay.length + 1);
}

function collect(query) {
	const out = [];
	out.push({
		id: "studio",
		title: "Open Studio",
		hint: "Appearance and motion",
		run: () => document.dispatchEvent(new CustomEvent("picasso:open-panel")),
	});
	store.FEATURES.forEach((f) => {
		const on = store.feature(f.key);
		out.push({
			id: "feat-" + f.key,
			title: f.label,
			hint: f.hint,
			kind: "toggle",
			on,
			run: () => store.set_feature(f.key, !on),
		});
	});
	recent_list().forEach((r) => {
		out.push({
			id: "recent-" + r.route,
			title: r.title,
			hint: r.route,
			run: () => frappe.set_route(r.route.split("/")),
		});
	});
	if (frappe.boot && Array.isArray(frappe.boot.allowed_workspaces)) {
		frappe.boot.allowed_workspaces.slice(0, 20).forEach((ws) => {
			out.push({
				id: "ws-" + ws.name,
				title: ws.title || ws.name,
				hint: "Workspace",
				run: () => frappe.set_route("Workspaces", ws.name),
			});
		});
	}
	if (frappe.user && frappe.user.has_role && frappe.user.has_role("System Manager")) {
		out.push({
			id: "desk-settings",
			title: "Picasso Desk Settings",
			hint: "Site brand colours",
			run: () => frappe.set_route("Form", "Picasso Desk Settings"),
		});
	}

	return out
		.map((item) => ({ ...item, score: fuzzy(item.title + " " + item.hint, query) }))
		.filter((item) => item.score > 0)
		.sort((a, b) => b.score - a.score)
		.slice(0, 12);
}

function paint() {
	if (!overlay) return;
	const list = overlay.querySelector(".picasso-palette__list");
	list.innerHTML = "";
	items.forEach((item, i) => {
		const row = document.createElement("button");
		row.type = "button";
		row.className =
			"picasso-palette__item" +
			(i === active ? " is-active" : "") +
			(item.kind === "toggle" ? " is-toggle" : "") +
			(item.on ? " is-on" : "");
		row.innerHTML = `<span class="picasso-palette__copy"><strong></strong><small></small></span>`;
		row.querySelector("strong").textContent = item.title;
		row.querySelector("small").textContent = item.hint || "";
		if (item.kind === "toggle") {
			const mark = document.createElement("span");
			mark.className = "picasso-palette__mark";
			mark.setAttribute("aria-hidden", "true");
			row.appendChild(mark);
		}
		row.addEventListener("click", () => run(item));
		list.appendChild(row);
	});
}

function run(item) {
	try {
		item.run();
	} catch (e) {
		console.error(e);
	}
	if (item.kind === "toggle" && overlay) {
		const q = overlay.querySelector("input")?.value || "";
		items = collect(q);
		paint();
		return;
	}
	close();
}

export function open() {
	if (!store.feature("palette")) return;
	close();
	overlay = document.createElement("div");
	overlay.className = "picasso-palette-overlay";
	overlay.innerHTML = `
		<div class="picasso-palette" role="dialog" aria-label="Command palette">
			<input class="picasso-palette__input" type="search" placeholder="Jump, toggle, or go…" />
			<div class="picasso-palette__list"></div>
			<div class="picasso-palette__foot">Ctrl+Shift+K · Esc</div>
		</div>
	`;
	document.body.appendChild(overlay);
	const input = overlay.querySelector("input");
	items = collect("");
	active = 0;
	paint();
	input.focus();
	input.addEventListener("input", () => {
		items = collect(input.value);
		active = 0;
		paint();
	});
	overlay.addEventListener("click", (e) => {
		if (e.target === overlay) close();
	});
}

export function close() {
	if (overlay) {
		overlay.remove();
		overlay = null;
	}
}

export function init() {
	document.addEventListener("picasso:open-palette", open);
	document.addEventListener("keydown", (e) => {
		if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "K" || e.key === "k")) {
			e.preventDefault();
			overlay ? close() : open();
			return;
		}
		if (!overlay) return;
		if (e.key === "Escape") {
			e.preventDefault();
			close();
		}
		if (e.key === "ArrowDown") {
			e.preventDefault();
			active = Math.min(items.length - 1, active + 1);
			paint();
		}
		if (e.key === "ArrowUp") {
			e.preventDefault();
			active = Math.max(0, active - 1);
			paint();
		}
		if (e.key === "Enter" && items[active]) {
			e.preventDefault();
			run(items[active]);
		}
	});
}
