import * as store from "./store";

let overlay = null;

function el(html) {
	const wrap = document.createElement("div");
	wrap.innerHTML = html.trim();
	return wrap.firstElementChild;
}

function build() {
	const s = store.get();
	const reduced = store.prefers_reduced_motion();
	const box = el(`<div class="picasso-panel" role="dialog" aria-label="Picasso Studio"></div>`);
	const head = el(`<div class="picasso-panel__head">
		<div>
			<div class="picasso-panel__title">Studio</div>
			<div class="picasso-panel__sub">Your desk. Brand stays site-wide.</div>
		</div>
		<button type="button" class="picasso-panel__close" aria-label="Close">✕</button>
	</div>`);
	const search = el(`<input class="picasso-panel__search" type="search" placeholder="Filter controls…" />`);
	const body = el(`<div class="picasso-panel__body"></div>`);

	const dens = el(`<div class="picasso-panel__block" data-filter="density compact cozy roomy">
		<div class="picasso-panel__label">Density</div>
		<div class="picasso-panel__seg" data-field="density"></div>
	</div>`);
	["compact", "cozy", "roomy"].forEach((d) => {
		const b = el(`<button type="button" data-val="${d}">${d}</button>`);
		if (s.density === d) b.classList.add("is-on");
		dens.querySelector(".picasso-panel__seg").appendChild(b);
	});

	const motion = el(`<div class="picasso-panel__block" data-filter="motion reduce">
		<div class="picasso-panel__label">Motion ${reduced ? "· system reduce is on" : ""}</div>
		<div class="picasso-panel__seg" data-field="motion"></div>
	</div>`);
	["on", "off"].forEach((d) => {
		const b = el(`<button type="button" data-val="${d}">${d}</button>`);
		if (s.motion === d) b.classList.add("is-on");
		motion.querySelector(".picasso-panel__seg").appendChild(b);
	});

	const accent = el(`<div class="picasso-panel__block" data-filter="accent colour color">
		<div class="picasso-panel__label">Your accent (optional)</div>
		<div class="picasso-panel__row">
			<input type="color" class="picasso-panel__color" value="${s.accent || "#2563eb"}" />
			<button type="button" class="picasso-panel__textbtn" data-reset-accent>Use site brand</button>
		</div>
	</div>`);

	const toast = el(`<div class="picasso-panel__block" data-filter="toast alert">
		<div class="picasso-panel__label">Toasts</div>
		<select class="picasso-panel__select" data-field="toast_position"></select>
	</div>`);
	["top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right"].forEach((p) => {
		const opt = document.createElement("option");
		opt.value = p;
		opt.textContent = p.replace("-", " ");
		if (s.toast_position === p) opt.selected = true;
		toast.querySelector("select").appendChild(opt);
	});

	const feats = el(`<div class="picasso-panel__feats"></div>`);
	store.FEATURES.forEach((f) => {
		const row = el(`<label class="picasso-panel__feat" data-filter="${f.key} ${f.label} ${f.hint}">
			<span>
				<strong></strong>
				<small></small>
			</span>
			<input type="checkbox" />
		</label>`);
		row.querySelector("strong").textContent = f.label;
		row.querySelector("small").textContent = f.hint;
		row.querySelector("input").checked = s.features[f.key] !== false;
		row.querySelector("input").dataset.feat = f.key;
		feats.appendChild(row);
	});

	body.append(dens, motion, accent, toast, feats);
	box.append(head, search, body);
	return box;
}

function bind(box) {
	box.querySelector(".picasso-panel__close").addEventListener("click", close);
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
	box.querySelector(".picasso-panel__search").focus();
}

export function close() {
	if (overlay) {
		overlay.remove();
		overlay = null;
	}
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
