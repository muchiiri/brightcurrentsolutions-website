/* ==========================================================================
   BrightCurrent Solutions — shared front-end behaviour
   ========================================================================== */
(function () {
  "use strict";

  /* ---------- Mobile nav toggle ---------- */
  var navToggle = document.querySelector("[data-nav-toggle]");
  var mobileNav = document.querySelector("[data-mobile-nav]");
  if (navToggle && mobileNav) {
    navToggle.addEventListener("click", function () {
      var isOpen = mobileNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });
    // Close the mobile menu once a link inside it is used.
    mobileNav.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        mobileNav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- Active nav link (based on current file name) ---------- */
  var current = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll("[data-nav-link]").forEach(function (link) {
    var href = (link.getAttribute("href") || "").split("#")[0].toLowerCase();
    if (href === current || (current === "" && href === "index.html")) {
      link.classList.add("is-active");
    }
  });

  /* ---------- Generic accordion (FAQ + service detail cards) ---------- */
  document.querySelectorAll("[data-accordion-trigger]").forEach(function (trigger) {
    trigger.addEventListener("click", function () {
      var item = trigger.closest("[data-accordion-item]");
      if (!item) return;
      var group = item.closest("[data-accordion-group]");
      var wasOpen = item.classList.contains("is-open");

      if (group && group.hasAttribute("data-accordion-single")) {
        group.querySelectorAll("[data-accordion-item].is-open").forEach(function (openItem) {
          if (openItem !== item) openItem.classList.remove("is-open");
        });
      }
      item.classList.toggle("is-open", !wasOpen);
    });
  });

  /* ---------- Service category filter (services.html) ---------- */
  var filterRow = document.querySelector("[data-service-filters]");
  if (filterRow) {
    var chips = filterRow.querySelectorAll("[data-filter]");
    var cards = document.querySelectorAll("[data-service-category]");
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) { c.classList.remove("is-active"); });
        chip.classList.add("is-active");
        var category = chip.getAttribute("data-filter");
        cards.forEach(function (card) {
          var matches = category === "all" || card.getAttribute("data-service-category") === category;
          card.style.display = matches ? "" : "none";
        });
      });
    });
  }

  /* ---------- Open a specific service detail card when linked via #hash ---------- */
  function openServiceFromHash() {
    if (!location.hash) return;
    var target = document.querySelector(location.hash);
    if (target && target.hasAttribute("data-accordion-item")) {
      target.classList.add("is-open");
      setTimeout(function () {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
  }
  window.addEventListener("DOMContentLoaded", openServiceFromHash);
  window.addEventListener("hashchange", openServiceFromHash);

  /* ---------- Contact / quote form ---------- */
  var quoteForm = document.querySelector("[data-quote-form]");
  if (quoteForm) {
    var status = quoteForm.querySelector("[data-form-status]");
    var submitBtn = quoteForm.querySelector('button[type="submit"]');

    function setStatus(ok, message) {
      if (!status) return;
      status.textContent = message;
      status.classList.remove(ok ? "err" : "ok");
      status.classList.add(ok ? "ok" : "err", "is-visible");
    }

    quoteForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!quoteForm.checkValidity()) {
        quoteForm.reportValidity();
        return;
      }

      if (submitBtn) submitBtn.disabled = true;

      fetch(quoteForm.getAttribute("action"), {
        method: "POST",
        body: new FormData(quoteForm),
        headers: { "Accept": "application/json" }
      })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (data) {
            return { httpOk: res.ok, data: data };
          });
        })
        .then(function (result) {
          var ok = result.httpOk && result.data.ok;
          var message = result.data.message || (ok
            ? "Thanks — your request has been sent. We'll be in touch within one business day."
            : "Something went wrong sending your request. Please call or WhatsApp us instead.");
          setStatus(ok, message);
          if (ok) quoteForm.reset();
        })
        .catch(function () {
          setStatus(false, "Something went wrong sending your request — please check your connection, or call or WhatsApp us instead.");
        })
        .finally(function () {
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  }

  /* ---------- Radio chip groups (contact form site-type) ---------- */
  document.querySelectorAll(".radio-chip input[type=radio]").forEach(function (input) {
    input.addEventListener("change", function () {
      var name = input.getAttribute("name");
      document.querySelectorAll('.radio-chip input[name="' + name + '"]').forEach(function (sibling) {
        sibling.closest(".radio-chip").classList.toggle("is-checked", sibling.checked);
      });
    });
  });

  /* ---------- Footer year ----------
     The footer markup itself is authored once in partials/footer.html and
     baked into every page as static HTML by `npm run sync-footer` (see that
     script for why — a runtime fetch of the partial only works over
     http(s), and this site is routinely opened via file://). Only the
     copyright year is filled in at runtime. */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---------- Scroll-to-top button ---------- */
  var scrollTopBtn = document.createElement("button");
  scrollTopBtn.type = "button";
  scrollTopBtn.className = "scroll-top-btn";
  scrollTopBtn.setAttribute("aria-label", "Scroll to top");
  scrollTopBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>';
  document.body.appendChild(scrollTopBtn);

  function toggleScrollTopBtn() {
    scrollTopBtn.classList.toggle("is-visible", window.scrollY > 600);
  }
  window.addEventListener("scroll", toggleScrollTopBtn, { passive: true });
  toggleScrollTopBtn();

  scrollTopBtn.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
})();
