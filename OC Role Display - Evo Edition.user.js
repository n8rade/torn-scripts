// ==UserScript==
// @name         OC Role Display - Evo Edition
// @version      3.0.0
// @description  Color Coding the positions
// @author       NotIbbyz, Tux [2571279] (Some manual, some OpenCode w/Ollama+Qwen3.8 BUT manually reviewed)
// @match        https://www.torn.com/factions.php?step=your*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=torn.com
// @license      MIT
// ==/UserScript==
(async function() {
    'use strict';

    const defaultLevel7 = 75;
    const defaultLevel6 = 75;
    const defaultLevel5 = 75;
    const defaultLevel4 = 75;
    const defaultLevel3 = 75;
    const defaultLevel2 = 75;
    const defaultDecline = 700;
    const maxActiveElaborateT9T10 = 6;

    const ocRoles = [
      {
            OCName: "Crane Reaction",
            level: 10,
            cls: "Elaborate",
            Positions: {
                "SNIPER": 65,
                "LOOKOUT": 64,
                "BOMBER": 66,
                "MUSCLE #1": 64,
                "ENGINEER": 63,
                "MUSCLE #2": 64
            }
      },
      {
            OCName: "Gone Fission",
            level: 9,
            cls: "Elaborate",
            Positions: {
                "HIJACKER": 63,
                "IMITATOR": 68,
                "BOMBER": 68,
                "PICKPOCKET": 68,
                "ENGINEER": 65
            }
      },
      {
            OCName: "Ace in the Hole",
            level: 9,
            cls: "Elaborate",
            Positions: {
                "HACKER": 71,
                "MUSCLE #2": 71,
                "IMITATOR": 70,
                "MUSCLE #1": 69,
                "DRIVER": 57
            }
      },
      {
            OCName: "Hostile Takeover",
            level: 9,
            cls: "Elaborate",
            Positions: {
                "NEGOTIATOR": 72,
                "KIDNAPPER": 69,
                "HACKER": 70,
                "MUSCLE": 70,
                "ENGINEER": 69,
                "CAT BURGLAR": 69
            }
      },
      {
            OCName: "Manifest Cruelty",
            level: 8,
            cls: "Elaborate",
            Positions: {
                "REVIVER": 73,
                "INTERROGATOR": 72,
                "HACKER": 66,
                "CAT BURGLAR": 65
            }
      },
      {
            OCName: "Stacking the Deck",
            level: 8,
            cls: "Elaborate",
            Positions: {
                "IMITATOR": 76,
                "HACKER": 75,
                "CAT BURGLAR": 75,
                "DRIVER": 56
            }
      },
      {
            OCName: "Lock Stock",
            level: 8,
            cls: "Elaborate",
            Positions: {
                "ASSASSIN": 76,
                "HACKER": 79,
                "MUSCLE #1": 79,
                "MUSCLE #2": 76,
                "SMUGGLER": 77
            }
      },
      {
            OCName: "Break the Bank",
            level: 8,
            cls: "Advanced",
            Positions: {
                "MUSCLE #3": 74,
                "THIEF #2": 75,
                "MUSCLE #1": 72,
                "ROBBER": 72,
                "MUSCLE #2": 69,
                "THIEF #1": 67
            }
      },
      {
            OCName: "Clinical Precision",
            level: 8,
            cls: "Advanced",
            Positions: {
                "IMITATOR": 76,
                "CLEANER": 75,
                "CAT BURGLAR": 72,
                "ASSASSIN": 66
            }
      },
      {
            OCName: "Blast From The Past",
            level: 7,
            cls: "Advanced",
            Positions: {
                "MUSCLE": 84,
                "ENGINEER": 84,
                "BOMBER": 76,
                "HACKER": 80,
                "PICKLOCK #1": 81,
                "PICKLOCK #2": 81
            }
      },
      {
            OCName: "Window of Opportunity",
            level: 7,
            cls: "Advanced",
            Positions: {
                "LOOTER #2": 81,
                "MUSCLE #1": 82,
                "LOOTER #1": 81,
                "MUSCLE #2": 82,
                "ENGINEER": 82
            }
      },
      {
            OCName: "Cleared for Takeoff",
            level: 7,
            cls: "Advanced",
            Positions: `default_${defaultLevel7}`
      },
      {
            OCName: "Bidding War",
            Positions: `default_${defaultLevel6}`
      },
      {
            OCName: "Honey Trap",
            Positions: `default_${defaultLevel5}`
      },
      {
            OCName: "Leave No Trace",
            Positions: `default_${defaultLevel6}`
      },
      {
            OCName: "Stage Fright",
            Positions: `default_${defaultLevel4}`
      },
      {
            OCName: "Snow Blind",
            Positions: `default_${defaultLevel4}`
      },
      {
            OCName: "Pet Project",
            Positions: `default_${defaultLevel2}`
      },
      {
            OCName: "Cash Me If You Can",
            Positions: `default_${defaultLevel2}`
      },
      {
            OCName: "Smoke and Wing Mirrors",
            Positions: `default_${defaultLevel2}`
      },
      {
            OCName: "Market Forces",
            Positions: `default_${defaultLevel2}`
      },
      {
            OCName: "Guardian Ángels",
            Positions: `default_${defaultLevel5}`
      },
      {
            OCName: "No Reserve",
            Positions: `default_${defaultLevel5}`
      }
    ];

    const q = (s, r = document) => r.querySelector(s);
    const qa = (s, r = document) => Array.from(r.querySelectorAll(s));

    // Match the join button by class tokens instead of attribute-starts-with,
    // so it still works if classes are reordered, extra classes are added, or
    // hash suffixes are appended (torn.com CSS modules).
    function isJoinButton(el) {
        if (!el.classList) return false;
        const tokens = Array.from(el.classList);
        const has = (name) => tokens.some(t => t === name || t.startsWith(name));
        return has('torn-btn') && has('joinButton');
    }

    function queryJoinButtons(root) {
        const found = new Set();
        qa('button', root).forEach(el => { if (isJoinButton(el)) found.add(el); });
        return Array.from(found);
    }

    const SELECTORS = {
        panel: 'div[class^="wrapper___"][data-oc-id]',
        slots: '[class^="contentLayer___"] > [class^="wrapper___"] > [class^="wrapper___"]',
        panelTitle: '[class^="panelTitle___"]'
    };

    function findOC(ocName) {
        if (!ocName) return undefined;
        const needle = ocName.toLowerCase();
        return ocRoles.find(o => o.OCName.toLowerCase() === needle);
    }

    function panelTitle(panel) {
        return q(SELECTORS.panelTitle, panel)?.innerText.trim() || "";
    }

    function assignedUserName(honorTexts) {
        return honorTexts.length > 1 ? honorTexts[1].textContent.trim() : null;
    }

    function processScenario(panel) {
        if (panel.classList.contains('role-processed')) return;
        panel.classList.add('role-processed');

        const ocName = panelTitle(panel) || "Unknown";
        const slots = qa(SELECTORS.slots, panel);

        const ocData = findOC(ocName);
        slots.forEach((slot) => {
            // get raw role text and chance
            const roleElem      = slot.querySelector('[class^="title___"]');
            const chanceElem    = slot.querySelector('[class^="successChance___"]');
            if (!roleElem || !chanceElem) return;

            const rawRole       = roleElem.innerText.trim();
            const successChance = parseInt(chanceElem.textContent.trim(), 10) || 0;
            const joinBtn       = qa('button', slot).find(el => isJoinButton(el)) || null;

            // find thresholds
            let required = null;
            if (ocData) {
                if (typeof ocData.Positions === 'string' && ocData.Positions.startsWith('default_')) {
                    required = parseInt(ocData.Positions.split('_')[1], 10);
                } else if (typeof ocData.Positions === 'object' && ocData.Positions[rawRole] !== undefined) {
                    required = ocData.Positions[rawRole];
                }
            }
            if (required === null) return;  // skip unmapped slots

            // detect assigned player
            const honorTexts = slot.querySelectorAll('.honor-text');
            const userName   = assignedUserName(honorTexts);

            // color & disable logic
            if (!userName) {
                slot.style.backgroundColor = successChance < required
                    ? '#ff000061'  // redish
                    : '#21a61c61'; // greenish
                if (joinBtn && successChance < required) {
                    joinBtn.textContent= `Req ${required}`;
                    joinBtn.setAttribute('disabled', '');
                }
            } else if (successChance < required) {
                slot.style.outline = '4px solid red';
                slot.style.outlineOffset = '0px';
            }
        });
    }

    // A T9/T10 elaborate OC is identified by the level + elaborate class.
    function isT9T10Elaborate(ocName) {
        const data = findOC(ocName);
        return data !== undefined
            && data.cls === 'Elaborate'
            && (data.level === 9 || data.level === 10);
    }

    // Whether this panel currently has at least one assigned player.
    function panelHasMember(panel) {
        return qa(SELECTORS.slots, panel).some(slot => {
            const honorTexts = slot.querySelectorAll('.honor-text');
            return assignedUserName(honorTexts) !== null;
        });
    }

    function disableJoinForPanel(panel) {
        qa(SELECTORS.slots, panel).forEach((slot) => {
            slot.style.backgroundColor = '#8B00C4';
        });
        queryJoinButtons(panel).forEach(btn => {
            btn.textContent = `<=${maxActiveElaborateT9T10} T9+`;
            btn.setAttribute('disabled', '');
        });
    }

    function searchPage() {
      const orgCrimes = qa(SELECTORS.panel);

      // Pass 1: count active T9/T10 elaborate OCs (ones already populated with people)
      let activeElaborateCount = 0;
      orgCrimes.forEach((panel) => {
        if (isT9T10Elaborate(panelTitle(panel)) && panelHasMember(panel)) {
            activeElaborateCount++;
        }
      });

      // Pass 2: color every panel, then enforce the limit on join buttons of
      // inactive T9/T10 elaborate OCs when over the cap.
      const overLimit = activeElaborateCount >= maxActiveElaborateT9T10;
      orgCrimes.forEach((panel) => {
        processScenario(panel);
        if (overLimit && isT9T10Elaborate(panelTitle(panel)) && !panelHasMember(panel)) {
            disableJoinForPanel(panel);
        }
      });
    }

    let observing = false;
    const observePage = () => {
        if (!observing) {
            observer.observe(document.body, { childList: true, subtree: true });
            observing = true;
        }
    };
    const unobservePage = () => {
        if (observing) {
            observer.disconnect();
            observing = false;
        }
    };

    // Re-running searchPage() mutates the DOM (textContent, attributes), which
    // would re-trigger this observer and loop forever. Disconnect while we work.
    const observer = new MutationObserver(() => {
        unobservePage();
        try {
            searchPage();
        } finally {
            observePage();
        }
    });

    try {
        searchPage();
    } finally {
        observePage();
    }

})();
