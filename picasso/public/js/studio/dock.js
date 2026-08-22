import * as store from "./store";

let root_el = null;
let drag = null;

function corner_from_point(x, y) {
	const cx = window.innerWidth / 2;
	const cy = window.innerHeight / 2;
	return (y < cy ? "t" : "b") + (x < cx ? "l" : "r");
}

function render() {
	if (root_el) root_el.remove();
	root_el = document.createElement("div");
	root_el.className = "picasso-dock";
	root_el.dataset.corner = store.get().dock_corner;
	root_el.innerHTML = `
		<button type="button" class="picasso-dock__btn" data-act="panel" title="Studio">
			<span class="picasso-dock__mark"></span>
		</button>
		<button type="button" class="picasso-dock__btn" data-act="palette" title="Command palette (Ctrl+Shift+K)">⌘</button>
		<button type="button" class="picasso-dock__btn" data-act="peek" title="Quick Look">◉</button>
	`;
	root_el.classList.toggle("is-autohide", store.feature("dock_autohide"));
	document.body.appendChild(root_el);

	root_el.addEventListener("click", (e) => {
		const btn = e.target.closest("[data-act]");
		if (!btn) return;
		const act = btn.getAttribute("data-act");
		if (act === "panel") document.dispatchEvent(new CustomEvent("picasso:open-panel"));
		if (act === "palette") document.dispatchEvent(new CustomEvent("picasso:open-palette"));
		if (act === "peek") store.set_feature("quicklook", !store.feature("quicklook"));
	});

	root_el.addEventListener("pointerdown", (e) => {
		if (e.target.closest("[data-act]") && e.shiftKey) {
			e.preventDefault();
			drag = { x: e.clientX, y: e.clientY };
			root_el.classList.add("is-dragging");
			root_el.setPointerCapture(e.pointerId);
		}
	});
	root_el.addEventListener("pointerup", (e) => {
		if (!drag) return;
		store.set({ dock_corner: corner_from_point(e.clientX, e.clientY) });
		root_el.dataset.corner = store.get().dock_corner;
		root_el.classList.remove("is-dragging");
		drag = null;
	});
}

export function init() {
	const start = () => {
		render();
		document.addEventListener(store.EVENT_NAME, () => {
			if (!root_el) return;
			root_el.dataset.corner = store.get().dock_corner;
			root_el.classList.toggle("is-autohide", store.feature("dock_autohide"));
			root_el.querySelector('[data-act="peek"]')?.classList.toggle("is-on", store.feature("quicklook"));
		});
	};
	if (document.body) start();
	else document.addEventListener("DOMContentLoaded", start);
}
