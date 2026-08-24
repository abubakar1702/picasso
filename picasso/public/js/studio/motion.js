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
	if (!("IntersectionObserver" in window)) return;
	const io = new IntersectionObserver(
		(entries) => {
			entries.forEach((en) => {
				if (en.isIntersecting) en.target.classList.add("picasso-revealed");
			});
		},
		{ rootMargin: "80px", threshold: 0.01 }
	);
	const watch = () => {
		if (!store.feature("reveal")) return;
		document.querySelectorAll(".list-row-container, .list-row, .widget, .shortcut-widget-box, .number-card-widget").forEach((n) => io.observe(n));
	};
	$(document).on("page-change", () => setTimeout(watch, 200));
	let mo_timer = null;
	const mo = new MutationObserver(() => {
		clearTimeout(mo_timer);
		mo_timer = setTimeout(watch, 80);
	});
	const start = () => {
		watch();
		const host = document.querySelector(".main-section, .page-container, .layout-main-section") || document.body;
		if (host) mo.observe(host, { childList: true, subtree: true });
	};
	if (document.body) start();
	else document.addEventListener("DOMContentLoaded", start);
}

function parse_number(text) {
	const n = Number(String(text).replace(/,/g, "").replace(/[^\d.-]/g, ""));
	return Number.isFinite(n) ? n : null;
}

function init_counters() {
	const run = () => {
		if (!can("counters")) return;
		const selectors = ".widget .number, .number-card-widget .number, .number-card-number, .number-card .number, .widget-content .number, .number-widget-box .number";
		document.querySelectorAll(selectors).forEach((node) => {
			if (node.dataset.picassoCounted) return;
			const raw = node.textContent;
			const n = parse_number(raw);
			if (n === null) return;
			node.dataset.picassoCounted = "1";
			const suffix = raw.replace(/[\d,.\s-]/g, "");
			const start = performance.now();
			const dur = 520;
			const step = (t) => {
				const p = Math.min(1, (t - start) / dur);
				const eased = 1 - Math.pow(1 - p, 3);
				node.textContent = Math.round(n * eased).toLocaleString() + suffix;
				if (p < 1) requestAnimationFrame(step);
			};
			requestAnimationFrame(step);
		});
	};
	if (window.jQuery) {
		$(document).on("page-change app_ready ajaxComplete", () => setTimeout(run, 150));
	}
	run();
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

function init_header() {
	const on_scroll = () => {
		if (!store.feature("condensed_header")) {
			document.documentElement.classList.remove("picasso-head-condensed");
			return;
		}
		const y = scroll_y(desk_scroller());
		document.documentElement.classList.toggle("picasso-head-condensed", y > 36);
	};
	window.addEventListener("scroll", on_scroll, { passive: true });
	document.addEventListener("scroll", on_scroll, { passive: true, capture: true });
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
	init_counters();
	init_header();
	init_top();
	init_toasts();
	init_save();
}
