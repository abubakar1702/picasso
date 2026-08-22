(() => {
	function initCarousel(root) {
		const slides = Array.from(root.querySelectorAll(".picasso-slide"));
		const dots = Array.from(root.querySelectorAll(".picasso-dot"));
		if (slides.length < 2) {
			return;
		}

		let index = 0;
		let timer = null;

		function goTo(next) {
			slides[index].classList.remove("is-active");
			if (dots[index]) {
				dots[index].classList.remove("is-active");
			}
			index = (next + slides.length) % slides.length;
			slides[index].classList.add("is-active");
			if (dots[index]) {
				dots[index].classList.add("is-active");
			}
		}

		function start() {
			stop();
			const seconds = Number(root.getAttribute("data-interval") || 5);
			timer = window.setInterval(() => goTo(index + 1), Math.max(2, seconds) * 1000);
		}

		function stop() {
			if (timer) {
				window.clearInterval(timer);
				timer = null;
			}
		}

		dots.forEach((dot) => {
			dot.addEventListener("click", () => {
				const i = Number(dot.getAttribute("data-slide-index") || 0);
				goTo(i);
				start();
			});
		});

		root.addEventListener("mouseenter", stop);
		root.addEventListener("mouseleave", start);
		start();
	}

	function entrance() {
		const root = document.querySelector(".picasso-login");
		if (!root) return;
		let enter = true;
		try {
			const studio = JSON.parse(localStorage.getItem("picasso:studio") || "null");
			if (studio && studio.features && studio.features.signin_entrance === false) enter = false;
		} catch (e) {
			/* ignore */
		}
		if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			enter = false;
		}
		root.classList.toggle("picasso-login--enter", enter);
	}

	function boot() {
		entrance();
		document.querySelectorAll("[data-picasso-carousel]").forEach(initCarousel);
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", boot);
	} else {
		boot();
	}
})();
