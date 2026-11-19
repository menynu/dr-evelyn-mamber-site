import { setupAnalytics, track } from "./analytics.js";
import { classifyLink } from "./link-classify.js";
import { answerById, answerQuestion } from "./bot-core.js";
import {
  isDesktopNavigation,
  normalizeIsraeliMobile,
  sendNavigationLink,
  shareText,
  smsShareUrl,
  whatsappShareUrl,
} from "./nav-share.js";

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
    track("callback_submit");
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

function externalLink(href, label, newTabLabel) {
  const link = document.createElement("a");
  link.href = href;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = label;
  if (newTabLabel) {
    const note = document.createElement("span");
    note.className = "sr-only";
    note.textContent = ` ${newTabLabel}`;
    link.append(note);
  }
  return link;
}

function readNavConfig() {
  const node = document.querySelector("#nav-share-config");
  if (!(node instanceof HTMLScriptElement)) return null;
  try {
    return JSON.parse(node.textContent || "");
  } catch {
    return null;
  }
}

function appendAnswerActions(item, result) {
  const config = readNavConfig();
  if (!config) return;
  const actions = document.createElement("div");
  actions.className = "msg-actions";
  if (result.id === "address" && config.wazeUrl && config.mapsUrl) {
    const mobile = externalLink(config.wazeUrl, config.labels.waze, config.labels.newTab);
    mobile.classList.add("btn", "btn-secondary", "when-mobile");
    const desktop = document.createElement("a");
    desktop.className = "btn btn-secondary when-desktop";
    desktop.href = config.wazeUrl;
    desktop.dataset.wazeShare = "true";
    desktop.setAttribute("aria-haspopup", "dialog");
    desktop.setAttribute("aria-expanded", "false");
    desktop.setAttribute("aria-controls", "waze-share-dialog");
    desktop.textContent = config.labels.wazeDesktop;
    const maps = externalLink(config.mapsUrl, config.labels.google, config.labels.newTab);
    maps.classList.add("btn", "btn-secondary");
    actions.append(mobile, desktop, maps);
  }
  if (result.id === "review" && config.reviewUrl) {
    const review = externalLink(config.reviewUrl, config.labels.review, config.labels.newTab);
    review.classList.add("btn", "btn-secondary");
    actions.append(review);
  }
  if (actions.childElementCount) item.append(actions);
}

function addMessage(log, kind, text, href, linkLabel, result) {
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
  if (kind === "bot" && result) appendAnswerActions(item, result);
  log.append(item);
  const top = item.getBoundingClientRect().top - log.getBoundingClientRect().top + log.scrollTop;
  log.scrollTop = top;
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
    addMessage(log, "bot", result.text, result.href ? localize(result.href, locale) : "", linkLabel, result);
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
    const shareDialog = document.querySelector("[data-waze-dialog]");
    if (shareDialog instanceof HTMLDialogElement && shareDialog.open) return;
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

function setupShare() {
  const dialog = document.querySelector("[data-waze-dialog]");
  const form = document.querySelector("[data-waze-form]");
  const config = readNavConfig();
  if (!(dialog instanceof HTMLDialogElement) || !(form instanceof HTMLFormElement) || !config) return;

  const phone = form.querySelector("[data-waze-phone]");
  const error = form.querySelector("[data-waze-error]");
  const status = form.querySelector("[data-waze-status]");
  const copyButton = form.querySelector("[data-waze-copy]");
  if (!(phone instanceof HTMLInputElement) || !(error instanceof HTMLElement) || !(status instanceof HTMLElement)) return;

  let lastTrigger = null;

  const applyMode = () => {
    const desktop = isDesktopNavigation();
    document.documentElement.classList.toggle("nav-mode-desktop", desktop);
    document.documentElement.classList.toggle("nav-mode-mobile", !desktop);
  };
  applyMode();
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
  const coarse = window.matchMedia("(hover: none), (pointer: coarse)");
  fine.addEventListener("change", applyMode);
  coarse.addEventListener("change", applyMode);

  const clearStatus = () => {
    status.hidden = true;
    status.textContent = "";
  };

  const showError = (message) => {
    error.hidden = false;
    error.textContent = message;
    phone.setAttribute("aria-invalid", "true");
    phone.setAttribute("aria-describedby", "waze-phone-hint waze-share-error");
    clearStatus();
  };

  const clearError = () => {
    error.hidden = true;
    error.textContent = "";
    phone.removeAttribute("aria-invalid");
    phone.setAttribute("aria-describedby", "waze-phone-hint");
  };

  const showStatus = (message) => {
    status.hidden = false;
    status.textContent = message;
  };

  const openShare = (trigger) => {
    if (lastTrigger && lastTrigger !== trigger) lastTrigger.setAttribute("aria-expanded", "false");
    lastTrigger = trigger;
    trigger.setAttribute("aria-expanded", "true");
    clearError();
    clearStatus();
    if (!dialog.open) dialog.showModal();
    phone.focus();
  };

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const trigger = target.closest("[data-waze-share]");
    if (!(trigger instanceof HTMLElement)) return;
    if (!isDesktopNavigation()) return;
    event.preventDefault();
    openShare(trigger);
  });

  dialog.addEventListener("close", () => {
    if (lastTrigger instanceof HTMLElement) {
      lastTrigger.setAttribute("aria-expanded", "false");
      lastTrigger.focus();
    }
  });

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  form.querySelector("[data-waze-close]")?.addEventListener("click", () => dialog.close());

  const message = () => shareText(config.message, config.address, config.wazeUrl);
  const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent || "");
  const errorText = (code) => {
    const messages = {
      empty: config.labels.errorEmpty,
      invalid: config.labels.errorInvalid,
      api: config.labels.errorApi,
      "no-endpoint": config.labels.errorEndpoint,
    };
    return messages[code] || config.labels.errorInvalid;
  };

  const finishClient = (channel, url) => {
    clearError();
    phone.value = "";
    if (channel === "sms") {
      window.location.href = url;
      showStatus(config.labels.openedSms);
      return;
    }
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    showStatus(opened ? config.labels.openedWhatsapp : config.labels.popupBlocked);
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const submitter = event.submitter;
    const channel = submitter instanceof HTMLElement && submitter.dataset.channel === "sms" ? "sms" : "whatsapp";
    const text = message();
    if (config.mode !== "api") {
      const normalized = normalizeIsraeliMobile(phone.value);
      if (!normalized.ok) {
        showError(errorText(normalized.code));
        phone.focus();
        return;
      }
      const url = channel === "sms" ? smsShareUrl(normalized.e164, text, { ios }) : whatsappShareUrl(normalized.e164, text);
      finishClient(channel, url);
      return;
    }
    sendNavigationLink({
      number: phone.value,
      channel,
      text,
      mode: "api",
      endpoint: config.endpoint,
      ios,
    }).then((result) => {
      if (!result.ok) {
        showError(errorText(result.code));
        phone.focus();
        return;
      }
      clearError();
      phone.value = "";
      showStatus(config.labels.openedApi);
    });
  });

  copyButton?.addEventListener("click", async () => {
    const url = config.wazeUrl;
    try {
      await navigator.clipboard.writeText(url);
      showStatus(config.labels.copied);
    } catch {
      const urlNode = form.querySelector(".share-url");
      if (urlNode instanceof HTMLElement) {
        const range = document.createRange();
        range.selectNodeContents(urlNode);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      const more = form.querySelector(".share-more");
      if (more instanceof HTMLDetailsElement) more.open = true;
      showStatus(config.labels.copyFailed);
    }
  });
}

setupAnalytics();

document.addEventListener(
  "click",
  (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const anchor = target.closest("a[href]");
    if (!(anchor instanceof HTMLAnchorElement)) return;
    const kind = classifyLink(anchor.href);
    if (kind) track(kind);
  },
  true,
);

{
  const btn = document.querySelector("[data-mmb-optout]");
  if (btn instanceof HTMLButtonElement) {
    const sync = () => {
      const on = window.__mamberIsOptOut?.() === true;
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.textContent = on ? btn.dataset.labelOff || "" : btn.dataset.labelOn || "";
    };
    sync();
    btn.addEventListener("click", () => {
      window.__mamberOptOut?.(!(window.__mamberIsOptOut?.() === true));
      sync();
    });
  }
}

setupNav();
setupMap();
setupForm();
setupBot();
setupShare();
