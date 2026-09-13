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
    quoteForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!quoteForm.checkValidity()) {
        quoteForm.reportValidity();
        return;
      }
      // NOTE: no backend is wired up yet. This is a placeholder confirmation
      // so the form is fully interactive; connect it to an email service,
      // form endpoint (e.g. Formspree) or CRM before launch.
      if (status) {
        status.textContent = "Thanks — your request has been noted. We'll be in touch within one business day. (Form submission isn't connected to a backend yet.)";
        status.classList.remove("err");
        status.classList.add("ok", "is-visible");
      }
      quoteForm.reset();
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

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
