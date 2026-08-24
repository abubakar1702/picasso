/* Picasso first paint — runs before Desk JS. MIT.
   Reads the last known brand tokens + Studio flags so the theme class
   and colors land before Frappe paints the default grey desk. */
(() => {
	const KEY = "picasso:paint";
	const root = document.documentElement;

	function read() {
		try {
			const raw = localStorage.getItem(KEY);
			return raw ? JSON.parse(raw) : null;
		} catch (e) {
			return null;
		}
	}

	function write(payload) {
		try {
			localStorage.setItem(KEY, JSON.stringify(payload));
		} catch (e) {
			/* quota / private mode */
		}
	}

	function apply(cache) {
		if (!cache || !cache.enabled) {
			root.classList.remove("picasso-desk-theme");
			return;
		}
		root.classList.add("picasso-desk-theme");
		const tokens = cache.tokens || {};
		Object.keys(tokens).forEach((name) => {
			if (name.indexOf("--") === 0 && typeof tokens[name] === "string") {
				root.style.setProperty(name, tokens[name]);
			}
		});
		const studio = cache.studio || {};
		root.dataset.picassoDensity = studio.density || "cozy";
		root.dataset.picassoToast = studio.toast_position || "bottom-right";
		root.dataset.picassoDock = studio.dock_corner || "br";
		root.classList.toggle("picasso-motion-off", studio.motion === "off");
		root.classList.toggle("picasso-flat", studio.features && studio.features.gradients === false);
		const features = studio.features || {};
		["reveal", "cards", "app_icons", "condensed_header"].forEach((key) => {
			root.classList.toggle("picasso-feat-" + key, features[key] !== false);
		});
	}

	const cache = read();
	if (cache) {
		apply(cache);
	}

	window.picassoPaint = {
		KEY,
		read,
		write,
		apply,
		remember(desk, tokens, studio) {
			write({
				enabled: !!(desk && desk.enabled),
				tokens: tokens || {},
				studio: studio || (read() && read().studio) || {},
				user: (window.frappe && frappe.boot && frappe.boot.user && frappe.boot.user.name) || "",
				ts: Date.now(),
			});
		},
	};
})();
