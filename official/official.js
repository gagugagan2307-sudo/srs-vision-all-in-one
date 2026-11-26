(() => {
  "use strict";
  const $ = (selector) => document.querySelector(selector);
  const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[ch]));
  $("#year").textContent = new Date().getFullYear();

  const menu = $("#mainNav");
  $("#menuToggle").addEventListener("click", () => {
    const open = menu.classList.toggle("open");
    $("#menuToggle").setAttribute("aria-expanded", String(open));
  });
  menu.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
    menu.classList.remove("open");
    $("#menuToggle").setAttribute("aria-expanded", "false");
  }));

  // Uses the existing SRS Vision Firebase project/config. It only reads the
  // explicitly published publicSite branch and never reads internal team data.
  let db = null;
  try {
    const config = window.SRS_VISION_FIREBASE_CONFIG;
    if (!config || !window.firebase) throw new Error("Firebase config or SDK missing");
    const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(config);
    db = app.database();
    loadPublishedContent(db);
  } catch (error) {
    console.warn("SRS Vision public content is currently in preview mode.", error);
  }

  function asList(value) {
    if (!value) return [];
    return Array.isArray(value) ? value.filter(Boolean) : Object.values(value).filter(Boolean);
  }
  function loadPublishedContent(database) {
    database.ref("srsVision/publicSite/services").once("value").then(snapshot => {
      const items = asList(snapshot.val()).filter(item => item && item.published !== false);
      if (!items.length) return;
      $("#serviceGrid").innerHTML = items.map((item, index) => `
        <article class="service-card dynamic">
          <div class="service-icon icon-purple">✦</div>
          <span class="service-number">${String(index + 1).padStart(2,"0")} / SRS VISION</span>
          <h3>${escapeHTML(item.title || "Our service")}</h3>
          <p>${escapeHTML(item.description || "")}</p><a href="#contact" aria-label="Enquire">↗</a>
        </article>`).join("");
    }).catch(error => console.warn("Could not load published services.", error));

    database.ref("srsVision/publicSite/portfolio").once("value").then(snapshot => {
      const items = asList(snapshot.val()).filter(item => item && item.published !== false);
      if (!items.length) return;
      $("#portfolioGrid").innerHTML = items.map(item => `
        <article class="portfolio-card">
          ${item.imageUrl ? `<img class="dynamic-portfolio-image" loading="lazy" src="${escapeHTML(item.imageUrl)}" alt="${escapeHTML(item.title || "SRS Vision project")}">` : `<div class="portfolio-art art-brand"><div class="brand-emblem">SRS<br><small>VISION</small></div></div>`}
          <div class="portfolio-meta"><span>${escapeHTML(item.category || "SRS VISION")}</span><b>${escapeHTML(item.title || "Project")}</b></div>
        </article>`).join("");
    }).catch(error => console.warn("Could not load published portfolio.", error));
  }

  $("#enquiryForm").addEventListener("submit", async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const status = $("#formStatus");
    const button = form.querySelector("button[type=submit]");
    const data = new FormData(form);
    const record = {
      name: String(data.get("name") || "").trim(),
      contact: String(data.get("contact") || "").trim(),
      service: String(data.get("service") || "").trim(),
      details: String(data.get("details") || "").trim(),
      equipmentRequired: data.get("equipment") === "on",
      source: "official-website",
      status: "new",
      createdAt: (window.firebase && window.firebase.database) ? window.firebase.database.ServerValue.TIMESTAMP : Date.now()
    };
    if (!record.name || !record.contact || !record.service) return;
    if (!db) {
      status.textContent = "The enquiry service is not connected yet. Please try again later.";
      status.className = "form-status error";
      return;
    }
    button.disabled = true;
    button.textContent = "Sending...";
    status.textContent = "Sending your enquiry...";
    status.className = "form-status";
    try {
      await db.ref("srsVision/clientInquiries").push(record);
      form.reset();
      status.textContent = "Thank you! Your enquiry has been sent to the SRS Vision team.";
      status.className = "form-status success";
    } catch (error) {
      console.error("Enquiry submission failed:", error);
      status.textContent = "We could not save your enquiry right now. Please try again later.";
      status.className = "form-status error";
    } finally {
      button.disabled = false;
      button.innerHTML = 'Send project enquiry <span>↗</span>';
    }
  });
})();