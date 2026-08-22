import * as store from "./store";
import { set_open as set_dock_open } from "./dock";

let overlay = null;

const GROUPS = [
	{
		title: "Motion & chrome",
		keys: [
			"page_transitions",
			"progress_bar",
			"ripple",
			"reveal",
			"tilt",
			"condensed_header",
			"back_to_top",
			"signin_entrance",
		],
	},
	{
		title: "Feedback",
		keys: ["counters", "toast_timers", "save_pulse"],
	},
	{
		title: "Tools",
		keys: ["palette", "quicklook", "charts"],
	},
	{
		title: "Look",
		keys: ["cards", "app_icons", "gradients", "dock_autohide"],
	},
];

function el(html) {
	const wrap = document.createElement("div");
	wrap.innerHTML = html.trim();
	return wrap.firstElementChild;
}

function feat_map() {
	const map = {};
	store.FEATURES.forEach((f) => {
		map[f.key] = f;
	});
	return map;
}

function build() {
	const s = store.get();
	const reduced = store.prefers_reduced_motion();
	const feats = feat_map();
	const box = el(`<div class="picasso-panel" role="dialog" aria-label="Picasso settings"></div>`);

	box.appendChild(
		el(`<div class="picasso-panel__head">
			<div class="picasso-panel__brand">
				<span class="picasso-panel__gear" aria-hidden="true"></span>
				<div>
					<div class="picasso-panel__title">Settings</div>
					<div class="picasso-panel__sub">Your desk · site brand stays in Desk Settings</div>
				</div>
			</div>
			<button type="button" class="picasso-panel__close" aria-label="Close">✕</button>
		</div>`)
	);
	box.querySelector(".picasso-panel__gear").innerHTML =
		`<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.2 7.2 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 13.9 2h-3.8a.5.5 0 0 0-.49.42l-.36 2.54c-.6.24-1.14.55-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.48a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94L2.83 14.16a.5.5 0 0 0-.12.64l1.92 3.32c.14.24.43.34.68.22l2.39-.96c.49.39 1.03.7 1.63.94l.36 2.54c.05.24.25.42.49.42h3.8c.24 0 .44-.18.49-.42l.36-2.54c.6-.24 1.14-.55 1.63-.94l2.39.96c.25.12.54.02.68-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z"/></svg>`;

	const actions = el(`<div class="picasso-panel__actions" data-filter="palette command quick look peek">
		<button type="button" class="picasso-panel__action" data-open-palette>
			<span>Command palette</span>
			<kbd>Ctrl+Shift+K</kbd>
		</button>
		<button type="button" class="picasso-panel__action ${s.features.quicklook !== false ? "is-on" : ""}" data-toggle-peek>
			<span>Quick Look</span>
			<small>${s.features.quicklook !== false ? "On" : "Off"}</small>
		</button>
	</div>`);

	const search = el(`<input class="picasso-panel__search" type="search" placeholder="Search settings…" />`);
	const body = el(`<div class="picasso-panel__body"></div>`);

	const look = el(`<div class="picasso-panel__card" data-filter="density compact cozy roomy motion accent toast">
		<div class="picasso-panel__label">Appearance</div>
		<div class="picasso-panel__field">
			<span>Density</span>
			<div class="picasso-panel__seg" data-field="density"></div>
		</div>
		<div class="picasso-panel__field">
			<span>Motion ${reduced ? "· reduced" : ""}</span>
			<div class="picasso-panel__seg" data-field="motion"></div>
		</div>
		<div class="picasso-panel__field">
			<span>Your accent</span>
			<div class="picasso-panel__row">
				<input type="color" class="picasso-panel__color" value="${s.accent || "#2563eb"}" />
				<button type="button" class="picasso-panel__textbtn" data-reset-accent>Site brand</button>
			</div>
		</div>
		<div class="picasso-panel__field">
			<span>Toasts</span>
			<select class="picasso-panel__select" data-field="toast_position"></select>
		</div>
	</div>`);
	["compact", "cozy", "roomy"].forEach((d) => {
		const b = el(`<button type="button" data-val="${d}">${d}</button>`);
		if (s.density === d) b.classList.add("is-on");
		look.querySelector("[data-field='density']").appendChild(b);
	});
	["on", "off"].forEach((d) => {
		const b = el(`<button type="button" data-val="${d}">${d}</button>`);
		if (s.motion === d) b.classList.add("is-on");
		look.querySelector("[data-field='motion']").appendChild(b);
	});
	["top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right"].forEach((p) => {
		const opt = document.createElement("option");
		opt.value = p;
		opt.textContent = p.replace("-", " ");
		if (s.toast_position === p) opt.selected = true;
		look.querySelector("select").appendChild(opt);
	});

	body.appendChild(look);

	GROUPS.forEach((group) => {
		const card = el(`<div class="picasso-panel__card"></div>`);
		const title = el(`<div class="picasso-panel__label"></div>`);
		title.textContent = group.title;
		card.appendChild(title);
		group.keys.forEach((key) => {
			const f = feats[key];
			if (!f) return;
			const row = el(`<label class="picasso-panel__feat" data-filter="${f.key} ${f.label} ${f.hint}">
				<span>
					<strong></strong>
					<small></small>
				</span>
				<span class="picasso-switch">
					<input type="checkbox" />
					<span class="picasso-switch__track"></span>
				</span>
			</label>`);
			row.querySelector("strong").textContent = f.label;
			row.querySelector("small").textContent = f.hint;
			const input = row.querySelector("input");
			input.checked = s.features[f.key] !== false;
			input.dataset.feat = f.key;
			card.appendChild(row);
		});
		body.appendChild(card);
	});

	box.append(actions, search, body);
	return box;
}

function bind(box) {
	box.querySelector(".picasso-panel__close").addEventListener("click", close);
	box.querySelector("[data-open-palette]").addEventListener("click", () => {
		close();
		document.dispatchEvent(new CustomEvent("picasso:open-palette"));
	});
	box.querySelector("[data-toggle-peek]").addEventListener("click", (e) => {
		const on = !store.feature("quicklook");
		store.set_feature("quicklook", on);
		const btn = e.currentTarget;
		btn.classList.toggle("is-on", on);
		btn.querySelector("small").textContent = on ? "On" : "Off";
	});
	box.querySelector("[data-field='density']").addEventListener("click", (e) => {
		const val = e.target.getAttribute("data-val");
		if (val) store.set({ density: val });
		refresh_seg(box, "density", val);
	});
	box.querySelector("[data-field='motion']").addEventListener("click", (e) => {
		const val = e.target.getAttribute("data-val");
		if (val) store.set({ motion: val });
		refresh_seg(box, "motion", val);
	});
	box.querySelector(".picasso-panel__color").addEventListener("input", (e) => {
		store.set({ accent: e.target.value });
	});
	box.querySelector("[data-reset-accent]").addEventListener("click", () => {
		store.set({ accent: "" });
		location.reload();
	});
	box.querySelector("[data-field='toast_position']").addEventListener("change", (e) => {
		store.set({ toast_position: e.target.value });
	});
	box.querySelectorAll("[data-feat]").forEach((input) => {
		input.addEventListener("change", () => store.set_feature(input.dataset.feat, input.checked));
	});
	box.querySelector(".picasso-panel__search").addEventListener("input", (e) => {
		const q = e.target.value.toLowerCase().trim();
		box.querySelectorAll("[data-filter]").forEach((node) => {
			node.style.display = !q || node.getAttribute("data-filter").toLowerCase().includes(q) ? "" : "none";
		});
		box.querySelectorAll(".picasso-panel__card").forEach((card) => {
			const visible = [...card.querySelectorAll("[data-filter], .picasso-panel__field")].some(
				(n) => n.style.display !== "none"
			);
			const hasFilterKids = card.querySelector("[data-filter]");
			if (hasFilterKids) card.style.display = !q || visible ? "" : "none";
		});
	});
}

function refresh_seg(box, field, val) {
	box.querySelectorAll(`[data-field="${field}"] button`).forEach((b) => {
		b.classList.toggle("is-on", b.getAttribute("data-val") === val);
	});
}

export function open() {
	close();
	overlay = el(`<div class="picasso-panel-overlay"></div>`);
	const box = build();
	bind(box);
	overlay.appendChild(box);
	overlay.addEventListener("click", (e) => {
		if (e.target === overlay) close();
	});
	document.body.appendChild(overlay);
	set_dock_open(true);
	box.querySelector(".picasso-panel__search").focus();
}

export function close() {
	if (overlay) {
		overlay.remove();
		overlay = null;
	}
	set_dock_open(false);
}

export function init() {
	document.addEventListener("picasso:open-panel", open);
	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape" && overlay) {
			e.preventDefault();
			close();
		}
		if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === ",") {
			e.preventDefault();
			overlay ? close() : open();
		}
	});
}
