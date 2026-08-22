import * as store from "./studio/store";
import * as recents from "./studio/recents";
import * as dock from "./studio/dock";
import * as panel from "./studio/panel";
import * as palette from "./studio/palette";
import * as quicklook from "./studio/quicklook";
import * as charts from "./studio/charts";
import * as motion from "./studio/motion";

function boot() {
	store.hydrate();
	recents.track();
	dock.init();
	panel.init();
	palette.init();
	quicklook.init();
	charts.init();
	motion.init();
	window.picasso = window.picasso || {};
	window.picasso.studio = store;
	if (window.jQuery) {
		$(document).on("app_ready", () => store.hydrate());
	}
}

if (document.body) {
	boot();
} else {
	document.addEventListener("DOMContentLoaded", boot);
}
