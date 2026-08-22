(() => {
	function path_of(url) {
		if (!url) return "";
		try {
			return decodeURIComponent(new URL(url, window.location.origin).pathname)
				.replace(/\/+$/, "")
				.toLowerCase();
		} catch (e) {
			return String(url).split("?")[0].split("#")[0].replace(/\/+$/, "").toLowerCase();
		}
	}

	function mark_active() {
		const root = document.querySelector(".body-sidebar");
		if (!root) return;

		const path = path_of(window.location.pathname);
		if (!path) return;

		let best = null;
		let best_len = -1;
		root.querySelectorAll("a.item-anchor[href]").forEach((a) => {
			const href = path_of(a.getAttribute("href"));
			if (!href || href === "/desk" || href === "/app") return;
			if (path === href || path.startsWith(href + "/")) {
				if (href.length > best_len) {
					best = a;
					best_len = href.length;
				}
			}
		});

		root.querySelectorAll(".active-sidebar").forEach((el) => {
			el.classList.remove("active-sidebar");
		});
		if (!best) return;

		const row = best.closest(".standard-sidebar-item") || best.parentElement;
		if (row) row.classList.add("active-sidebar");
	}

	function boot() {
		if (!(window.frappe && frappe.router && frappe.router.on)) {
			setTimeout(boot, 200);
			return;
		}
		frappe.router.on("change", () => setTimeout(mark_active, 50));
		$(document).on("page-change sidebar-expand", () => setTimeout(mark_active, 50));
		setTimeout(mark_active, 200);
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", boot);
	} else {
		boot();
	}
})();
