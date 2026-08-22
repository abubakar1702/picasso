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

function init_transitions() {
	$(document).on("page-change", () => {
		if (!can("page_transitions")) return;
		document.documentElement.classList.add("picasso-route-in");
		setTimeout(() => document.documentElement.classList.remove("picasso-route-in"), 360);
	});
}

function init_ripple() {
	document.addEventListener("pointerdown", (e) => {
		if (!can("ripple")) return;
		const btn = e.target.closest(".btn, .picasso-dock__btn, .picasso-palette__item");
		if (!btn) return;
		const ink = document.createElement("span");
		ink.className = "picasso-ink";
		const rect = btn.getBoundingClientRect();
		ink.style.left = e.clientX - rect.left + "px";
		ink.style.top = e.clientY - rect.top + "px";
		btn.classList.add("picasso-ripple-host");
		btn.appendChild(ink);
		setTimeout(() => ink.remove(), 500);
	});
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
		document.querySelectorAll(".list-row-container, .widget").forEach((n) => io.observe(n));
	};
	$(document).on("page-change", () => setTimeout(watch, 200));
	let mo_timer = null;
	const mo = new MutationObserver(() => {
		clearTimeout(mo_timer);
		mo_timer = setTimeout(watch, 80);
	});
	const start = () => {
		watch();
		const host = document.querySelector(".main-section") || document.body;
		if (host) mo.observe(host, { childList: true, subtree: true });
	};
	if (document.body) start();
	else document.addEventListener("DOMContentLoaded", start);
}

function init_tilt() {
	document.addEventListener("pointermove", (e) => {
		if (!can("tilt") || !store.feature("cards")) return;
		const card = e.target.closest(".widget, .frappe-card, .number-widget-box");
		if (!card) return;
		const r = card.getBoundingClientRect();
		card.style.setProperty("--picasso-mx", ((e.clientX - r.left) / r.width) * 100 + "%");
		card.style.setProperty("--picasso-my", ((e.clientY - r.top) / r.height) * 100 + "%");
	});
}

function parse_number(text) {
	const n = Number(String(text).replace(/,/g, "").replace(/[^\d.-]/g, ""));
	return Number.isFinite(n) ? n : null;
}

function init_counters() {
	const run = () => {
		if (!can("counters")) return;
		document.querySelectorAll(".widget .number, .number-card-widget .number").forEach((node) => {
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
	$(document).on("page-change", () => setTimeout(run, 80));
	run();
}

function init_header() {
	const on_scroll = () => {
		if (!store.feature("condensed_header")) {
			document.documentElement.classList.remove("picasso-head-condensed");
			return;
		}
		const y = window.scrollY || document.querySelector(".layout-main-section")?.scrollTop || 0;
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
		btn.innerHTML = `<svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15" /><circle class="picasso-top__ring" cx="18" cy="18" r="15" /></svg><span>↑</span>`;
		btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: store.motion_on() ? "smooth" : "auto" }));
		document.body.appendChild(btn);
	}
	const ring = btn.querySelector(".picasso-top__ring");
	const circ = 2 * Math.PI * 15;
	if (ring) {
		ring.style.strokeDasharray = String(circ);
		ring.style.strokeDashoffset = String(circ);
	}
	const update = () => {
		const show = store.feature("back_to_top") && (window.scrollY || 0) > 320;
		btn.classList.toggle("is-on", show);
		const max = document.documentElement.scrollHeight - window.innerHeight;
		const p = max > 0 ? window.scrollY / max : 0;
		if (ring) ring.style.strokeDashoffset = String(circ * (1 - p));
	};
	window.addEventListener("scroll", update, { passive: true });
	document.addEventListener(store.EVENT_NAME, update);
	update();
}

function init_toasts() {
	if (!frappe.show_alert) return;
	const orig = frappe.show_alert;
	frappe.show_alert = frappe.toast = function (message, seconds = 7, actions = {}) {
		const $el = orig.call(this, message, seconds, actions);
		if (!store.feature("toast_timers") || !$el) return $el;
		const bar = document.createElement("div");
		bar.className = "picasso-toast-bar";
		bar.style.animationDuration = (seconds || 7) + "s";
		$el.addClass("picasso-toast");
		$el.append(bar);
		return $el;
	};
}

function init_save() {
	const pulse = () => {
		if (!store.feature("save_pulse")) return;
		document.querySelectorAll(".form-status, .indicator-pill, .page-head .indicator").forEach((n) => {
			n.classList.remove("picasso-save-pulse");
			void n.offsetWidth;
			n.classList.add("picasso-save-pulse");
		});
	};
	$(document).on("form-saved after_save", pulse);
}

export function init() {
	init_progress();
	init_transitions();
	init_ripple();
	init_reveal();
	init_tilt();
	init_counters();
	init_header();
	init_top();
	init_toasts();
	$(document).on("app_ready", init_save);
}
