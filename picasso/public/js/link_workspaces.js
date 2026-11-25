(() => {
	function redirect_link_workspace() {
		const desk = (frappe.boot && frappe.boot.picasso_desk) || {};
		if (!desk.enabled || !desk.redirect_link_workspaces) return;

		const parts = frappe.get_route() || [];
		const root = String(parts[0] || "").toLowerCase();
		if (root !== "workspaces" && root !== "workspace") return;

		const name = parts[1] === "private" ? parts[2] : parts[1];
		if (!name) return;

		// Guard against API changes across Frappe versions.
		const slugFn = frappe.router && frappe.router.slug;
		if (typeof slugFn !== "function") return;

		// In v16, workspace data may live under different boot keys.
		const pages =
			(frappe.boot.workspaces && frappe.boot.workspaces.pages) ||
			(Array.isArray(frappe.boot.workspaces) ? frappe.boot.workspaces : []);
		if (!pages.length) return;

		const slug = slugFn(name);
		const ws = pages.find(
			(p) =>
				p.name === name ||
				slugFn(p.name) === slug ||
				slugFn(p.title || "") === slug
		);

		if (!ws) return;

		if (ws.type === "URL") {
			// replace() so Back does not land on this workspace and redirect again.
			if (/^(https?:\/\/|\/)/i.test(ws.external_link || "")) window.location.replace(ws.external_link);
			return;
		}
		if (ws.type !== "Link") return;

		if (ws.link_type === "Page" && ws.link_to) {
			frappe.set_route(ws.link_to);
		} else if (ws.link_type === "DocType" && ws.link_to) {
			frappe.set_route("List", ws.link_to);
		}
	}

	if (frappe.router && frappe.router.on) {
		frappe.router.on("change", () => setTimeout(redirect_link_workspace, 0));
	}
	$(document).on("page-change", () => setTimeout(redirect_link_workspace, 0));
	$(redirect_link_workspace);
})();
