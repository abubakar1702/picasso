import * as store from "./store";

function can(flag) {
	return store.motion_on() && store.feature(flag);
}

function start_progress() {
	if (!can("progress_bar")) return;
	let bar = document.querySelector(".picasso-progress");
	if (!bar) {
		bar = document.createElement("div");
		bar.className = "picasso-progress";
		document.body.appendChild(bar);
	}
	bar.classList.add("is-on");
}

function stop_progress() {
	const bar = document.querySelector(".picasso-progress");
	if (bar) {
		bar.classList.add("is-done");
		setTimeout(() => bar.remove(), 280);
	}
}

function init_progress() {
	$(document).on("ajaxStart", start_progress);
	$(document).on("ajaxStop", stop_progress);
	$(document).on("page-change", () => {
		start_progress();
		setTimeout(stop_progress, 420);
	});
}

function init_ripple() {
	document.addEventListener(
		"pointerdown",
		(e) => {
			if (!can("ripple")) return;
			if (e.pointerType === "mouse" && e.button !== 0) return;
			const btn = e.target.closest(
				".btn, .primary-action, .icon-btn, .picasso-dock__gear, .picasso-panel__close, .picasso-panel__action, .picasso-palette__item"
			);
			if (!btn || btn.disabled || btn.classList.contains("disabled") || btn.getAttribute("aria-disabled") === "true") {
				return;
			}

			const rect = btn.getBoundingClientRect();
			if (!rect.width || !rect.height) return;
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;
			const radius = Math.hypot(Math.max(x, rect.width - x), Math.max(y, rect.height - y));
			const diameter = Math.max(24, radius * 2);

			const ink = document.createElement("span");
			ink.className = "picasso-ink";
			ink.style.left = `${x}px`;
			ink.style.top = `${y}px`;
			ink.style.width = `${diameter}px`;
			ink.style.height = `${diameter}px`;
			ink.style.marginLeft = `${-diameter / 2}px`;
			ink.style.marginTop = `${-diameter / 2}px`;

			btn.classList.add("picasso-ripple-host");
			btn.appendChild(ink);
			const cleanup = () => ink.remove();
			ink.addEventListener("animationend", cleanup, { once: true });
			setTimeout(cleanup, 700);
		},
		{ passive: true }
	);
}

function init_reveal() {
	const ROW_SEL =
		".frappe-list .list-row-container, .result .list-row-container, .list-view-container .list-row-container";

	const collect_rows = () => {
		const rows = [...document.querySelectorAll(ROW_SEL)];
		if (rows.length) return rows;
		return [...document.querySelectorAll(".frappe-list .list-row")].filter(
			(n) => !n.closest(".list-row-container")
		);
	};

	const watch = () => {
		if (!can("reveal")) return;
		let batch = 0;
		collect_rows().forEach((row) => {
			if (row.dataset.picassoReveal === "1") return;
			row.dataset.picassoReveal = "1";
			row.style.setProperty("--picasso-reveal-i", String(batch));
			batch += 1;
			row.classList.add("picasso-revealed");
		});
	};

	let scheduled = false;
	const schedule = () => {
		if (scheduled) return;
		scheduled = true;
		requestAnimationFrame(() => {
			scheduled = false;
			watch();
		});
	};

	if (window.jQuery) {
		$(document).on("page-change app_ready", schedule);
	}
	const mo = new MutationObserver(schedule);
	const start = () => {
		watch();
		const host =
			document.querySelector(".main-section, .page-container, .layout-main-section") || document.body;
		if (host) mo.observe(host, { childList: true, subtree: true });
	};
	if (document.body) start();
	else document.addEventListener("DOMContentLoaded", start);
}

function desk_scroller() {
	const main = document.querySelector(".main-section");
	if (main) return main;
	return document.scrollingElement || document.documentElement;
}

function is_window_scroller(el) {
	return !el || el === document.documentElement || el === document.body || el === document.scrollingElement;
}

function scroll_y(el) {
	if (is_window_scroller(el)) return window.scrollY || document.documentElement.scrollTop || 0;
	return el.scrollTop || 0;
}

function scroll_max(el) {
	if (is_window_scroller(el)) {
		return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
	}
	return Math.max(0, el.scrollHeight - el.clientHeight);
}

function scroll_to_top(el) {
	const behavior = store.motion_on() ? "smooth" : "auto";
	if (is_window_scroller(el) || typeof el.scrollTo !== "function") {
		window.scrollTo({ top: 0, behavior });
		return;
	}
	el.scrollTo({ top: 0, behavior });
}

function init_top() {
	let btn = document.querySelector(".picasso-top");
	if (!btn) {
		btn = document.createElement("button");
		btn.type = "button";
		btn.className = "picasso-top";
		btn.title = "Back to top";
		btn.setAttribute("aria-label", "Back to top");
		btn.innerHTML = `<svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15" /><circle class="picasso-top__ring" cx="18" cy="18" r="15" /></svg><span>↑</span>`;
		btn.addEventListener("click", () => scroll_to_top(desk_scroller()));
		document.body.appendChild(btn);
	}
	const ring = btn.querySelector(".picasso-top__ring");
	const circ = 2 * Math.PI * 15;
	if (ring) {
		ring.style.strokeDasharray = String(circ);
		ring.style.strokeDashoffset = String(circ);
	}
	const update = () => {
		const scroller = desk_scroller();
		const y = scroll_y(scroller);
		const show = store.feature("back_to_top") && y > 240;
		btn.classList.toggle("is-on", show);
		btn.setAttribute("aria-hidden", show ? "false" : "true");
		const max = scroll_max(scroller);
		const p = max > 0 ? Math.min(1, y / max) : 0;
		if (ring) ring.style.strokeDashoffset = String(circ * (1 - p));
	};
	window.addEventListener("scroll", update, { passive: true });
	document.addEventListener("scroll", update, { passive: true, capture: true });
	document.addEventListener(store.EVENT_NAME, update);
	if (window.jQuery) {
		$(document).on("page-change", () => setTimeout(update, 120));
	}
	update();
}

function init_toasts() {
	if (!window.frappe || !frappe.show_alert) return;
	if (frappe.show_alert._picasso_wrapped) return;
	const orig = frappe.show_alert;
	const wrapped = function (message, seconds = 7, actions = {}) {
		const res = orig.call(this, message, seconds, actions);
		if (!store.feature("toast_timers") || !res) return res;
		const el = res.jquery ? res[0] : res;
		if (el && el instanceof Element && !el.querySelector(".picasso-toast-bar")) {
			el.classList.add("picasso-toast");
			const bar = document.createElement("div");
			bar.className = "picasso-toast-bar";
			bar.style.animationDuration = (seconds || 7) + "s";
			el.appendChild(bar);
		}
		return res;
	};
	wrapped._picasso_wrapped = true;
	frappe.show_alert = frappe.toast = wrapped;
}

function init_save() {
	const pulse = () => {
		if (!store.feature("save_pulse")) return;
		document.querySelectorAll(".form-status, .indicator-pill, .page-head .indicator, .page-actions .primary-action").forEach((n) => {
			n.classList.remove("picasso-save-pulse");
			void n.offsetWidth;
			n.classList.add("picasso-save-pulse");
		});
	};
	if (window.jQuery) {
		$(document).on("form-saved after_save frappe:form-saved", pulse);
	}
}

export function init() {
	init_progress();
	init_ripple();
	init_reveal();
	init_top();
	init_toasts();
	init_save();
}
