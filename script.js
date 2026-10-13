"use strict";

// North Star Bakery | Sophia Touchstone 4
// The product catalog, field rules and storage keys keep data separate from behavior.
const PRODUCTS = [
  { id: "bread", label: "Artisan breads", formText: "Artisan bread / Signature Loaf" },
  { id: "pastries", label: "Pastries & treats", formText: "Pastries and treats" },
  { id: "cakes", label: "Celebration cakes", formText: "Celebration cake" }
];

const STORAGE_KEYS = {
  favorites: "northStarBakery.favorites.v1",
  requestType: "northStarBakery.requestType.v1"
};

const FORM_RULES = {
  nameMinLength: 2,
  detailsMinLength: 10,
  detailsMaxLength: 500
};

// Browsers may block storage in private browsing or under restrictive settings.
function loadStoredValue(key, fallback) {
  try {
    const stored = window.localStorage.getItem(key);
    return stored === null ? fallback : JSON.parse(stored);
  } catch (error) {
    return fallback;
  }
}

function saveStoredValue(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    return false;
  }
}

function getFavorites() {
  const saved = loadStoredValue(STORAGE_KEYS.favorites, []);
  if (!Array.isArray(saved)) return [];
  return PRODUCTS.filter(product => saved.includes(product.id)).map(product => product.id);
}

function findProduct(id) {
  return PRODUCTS.find(product => product.id === id);
}

function writeMessage(element, message) {
  if (element) element.textContent = message;
}

function initFavoritesPage() {
  const buttons = [...document.querySelectorAll("[data-favorite-id]")];
  if (!buttons.length) return;

  const summaryList = document.getElementById("favorite-list");
  const feedback = document.getElementById("favorite-feedback");
  const summary = document.getElementById("favorite-count");
  const empty = document.getElementById("favorites-empty");
  const preorderLink = document.getElementById("favorites-preorder-link");

  function renderFavorites() {
    const favorites = getFavorites();
    buttons.forEach(button => {
      const saved = favorites.includes(button.dataset.favoriteId);
      button.setAttribute("aria-pressed", String(saved));
      button.textContent = saved ? "♥ Saved to favorites" : "♡ Save to favorites";
    });

    summaryList.replaceChildren();
    favorites.forEach(id => {
      const product = findProduct(id);
      if (!product) return;
      const item = document.createElement("li");
      item.textContent = product.label;
      summaryList.append(item);
    });
    empty.hidden = favorites.length > 0;
    preorderLink.hidden = favorites.length === 0;
    writeMessage(summary, `${favorites.length} ${favorites.length === 1 ? "favorite" : "favorites"} saved`);
  }

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      const id = button.dataset.favoriteId;
      const product = findProduct(id);
      if (!product) return;
      const favorites = getFavorites();
      const alreadySaved = favorites.includes(id);
      const updated = alreadySaved ? favorites.filter(item => item !== id) : [...favorites, id];
      const stored = saveStoredValue(STORAGE_KEYS.favorites, updated);
      writeMessage(feedback, `${product.label} ${alreadySaved ? "removed from" : "added to"} your favorites.${stored ? " Saved on this browser." : " Browser storage is unavailable; this choice may not remain after a refresh."}`);
      // In case browser storage is disabled, do not claim persistence.
      if (stored) renderFavorites();
    });
  });

  renderFavorites();
}

function getSelectedRequestType(form) {
  return form.querySelector('input[name="request_type"]:checked')?.value || "";
}

function setFieldError(name, input, message) {
  const id = name === "request_type" ? "request-type-error" : `${input.id}-error`;
  const error = document.getElementById(id);
  writeMessage(error, message);
  const inputs = name === "request_type"
    ? [...document.querySelectorAll('input[name="request_type"]')]
    : [input];
  inputs.forEach(field => field.setAttribute("aria-invalid", message ? "true" : "false"));
}

function validateField(form, name) {
  const input = form.elements.namedItem(name);
  if (!input) return true;
  let error = "";

  if (name === "full_name") {
    const value = input.value.trim();
    if (!value) error = "Please enter your name.";
    else if (value.length < FORM_RULES.nameMinLength) error = "Name must contain at least 2 characters.";
  }
  if (name === "email") {
    const value = input.value.trim();
    if (!value) error = "Please enter your email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = "Enter an email address such as hello@example.com.";
  }
  if (name === "request_type") {
    if (!getSelectedRequestType(form)) error = "Select preorder or general question.";
  }
  if (name === "pickup_date") {
    if (getSelectedRequestType(form) === "preorder") {
      if (!input.value) error = "Choose a pickup date for your preorder.";
      else {
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
        if (input.value < today) error = "Choose today or a future pickup date.";
      }
    }
  }
  if (name === "item_details") {
    const value = input.value.trim();
    if (!value) error = "Tell us what you would like to order or ask.";
    else if (value.length < FORM_RULES.detailsMinLength) error = "Please give at least 10 characters of detail.";
    else if (value.length > FORM_RULES.detailsMaxLength) error = "Keep your message under 500 characters.";
  }
  setFieldError(name, input, error);
  return !error;
}

function initPreorderForm() {
  const form = document.getElementById("preorder-form");
  if (!form) return;

  const fields = ["full_name", "email", "request_type", "pickup_date", "item_details"];
  const formStatus = document.getElementById("form-status");
  const favoritesSummary = document.getElementById("form-favorites-list");
  const favoriteHint = document.getElementById("form-favorites-hint");
  const fillFavorites = document.getElementById("fill-favorites");
  const typeStatus = document.getElementById("request-memory-note");

  function showSavedFavorites() {
    const favorites = getFavorites().map(findProduct).filter(Boolean);
    favoritesSummary.replaceChildren();
    favorites.forEach(product => {
      const item = document.createElement("li");
      item.textContent = product.label;
      favoritesSummary.append(item);
    });
    fillFavorites.disabled = favorites.length === 0;
    writeMessage(favoriteHint, favorites.length
      ? `You have ${favorites.length} saved ${favorites.length === 1 ? "favorite" : "favorites"}. Add them to your request with one click.`
      : "You haven't saved any favorites yet. Visit Products to choose a few.");
  }

  const previousType = loadStoredValue(STORAGE_KEYS.requestType, "");
  if (["preorder", "question"].includes(previousType)) {
    const matching = form.querySelector(`input[name="request_type"][value="${previousType}"]`);
    if (matching) {
      matching.checked = true;
      writeMessage(typeStatus, "Your previous request type was restored from this browser.");
    }
  }

  form.querySelectorAll('input[name="request_type"]').forEach(radio => {
    radio.addEventListener("change", () => {
      if (!radio.checked) return;
      const stored = saveStoredValue(STORAGE_KEYS.requestType, radio.value);
      writeMessage(typeStatus, stored
        ? "Request type remembered on this browser. Personal contact details are not stored."
        : "Request type selected. Browser storage is unavailable, so it may not be remembered.");
      validateField(form, "request_type");
      validateField(form, "pickup_date");
    });
  });

  fillFavorites.addEventListener("click", () => {
    const details = form.elements.namedItem("item_details");
    const items = getFavorites().map(findProduct).filter(Boolean).map(item => item.formText);
    if (!items.length) return;
    const toAdd = `I'm interested in: ${items.join(", ")}.`;
    details.value = details.value.trim() ? `${details.value.trim()}\n${toAdd}` : toAdd;
    validateField(form, "item_details");
    writeMessage(formStatus, "Your saved favorites were added to the item details field. You can edit them before checking the form.");
    details.focus();
  });

  fields.filter(name => name !== "request_type").forEach(name => {
    const input = form.elements.namedItem(name);
    input.addEventListener("blur", () => {
      if (input.value.trim()) validateField(form, name);
    });
    input.addEventListener("input", () => {
      if (input.getAttribute("aria-invalid") === "true") validateField(form, name);
      writeMessage(formStatus, "");
    });
    if (name === "pickup_date") input.addEventListener("change", () => validateField(form, name));
  });

  form.addEventListener("submit", event => {
    // This is a demonstration without a server endpoint: never send user data.
    event.preventDefault();
    const invalid = fields.filter(name => !validateField(form, name));
    if (invalid.length) {
      writeMessage(formStatus, "Please correct the highlighted fields. Your entries are still here.");
      if (invalid[0] === "request_type") {
        form.querySelector('input[name="request_type"]')?.focus();
      } else {
        form.elements.namedItem(invalid[0])?.focus();
      }
      return;
    }
    writeMessage(formStatus, "All fields look good! This is a student demonstration, so your inquiry was NOT sent to the bakery. No name, email, or message was saved in browser storage.");
  });

  showSavedFavorites();
}

document.addEventListener("DOMContentLoaded", () => {
  initFavoritesPage();
  initPreorderForm();
});
