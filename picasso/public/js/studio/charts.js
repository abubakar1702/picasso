import * as store from "./store";

const registry = new Set();

function hex_to_hsl(hex) {
	let h = hex.replace("#", "");
	if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
	const r = parseInt(h.slice(0, 2), 16) / 255;
	const g = parseInt(h.slice(2, 4), 16) / 255;
	const b = parseInt(h.slice(4, 6), 16) / 255;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	let hue = 0;
	const l = (max + min) / 2;
	const d = max - min;
	const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
	if (d) {
		if (max === r) hue = ((g - b) / d) % 6;
		else if (max === g) hue = (b - r) / d + 2;
		else hue = (r - g) / d + 4;
		hue *= 60;
		if (hue < 0) hue += 360;
	}
	return { h: hue, s: s * 100, l: l * 100 };
}

function accent_hex() {
	const raw = getComputedStyle(document.documentElement).getPropertyValue("--picasso-desk-accent").trim();
	return raw.startsWith("#") ? raw : "#2563eb";
}

function series_colors(count) {
	const base = hex_to_hsl(accent_hex());
	const colors = [];
	for (let i = 0; i < Math.max(count, 6); i++) {
		const hue = (base.h + i * 137.508) % 360;
		colors.push(`hsl(${hue.toFixed(1)} ${Math.max(42, base.s)}% ${Math.min(62, Math.max(38, base.l))}%)`);
	}
	return colors;
}

function inject(opts) {
	if (!store.feature("charts")) return opts;
	const next = Object.assign({}, opts || {});
	const n = (((next.data || {}).datasets || []).length) || 4;
	next.colors = series_colors(n);
	return next;
}

export function init() {
	if (!window.frappe || !frappe.Chart) return;
	const Orig = frappe.Chart;
	function PicassoChart(element, options) {
		const chart = new Orig(element, inject(options));
		registry.add(chart);
		return chart;
	}
	PicassoChart.prototype = Orig.prototype;
	Object.assign(PicassoChart, Orig);
	frappe.Chart = PicassoChart;
	document.addEventListener(store.EVENT_NAME, () => {
		if (!store.feature("charts")) return;
		registry.forEach((chart) => {
			try {
				if (chart.updateOptions) chart.updateOptions({ colors: series_colors(6) });
			} catch (e) {
				/* chart API varies */
			}
		});
	});
}
