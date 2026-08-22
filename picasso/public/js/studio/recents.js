const recents = [];
const MAX = 12;

export function list() {
	return recents.slice();
}

export function track() {
	$(document).on("page-change", () => {
		const route = frappe.get_route_str ? frappe.get_route_str() : (location.pathname || "").replace(/^\/app\/?/, "");
		if (!route) return;
		const title = (document.querySelector(".page-head .title-text") || {}).textContent || route;
		const item = { route, title: (title || route).trim() };
		const idx = recents.findIndex((r) => r.route === item.route);
		if (idx >= 0) recents.splice(idx, 1);
		recents.unshift(item);
		if (recents.length > MAX) recents.pop();
	});
}
