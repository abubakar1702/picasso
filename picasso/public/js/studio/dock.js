import * as store from "./store";

const GEAR = `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
	<path fill="currentColor" d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.2 7.2 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 13.9 2h-3.8a.5.5 0 0 0-.49.42l-.36 2.54c-.6.24-1.14.55-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.48a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94L2.83 14.16a.5.5 0 0 0-.12.64l1.92 3.32c.14.24.43.34.68.22l2.39-.96c.49.39 1.03.7 1.63.94l.36 2.54c.05.24.25.42.49.42h3.8c.24 0 .44-.18.49-.42l.36-2.54c.6-.24 1.14-.55 1.63-.94l2.39.96c.25.12.54.02.68-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z"/>
</svg>`;

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
	root_el.innerHTML = `<button type="button" class="picasso-dock__gear" data-act="panel" title="Picasso settings" aria-label="Picasso settings">${GEAR}</button>`;
	root_el.classList.toggle("is-autohide", store.feature("dock_autohide"));
	document.body.appendChild(root_el);

	root_el.addEventListener("click", (e) => {
		if (!e.target.closest("[data-act]")) return;
		document.dispatchEvent(new CustomEvent("picasso:open-panel"));
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

export function set_open(on) {
	root_el?.classList.toggle("is-open", !!on);
}

export function init() {
	const start = () => {
		render();
		document.addEventListener(store.EVENT_NAME, () => {
			if (!root_el) return;
			root_el.dataset.corner = store.get().dock_corner;
			root_el.classList.toggle("is-autohide", store.feature("dock_autohide"));
		});
	};
	if (document.body) start();
	else document.addEventListener("DOMContentLoaded", start);
}
