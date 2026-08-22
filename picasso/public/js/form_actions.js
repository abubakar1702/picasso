(() => {
	frappe.provide("picasso.form_actions");

	picasso.form_actions.apply = function (frm) {
		const desk = (frappe.boot && frappe.boot.picasso_desk) || {};
		if (!desk.enabled || !desk.enable_hide_form_actions || !frm || !frm.doctype) {
			return;
		}

		const hide = (rows) => {
			(rows || []).forEach((row) => {
				const label = __(row[0]);
				const group = row[1] ? __(row[1]) : "";
				try {
					frm.remove_custom_button(label, group);
				} catch (e) {
					// Button may not exist on this form state.
				}
			});
		};

		if (frm._picasso_hidden_actions) {
			hide(frm._picasso_hidden_actions);
			return;
		}

		frappe
			.xcall("picasso.form.get_hidden_actions", { doctype: frm.doctype })
			.then((rows) => {
				frm._picasso_hidden_actions = rows || [];
				hide(frm._picasso_hidden_actions);
			});
	};

	$(document).on("form-refresh", (_e, frm) => {
		window.setTimeout(() => picasso.form_actions.apply(frm), 0);
	});
})();
