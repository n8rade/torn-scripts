// ==UserScript==
// @name         Weapon & Armor UID
// @version      1.0.1
// @description  Shows each Armoury id on the Items page, Auction House listings, Item Market, Display Case, and Faction Armory, and copies the uid to the clipboard when an item is clicked.
// @author       Skeletron [318855] (Original Two Scripts Combined) and Ollama+Opencode w/Qwen3.8
// @match        https://www.torn.com/item.php*
// @match        https://www.torn.com/amarket.php*
// @match        https://www.torn.com/factions.php*
// @match        https://www.torn.com/page.php?sid=ItemMarket*
// @match        https://www.torn.com/displaycase.php*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=torn.com
// @license      GNU GPLv3
// ==/UserScript==

(function () {
  "use strict";

  const pageUrl = new URL(location.href);
  const path = pageUrl.pathname;
  const isItemPage = path.endsWith("item.php");
  const isAuction = path.endsWith("amarket.php");
  const isFaction = path.includes("factions.php");
  const isItemMarket =
    path.endsWith("page.php") && pageUrl.searchParams.get("sid") === "ItemMarket";
  const isDisplayCase = path.endsWith("displaycase.php");

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise((resolve, reject) => {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      let ok;
      try {
        ok = document.execCommand("copy");
      } catch (err) {
        ok = false;
      }
      area.remove();
      if (ok) {
        resolve();
      } else {
        reject(new Error("Copy failed"));
      }
    });
  }

  function mark(li, nameEl, uid) {
    li.classList.add("uid-added");
    li.__uid = uid;
    li.__uidNameEl = nameEl;
    if (!li.__uidListener) {
      li.__uidListener = true;
      li.addEventListener("click", (e) => {
        const el = li.__uidNameEl;
        if (el && (el === e.target || el.contains(e.target))) {
          copyText(li.__uid).catch((err) => {
            console.log(err);
          });
        }
      });
    }
    // re-derive the base name each time by stripping any trailing "[uid]" so
    // re-annotating is idempotent and a changed item refreshes cleanly instead
    // of being skipped
    const base = (nameEl.textContent || "").replace(/\s*\[\d+\]\s*$/, "").trim();
    const desired = `${base} [${uid}]`;
    if (nameEl.textContent !== desired) {
      nameEl.textContent = desired;
    }
  }

  const validItemCategories = new Set([
    "defensive",
    "primary",
    "secondary",
    "melee",
  ]);

  // item.php listings carry the armoury id in data-armoryid
  const annotateItems = (li) => {
    if (!li.classList || li.classList.contains("uid-added")) {
      return;
    }
    const uid = li.getAttribute("data-armoryid");
    if (!/^\d+$/.test(uid || "") || +uid === 0) {
      return;
    }
    const category = (li.getAttribute("data-category") || "").toLowerCase();
    if (!validItemCategories.has(category)) {
      return;
    }
    const nameEl = li.querySelector(".name");
    if (!nameEl) {
      return;
    }
    mark(li, nameEl, uid);
  };

  // amarket.php listings carry the armoury id on span.item-hover[armoury]
  const annotateAuctions = (li) => {
    if (!li.classList || li.classList.contains("uid-added")) {
      return;
    }
    const hover = li.querySelector("span.item-hover[armoury]");
    if (!hover) {
      return;
    }
    const uid = hover.getAttribute("armoury");
    if (!/^\d+$/.test(uid || "") || +uid === 0) {
      return;
    }
    const nameEl = li.querySelector(".item-name");
    if (!nameEl) {
      return;
    }
    mark(li, nameEl, uid);
  };

  // Item Market items reveal div#wai-itemInfo-<var>-<uid> when opened;
  // the uid is the trailing number, and the info box's own name element
  // (div.name___xxx) is used as the annotation target
  const annotateMarket = (infoDiv) => {
    if (!infoDiv.id) {
      return;
    }
    const match = infoDiv.id.match(/^wai-itemInfo-\d+-(\d+)$/);
    if (!match) {
      return;
    }
    const uid = match[1];
    const nameEl =
      infoDiv.querySelector('[class*="descriptionWrapper___"] span.bold') ||
      infoDiv.querySelector('[class*="name___"]');
    if (!nameEl) {
      return;
    }
    mark(infoDiv, nameEl, uid);
  };

  // displaycase.php boxes render like the item market boxes: opening an item
  // fills a shared box (li.show-item-info holding div.itemInfo___) whose name
  // lives on descriptionWrapper___ > span.bold. The uid of the opened item
  // comes from that item's .item-hover[armouryid]; the site marks the open
  // item's li with class "act" (the last clicked .item-hover is the fallback).
  // Items with no unique uid (armouryid="0") are left unannotated. Only the
  // name element INSIDE the box is ever touched, so the sidebar (a sibling
  // subtree) can never receive the uid.
  let lastClickedHover = null;

  const annotateDisplayBox = () => {
    const box =
      document.querySelector("li.show-item-info") ||
      document.querySelector('[class*="itemInfo___"]');
    if (!box) {
      return;
    }
    const nameEl =
      box.querySelector('[class*="descriptionWrapper___"] span.bold') ||
      box.querySelector('[class*="name___"]');
    if (!nameEl) {
      return;
    }
    const hover =
      document.querySelector("li.act .item-hover[armouryid]") ||
      lastClickedHover;
    const uid = hover ? hover.getAttribute("armouryid") || "" : "";
    if (!/^\d+$/.test(uid) || +uid === 0) {
      return;
    }
    mark(box, nameEl, uid);
  };

  // factions.php armory items carry the armoury id on div.img-wrap[data-armoryid]
  const annotateFaction = (item) => {
    if (item.classList && item.classList.contains("uid-added")) {
      return;
    }
    const wrap = item.querySelector("li div.img-wrap[data-armoryid]");
    if (!wrap) {
      return;
    }
    const uid = wrap.getAttribute("data-armoryid");
    if (!/^\d+$/.test(uid || "") || +uid === 0) {
      return;
    }
    const nameEl = item.querySelector("li div.name");
    if (!nameEl) {
      return;
    }
    mark(item, nameEl, uid);
  };

  function observeAnnotate(annotate) {
    annotate(document.body.querySelectorAll("li"));
    const observer = new MutationObserver((mutations) => {
      const seen = new Set();
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) {
            return;
          }
          if (node.tagName === "LI") {
            seen.add(node);
          }
          if (node.querySelectorAll) {
            node.querySelectorAll("li").forEach((li) => seen.add(li));
          }
        });
      });
      seen.forEach(annotate);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (isItemPage) {
    observeAnnotate(annotateItems);
  } else if (isAuction) {
    observeAnnotate(annotateAuctions);
  } else if (isItemMarket) {
    document
      .querySelectorAll("[id^='wai-itemInfo-']")
      .forEach(annotateMarket);
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        const candidates = new Set();
        const target = mutation.target;
        if (target && target.nodeType === 1) {
          if (target.id && target.id.indexOf("wai-itemInfo-") === 0) {
            candidates.add(target);
          } else {
            const owner =
              target.closest && target.closest("[id^='wai-itemInfo-']");
            if (owner) {
              candidates.add(owner);
            }
          }
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType !== 1) {
              return;
            }
            if (node.id && node.id.indexOf("wai-itemInfo-") === 0) {
              candidates.add(node);
            } else if (node.querySelectorAll) {
              node
                .querySelectorAll("[id^='wai-itemInfo-']")
                .forEach((n) => candidates.add(n));
            }
          });
        }
        candidates.forEach(annotateMarket);
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  } else if (isDisplayCase) {
    document.addEventListener(
      "click",
      (e) => {
        const hover =
          e.target && e.target.closest && e.target.closest(".item-hover");
        if (hover) {
          lastClickedHover = hover;
        }
      },
      true
    );
    annotateDisplayBox();
    const observer = new MutationObserver(() => annotateDisplayBox());
    observer.observe(document.body, { childList: true, subtree: true });
  } else if (isFaction) {
    const selector =
      '[id="tab=armoury&sub=weapons"] > ul.item-list > *, ' +
      '[id="tab=armoury&sub=armour"] > ul.item-list > *';
    const scanItems = (root) => {
      const out = [];
      if (root && root.matches && root.matches(selector)) {
        out.push(root);
      }
      if (root && root.querySelectorAll) {
        root.querySelectorAll(selector).forEach((n) => out.push(n));
      }
      return out;
    };
    const watchArmory = (armory) => {
      scanItems(armory).forEach(annotateFaction);
      const observer = new MutationObserver((mutations) => {
        const seen = new Set();
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType !== 1) {
              return;
            }
            scanItems(node).forEach((item) => seen.add(item));
          });
        });
        seen.forEach(annotateFaction);
      });
      observer.observe(armory, { childList: true, subtree: true });
    };
    const armory = document.querySelector("#faction-armoury");
    if (armory) {
      watchArmory(armory);
    } else {
      const bootObserver = new MutationObserver((mutations) => {
        let found = null;
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType !== 1 || !node.querySelector) {
              return;
            }
            if (node.id === "faction-armoury") {
              found = node;
            } else if (node.querySelector("#faction-armoury")) {
              found = node.querySelector("#faction-armoury");
            }
          });
        });
        if (found) {
          bootObserver.disconnect();
          watchArmory(found);
        }
      });
      bootObserver.observe(document.body, { childList: true, subtree: true });
    }
  }
})();
