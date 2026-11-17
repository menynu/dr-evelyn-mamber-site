import { answerById, answerQuestion } from "./bot-core.js";

function setupNav() {
  const toggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-nav]");
  const label = document.querySelector("[data-nav-label]");
  if (!(toggle instanceof HTMLButtonElement) || !(nav instanceof HTMLElement)) return;

  const setOpen = (open) => {
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    nav.dataset.open = open ? "true" : "false";
    if (label) {
      label.textContent = open ? toggle.dataset.labelClose || "" : toggle.dataset.labelOpen || "";
    }
  };

  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    setOpen(open);
    if (open) {
      const first = nav.querySelector("a");
      if (first instanceof HTMLElement) first.focus();
    }
  });

  nav.addEventListener("click", (event) => {
    const target = event.target;
    if (target instanceof HTMLElement && target.closest("a")) setOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
      setOpen(false);
      toggle.focus();
    }
  });
}

function setupMap() {
  const button = document.querySelector("[data-map-button]");
  const slot = document.querySelector("[data-map-slot]");
  if (!(button instanceof HTMLButtonElement) || !(slot instanceof HTMLElement)) return;
  button.addEventListener("click", () => {
    const frame = document.createElement("iframe");
    frame.className = "map-frame";
    frame.src = button.dataset.mapSrc || "";
    frame.title = button.dataset.mapTitle || "";
    frame.loading = "lazy";
    frame.referrerPolicy = "no-referrer-when-downgrade";
    button.replaceWith(frame);
    slot.querySelector(".hint")?.remove();
  });
}

function fillTemplate(template, values) {
  return template.replace(/\[\[(parent|phone|age|time)\]\]/g, (_, key) => values[key] || "");
}

function setupForm() {
  const form = document.querySelector("[data-booking-form]");
  if (!(form instanceof HTMLFormElement)) return;
  const error = form.querySelector("[data-form-error]");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const values = {
      parent: String(data.get("parent") || "").trim().slice(0, 80),
      phone: String(data.get("phone") || "").trim().slice(0, 20),
      age: String(data.get("age") || "").trim(),
      time: String(data.get("time") || "").trim().slice(0, 80),
    };
    const consent = form.querySelector("[name=consent]");
    const agreed = consent instanceof HTMLInputElement && consent.checked;
    const missing = !values.parent || !values.phone || !values.age || !values.time || !agreed;
    if (missing) {
      if (error instanceof HTMLElement) {
        error.hidden = false;
        error.textContent = form.dataset.error || "";
      }
      const firstInvalid = form.querySelector("input, select");
      if (firstInvalid instanceof HTMLElement) firstInvalid.focus();
      return;
    }
    if (error instanceof HTMLElement) error.hidden = true;
    const text = fillTemplate(form.dataset.template || "", values);
    const base = form.dataset.whatsapp || "";
    if (base) {
      const url = `${base}?text=${encodeURIComponent(text)}`;
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    window.location.href = `tel:${form.dataset.tel || ""}`;
  });

  const emailButton = document.querySelector("[data-email-button]");
  if (emailButton instanceof HTMLButtonElement) {
    emailButton.addEventListener("click", () => {
      const data = new FormData(form);
      const values = {
        parent: String(data.get("parent") || "").trim().slice(0, 80),
        phone: String(data.get("phone") || "").trim().slice(0, 20),
        age: String(data.get("age") || "").trim(),
        time: String(data.get("time") || "").trim().slice(0, 80),
      };
      const text = fillTemplate(form.dataset.template || "", values);
      const address = emailButton.dataset.email || "";
      const subject = emailButton.dataset.subject || "";
      window.location.href = `mailto:${address}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
    });
  }
}

function localize(href, locale) {
  if (!href) return "";
  if (!href.startsWith("/")) return href;
  const rootNode = document.querySelector("[data-locale-root]");
  const root = rootNode instanceof HTMLElement ? rootNode.dataset.localeRoot || "" : "";
  if (root) {
    const prefix = root.endsWith("/") ? root.slice(0, -1) : root;
    return `${prefix}${href}`;
  }
  if (locale === "en" && !href.startsWith("/en/")) return `/en${href}`;
  return href;
}

function addMessage(log, kind, text, href, linkLabel) {
  const item = document.createElement("div");
  item.className = kind === "user" ? "msg msg-user" : "msg msg-bot";
  const paragraph = document.createElement("p");
  paragraph.textContent = text;
  item.append(paragraph);
  if (href) {
    const link = document.createElement("a");
    link.href = href;
    link.textContent = linkLabel || href;
    item.append(document.createElement("br"), link);
  }
  log.append(item);
  log.scrollTop = log.scrollHeight;
}

function setupBot() {
  const openButton = document.querySelector("[data-bot-open]");
  const panel = document.querySelector("[data-bot-panel]");
  const log = document.querySelector("[data-bot-log]");
  const form = document.querySelector("[data-bot-form]");
  const input = document.querySelector("[data-bot-input]");
  const dataNode = document.querySelector("#faq-pack");
  const labelNode = document.querySelector("#faq-link-label");
  if (
    !(openButton instanceof HTMLButtonElement) ||
    !(panel instanceof HTMLElement) ||
    !(log instanceof HTMLElement) ||
    !(form instanceof HTMLFormElement) ||
    !(input instanceof HTMLInputElement) ||
    !(dataNode instanceof HTMLElement)
  ) {
    return;
  }

  const pack = JSON.parse(dataNode.textContent || "{}");
  const locale = panel.dataset.locale || "he";
  const linkLabel = labelNode?.textContent || "";
  let greeted = false;
  let lastFocus = openButton;

  const show = (result) => {
    addMessage(log, "bot", result.text, localize(result.href, locale), linkLabel);
  };

  const open = () => {
    lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : openButton;
    panel.hidden = false;
    openButton.setAttribute("aria-expanded", "true");
    if (!greeted) {
      greeted = true;
      show({ text: pack.ui.greeting, href: "" });
    }
    panel.focus();
  };

  const close = () => {
    panel.hidden = true;
    openButton.setAttribute("aria-expanded", "false");
    (lastFocus || openButton).focus();
  };

  openButton.addEventListener("click", () => {
    if (panel.hidden) open();
    else close();
  });
  panel.querySelector("[data-bot-close]")?.addEventListener("click", close);

  panel.querySelectorAll("[data-reply-id]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!(button instanceof HTMLButtonElement)) return;
      const id = button.dataset.replyId || "";
      addMessage(log, "user", button.textContent?.trim() || "", "", "");
      show(answerById(id, pack));
      input.focus();
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    addMessage(log, "user", text, "", "");
    show(answerQuestion(text, pack));
    input.value = "";
  });

  document.addEventListener("keydown", (event) => {
    if (panel.hidden) return;
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = [...panel.querySelectorAll("button, a, input")].filter(
      (node) => node instanceof HTMLElement && !node.hasAttribute("disabled"),
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

setupNav();
setupMap();
setupForm();
setupBot();
