const STORAGE_KEY = "picasso:studio";
const EVENT = "picasso:studio";

export const FEATURES = [
	{ key: "page_transitions", label: "Route fade", hint: "Soft fade when changing pages" },
	{ key: "progress_bar", label: "Loading bar", hint: "Accent bar while Desk is busy" },
	{ key: "ripple", label: "Button ripples", hint: "Press feedback on buttons" },
	{ key: "reveal", label: "List fade-in", hint: "Rows appear as they enter view" },
	{ key: "tilt", label: "Card sheen", hint: "Light follows the cursor on cards" },
	{ key: "counters", label: "Number count-up", hint: "Dashboard figures tick into place" },
	{ key: "condensed_header", label: "Compact header", hint: "Page head shrinks while scrolling" },
	{ key: "back_to_top", label: "Back to top", hint: "Jump button with scroll progress" },
	{ key: "toast_timers", label: "Toast countdown", hint: "See how long an alert will stay" },
	{ key: "save_pulse", label: "Save pulse", hint: "Status pill flashes after save" },
	{ key: "palette", label: "Command palette", hint: "Ctrl+Shift+K for actions" },
	{ key: "charts", label: "Chart accent", hint: "Series colours follow your accent" },
	{ key: "cards", label: "Card lift", hint: "Workspace cards lift on hover" },
	{ key: "app_icons", label: "Accent icons", hint: "Tint workspace icons to the accent" },
	{ key: "dock_autohide", label: "Auto-hide dock", hint: "Studio dock tucks away until hover" },
	{ key: "gradients", label: "Brand gradients", hint: "Off = flat navbar and sidebar fills" },
	{ key: "signin_entrance", label: "Sign-in entrance", hint: "Login shell eases in" },
];

const DEFAULTS = {
	density: "cozy",
	motion: "on",
	accent: "",
	toast_position: "bottom-right",
	dock_corner: "br",
	features: FEATURES.reduce((acc, f) => {
		acc[f.key] = true;
		return acc;
	}, {}),
};

let state = structuredClone(DEFAULTS);
let save_timer = null;

function clone(obj) {
	return JSON.parse(JSON.stringify(obj));
}

function merge(raw) {
	const next = clone(DEFAULTS);
	if (!raw || typeof raw !== "object") return next;
	if (["compact", "cozy", "roomy"].includes(raw.density)) next.density = raw.density;
	if (raw.motion === "on" || raw.motion === "off") next.motion = raw.motion;
	if (typeof raw.accent === "string" && raw.accent.startsWith("#")) next.accent = raw.accent;
	if (typeof raw.toast_position === "string") next.toast_position = raw.toast_position;
	if (typeof raw.dock_corner === "string") next.dock_corner = raw.dock_corner;
	if (raw.features && typeof raw.features === "object") {
		FEATURES.forEach((f) => {
			if (f.key in raw.features) next.features[f.key] = !!raw.features[f.key];
		});
	}
	return next;
}

function persist_local() {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch (e) {
		/* ignore */
	}
}

export function prefers_reduced_motion() {
	return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
}

export function motion_on() {
	return state.motion === "on" && !prefers_reduced_motion();
}

export function feature(key) {
	return state.features[key] !== false;
}

export function get() {
	return clone(state);
}

export function apply_dom() {
	const root = document.documentElement;
	root.dataset.picassoDensity = state.density;
	root.dataset.picassoToast = state.toast_position;
	root.dataset.picassoDock = state.dock_corner;
	root.classList.toggle("picasso-motion-off", !motion_on());
	root.classList.toggle("picasso-flat", !feature("gradients"));
	["reveal", "tilt", "cards", "app_icons", "condensed_header"].forEach((key) => {
		root.classList.toggle("picasso-feat-" + key, feature(key));
	});
	if (state.accent) {
		root.style.setProperty("--picasso-light-accent", state.accent);
		root.style.setProperty("--picasso-dark-accent", state.accent);
	}
	document.dispatchEvent(new CustomEvent(EVENT, { detail: get() }));
}

export function set(patch) {
	state = merge({ ...state, ...patch, features: { ...state.features, ...(patch.features || {}) } });
	persist_local();
	apply_dom();
	if (window.picassoPaint) {
		const desk = (window.frappe && frappe.boot && frappe.boot.picasso_desk) || { enabled: true };
		window.picassoPaint.remember(desk, window.picassoPaint.read()?.tokens || {}, state);
	}
	schedule_save();
	return get();
}

export function set_feature(key, on) {
	return set({ features: { [key]: on } });
}

function schedule_save() {
	clearTimeout(save_timer);
	save_timer = setTimeout(() => {
		if (!window.frappe || !frappe.call) return;
		frappe.call({
			method: "picasso.appearance.save_studio",
			args: { studio: state },
			freeze: false,
		});
	}, 500);
}

export function hydrate() {
	try {
		const local = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
		if (local) state = merge(local);
	} catch (e) {
		/* ignore */
	}
	const boot = window.frappe && frappe.boot && frappe.boot.picasso_studio;
	if (boot) state = merge({ ...state, ...boot, features: { ...state.features, ...(boot.features || {}) } });
	persist_local();
	apply_dom();
	return get();
}

export const EVENT_NAME = EVENT;
