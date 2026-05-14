// ==UserScript==
// @name         OC Role Display - Evo Edition
// @version      2.4.5.8
// @description  Color Coding the positions
// @author       NotIbbyz
// @match        https://www.torn.com/factions.php?step=your*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=torn.com
// @grant        GM_info
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
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

    const ocRoles = [
      {
        //Level 10 Elaborate
            OCName: "Crane Reaction",
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
        //Level 9 Elaborate
            OCName: "Gone Fission",
            Positions: {
                "HIJACKER": 64,
                "IMITATOR": 68,
                "BOMBER": 68,
                "PICKPOCKET": 68,
                "ENGINEER": 65
            }
      },
      {
        //Level 9 Elaborate
            OCName: "Ace in the Hole",
            Positions: {
                "HACKER": 70,
                "MUSCLE #2": 71,
                "IMITATOR": 70,
                "MUSCLE #1": 68,
                "DRIVER": 57
            }
      },
      {
        //Level 8 Elaborate
            OCName: "Manifest Cruelty",
            Positions: {
                "REVIVER": 70,
                "INTERROGATOR": 70,
                "HACKER": 65,
                "CAT BURGLAR": 65
            }
      },
      {
        //Level 8 Elaborate
            OCName: "Stacking the Deck",
            Positions: {
                "IMITATOR": 72,
                "HACKER": 65,
                "CAT BURGLAR": 65,
                "DRIVER": 57
            }
      },
      {
        //Level 8 Advanced
            OCName: "Break the Bank",
            Positions: {
                "MUSCLE #3": 72,
                "THIEF #2": 72,
                "MUSCLE #1": 65,
                "ROBBER": 65,
                "MUSCLE #2": 65,
                "THIEF #1": 60
            }
      },
      {
        //Level 8 Advanced
            OCName: "Clinical Precision",
            Positions: {
                "IMITATOR": 72,
                "CLEANER": 65,
                "CAT BURGLAR": 65,
                "ASSASSIN": 65
            }
      },
      {
        //Level 7 Advanced
            OCName: "Blast From The Past",
            Positions: {
                "MUSCLE": 75,
                "ENGINEER": 75,
                "BOMBER": 60,
                "HACKER": 60,
                "PICKLOCK #1": 60,
                "PICKLOCK #2": 60
            }
      },
      {
            OCName: "Window of Opportunity",
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

    const roleMappings = {};

    const q = (s, r = document) => r.querySelector(s);
    const qa = (s, r = document) => Array.from(r.querySelectorAll(s));

    function processScenario(panel) {
        if (panel.classList.contains('role-processed')) return;
        panel.classList.add('role-processed');

        const ocName = q('[class^="panelTitle___"]', panel)?.innerText.trim() || "Unknown";
        const slots = qa('[class^="contentLayer___"] > [class^="wrapper___"] > [class^="wrapper___"]', panel);

        slots.forEach((slot) => {
            // get raw role text and chance
            const roleElem      = slot.querySelector('[class^="title___"]');
            const chanceElem    = slot.querySelector('[class^="successChance___"]');
            if (!roleElem || !chanceElem) return;

            const rawRole       = roleElem.innerText.trim();
            const successChance = parseInt(chanceElem.textContent.trim(), 10) || 0;
            const joinBtn       = slot.querySelector("button[class^='torn-btn joinButton']");

            // find thresholds
            const ocData = ocRoles.find(o => o.OCName.toLowerCase() === ocName.toLowerCase());
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
            const userName   = honorTexts.length > 1 ? honorTexts[1].textContent.trim() : null;

            // color & disable logic
            if (!userName) {
                slot.style.backgroundColor = successChance < required
                    ? '#ff000061'  // redish
                    : '#21a61c61'; // greenish
                if (joinBtn && successChance < required) {
                    joinBtn.textContent="DISABLED";
                    joinBtn.setAttribute('disabled', '');
                }
            } else if (successChance < required) {
                slot.style.outline = '4px solid red';
                slot.style.outlineOffset = '0px';
            }
        });
    }

    function searchPage() {
      const orgCrimes = qa('div[class^="wrapper___"][data-oc-id]');
      orgCrimes.forEach(processScenario);
    }

    const observer = new MutationObserver(() => searchPage());
    observer.observe(document.body, { childList: true, subtree: true });

})();
