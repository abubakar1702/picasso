frappe.provide("picasso.desk_home");

picasso.desk_home.ensure_css = function () {
	const href = "/assets/picasso/css/desk_home.css?v=" + (frappe.boot.version_hash || Date.now());
	let link = document.getElementById("picasso-desk-home-css");
	if (!link) {
		link = document.createElement("link");
		link.id = "picasso-desk-home-css";
		link.rel = "stylesheet";
		document.head.appendChild(link);
	}
	// Only update href if it changed to avoid re-download/re-parse.
	if (link.getAttribute("href") !== href) {
		link.href = href;
	}

	const desk = (frappe.boot && frappe.boot.picasso_desk) || {};
	if (desk.accent_color) {
		document.documentElement.style.setProperty("--picasso-accent", desk.accent_color);
	}
};

picasso.desk_home.icon = function (name) {
	try {
		return frappe.utils.icon(name, "sm", "", "", "", true);
	} catch (e) {
		return "";
	}
};

picasso.desk_home.open_item = function (item) {
	if (!item) return;

	if (item.route) {
		frappe.set_route(item.route);
		return;
	}

	if (!item.doctype) return;

	if (item.action === "new") {
		frappe.ui.form.make_quick_entry(item.doctype, () => {});
		return;
	}

	if (item.filters) {
		frappe.route_options = item.filters;
	}
	frappe.set_route("List", item.doctype);
};

picasso.desk_home.render = function (wrapper, opts) {
	picasso.desk_home.ensure_css();
	$(wrapper).addClass("picasso-page-wrap");

	const $main = $(wrapper).find(".layout-main-section");
	$main.empty().html(`
		<div class="picasso-page">
			<div class="picasso-page__banner">
				<span class="picasso-page__banner-icon">${picasso.desk_home.icon(opts.banner_icon || "info")}</span>
				<p class="picasso-page__intro"></p>
			</div>
			<div class="picasso-page__loading">
				<div class="picasso-skeleton"></div>
				<div class="picasso-skeleton"></div>
				<div class="picasso-skeleton"></div>
			</div>
			<div class="picasso-page__body" style="display:none;"></div>
		</div>
	`);

	$main.find(".picasso-page__intro").text(opts.intro || "");

	frappe.call({
		method: opts.method,
		args: opts.args || {},
		freeze: false,
		callback: (r) => {
			const data = r.message || {};
			const $body = $main.find(".picasso-page__body");
			$main.find(".picasso-page__loading").remove();
			$body.show();
			$body.html(picasso.desk_home.build_html(data, opts));
			picasso.desk_home.bind($body, data);
			if (opts.after_render) {
				opts.after_render($body, data);
			}
		},
	});
};

picasso.desk_home.build_html = function (data, opts) {
	const shortcuts = data.shortcuts || [];
	const kpis = data.kpis || [];
	const masters = data.masters || [];
	const show_charts = !!(opts.show_charts && data.charts);

	let html = "";

	if (shortcuts.length) {
		html += `
			<section class="picasso-page__section">
				<div class="picasso-page__section-header">
					<span class="picasso-page__section-dot"></span>
					<h2 class="picasso-page__section-title">${__("Shortcuts")}</h2>
					<span class="picasso-page__section-line"></span>
				</div>
				<div class="picasso-page__grid picasso-page__grid--shortcuts">
					${shortcuts.map((s, i) => picasso.desk_home.shortcut_html(s, i)).join("")}
				</div>
			</section>
		`;
	}

	if (kpis.length) {
		html += `
			<section class="picasso-page__section">
				<div class="picasso-page__section-header">
					<span class="picasso-page__section-dot"></span>
					<h2 class="picasso-page__section-title">${opts.kpi_title || __("Overview")}</h2>
					<span class="picasso-page__section-line"></span>
				</div>
				<div class="picasso-page__grid picasso-page__grid--kpis">
					${kpis.map((k, i) => picasso.desk_home.kpi_html(k, i)).join("")}
				</div>
			</section>
		`;
	}

	if (show_charts) {
		const panels = data.chart_panels || [];
		html += `
			<section class="picasso-page__section">
				<div class="picasso-page__section-header">
					<span class="picasso-page__section-dot"></span>
					<h2 class="picasso-page__section-title">${opts.chart_title || __("Dashboard")}</h2>
					<span class="picasso-page__section-line"></span>
				</div>
				<div class="picasso-page__grid picasso-page__grid--charts">
					${panels
						.map(
							(p) => `
						<div class="picasso-panel">
							<h3 class="picasso-panel__title">${frappe.utils.escape_html(__(p.title || p.key))}</h3>
							<div class="picasso-panel__chart" data-chart="${frappe.utils.escape_html(p.key)}" data-chart-type="${frappe.utils.escape_html(
								p.type || "donut"
							)}"></div>
						</div>`
						)
						.join("")}
				</div>
			</section>
		`;
	}

	if (masters.length) {
		html += `
			<section class="picasso-page__section">
				<div class="picasso-page__section-header">
					<span class="picasso-page__section-dot"></span>
					<h2 class="picasso-page__section-title">${opts.masters_title || __("Masters & Transactions")}</h2>
					<span class="picasso-page__section-line"></span>
				</div>
				<div class="picasso-page__grid picasso-page__grid--masters">
					${masters.map((m, i) => picasso.desk_home.master_html(m, i)).join("")}
				</div>
			</section>
		`;
	}

	return html;
};

picasso.desk_home.shortcut_html = function (item, idx) {
	const badge =
		item.count != null
			? `<span class="picasso-tile__badge">${frappe.format(item.count, { fieldtype: "Int" })}</span>`
			: "";
	return `
		<button type="button" class="picasso-tile" data-tone="${frappe.utils.escape_html(item.tone || "blue")}" data-kind="shortcut" data-idx="${idx}">
			<span class="picasso-tile__icon">${picasso.desk_home.icon(item.icon)}</span>
			<span class="picasso-tile__body">
				<span class="picasso-tile__label">${frappe.utils.escape_html(item.label)}</span>
				<span class="picasso-tile__sub">${frappe.utils.escape_html(item.sub || "")}</span>
			</span>
			${badge}
		</button>
	`;
};

picasso.desk_home.kpi_html = function (item, idx) {
	const fieldtype = item.fieldtype || "Int";
	return `
		<div class="picasso-kpi" data-tone="${frappe.utils.escape_html(item.tone || "blue")}" data-kind="kpi" data-idx="${idx}" role="button" tabindex="0">
			<div class="picasso-kpi__bar"></div>
			<div class="picasso-kpi__inner">
				<div class="picasso-kpi__head">
					<span class="picasso-kpi__icon">${picasso.desk_home.icon(item.icon)}</span>
					<div class="picasso-kpi__label">${frappe.utils.escape_html(item.label)}</div>
				</div>
				<div class="picasso-kpi__footer">
					<div class="picasso-kpi__sub">${frappe.utils.escape_html(item.sub || "")}</div>
					<div class="picasso-kpi__value">${frappe.format(item.value, { fieldtype: fieldtype })}</div>
				</div>
			</div>
		</div>
	`;
};

picasso.desk_home.master_html = function (item, idx) {
	return `
		<button type="button" class="picasso-master" data-kind="master" data-idx="${idx}">
			<span class="picasso-master__dot"></span>
			<span class="picasso-master__label">${frappe.utils.escape_html(item.label)}</span>
			${picasso.desk_home.icon("chevron-right")}
		</button>
	`;
};

picasso.desk_home.bind = function ($body, data) {
	$body.on("click", "[data-kind='shortcut']", function () {
		const idx = cint($(this).attr("data-idx"));
		picasso.desk_home.open_item((data.shortcuts || [])[idx]);
	});

	$body.on("click", "[data-kind='kpi']", function () {
		const idx = cint($(this).attr("data-idx"));
		const item = (data.kpis || [])[idx];
		if (!item) return;
		picasso.desk_home.open_item({
			action: "list",
			doctype: item.doctype,
			filters: item.filters,
			route: item.route,
		});
	});

	$body.on("click", "[data-kind='master']", function () {
		const idx = cint($(this).attr("data-idx"));
		const item = (data.masters || [])[idx];
		if (!item) return;
		picasso.desk_home.open_item(item);
	});
};

picasso.desk_home.render_charts = function ($body, charts) {
	if (!charts || !window.frappe || !frappe.Chart) return;

	const desk = (frappe.boot && frappe.boot.picasso_desk) || {};
	const accent = desk.accent_color || "#5B21B6";
	const colors = [accent, "#2563eb", "#0d7a6e", "#c07a10", "#c73c3c"];

	$body.find("[data-chart]").each(function () {
		const $el = $(this);
		const key = $el.attr("data-chart");
		const type = $el.attr("data-chart-type") || "donut";
		const chart = charts[key] || { labels: [], values: [] };
		$el.empty();
		if (!chart.labels || !chart.labels.length) {
			$el.html(`<div class="picasso-panel__empty">${__("No Data")}</div>`);
			return;
		}
		new frappe.Chart($el.get(0), {
			data: {
				labels: chart.labels,
				datasets: [{ values: chart.values }],
			},
			type: type,
			height: type === "line" ? 240 : 220,
			colors: colors,
			axisOptions: type === "line" ? { xIsSeries: 1 } : undefined,
			lineOptions: type === "line" ? { regionFill: 1, hideDots: 0 } : undefined,
		});
	});
};
