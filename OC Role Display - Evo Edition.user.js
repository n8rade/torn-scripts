// ==UserScript==
// @name         OC Role Display - Evo Edition
// @version      2.4.5.3
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

    // Inject pulse animation
    const style = document.createElement('style');
    style.innerHTML = `
    @keyframes pulseRed {
        0% { box-shadow: 0 0 8px red; }
        50% { box-shadow: 0 0 18px red; }
        100% { box-shadow: 0 0 8px red; }
    }
    .pulse-border-red {
        animation: pulseRed 1s infinite;
    }
    `;
    document.head.appendChild(style);


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
                "BOMBER": 64,
                "ENGINEER": 62,
                "SNIPER": 65,
                "LOOKOUT": 64,
                "MUSCLE #1": 63,
                "MUSCLE #2": 63
            }
      },
      {
        //Level 9 Elaborate
            OCName: "Gone Fission",
            Positions: {
                "BOMBER": 66,
                "ENGINEER": 62,
                "HIJACKER": 64,
                "IMITATOR": 66,
                "PICKPOCKET": 66
            }
      },
      {
        //Level 9 Elaborate
            OCName: "Ace in the Hole",
            Positions: {
                "HACKER": 67,
                "DRIVER": 57,
                "MUSCLE #1": 65,
                "IMITATOR": 67,
                "MUSCLE #2": 67
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
                "HACKER": 65,
                "IMITATOR": 72,
                "CAT BURGLAR": 64,
                "DRIVER": 57
            }
      },
      {
        //Level 8 Advanced
            OCName: "Break the Bank",
            Positions: {
                "ROBBER": 65,
                "MUSCLE #1": 65,
                "THIEF #1": 60,
                "MUSCLE #2": 65,
                "MUSCLE #3": 72,
                "THIEF #2": 72
            }
      },
      {
        //Level 8 Advanced
            OCName: "Clinical Precision",
            Positions: {
                "ASSASSIN": 65,
                "CAT BURGLAR": 65,
                "CLEANER": 65,
                "IMITATOR": 72,
            }
      },
      {
        //Level 7 Advanced
            OCName: "Blast From The Past",
            Positions: {
                "PICKLOCK #1": 60,
                "HACKER": 60,
                "ENGINEER": 75,
                "BOMBER": 60,
                "MUSCLE": 75,
                "PICKLOCK #2": 60
            }
      },
      {
            OCName: "Bidding War",
            Positions: `default_${defaultLevel6}`
      },
      {
            OCName: "Honey Trap",
            Positions: `default_${defaultLevel6}`
      },
      {
            OCName: "Leave No Trace",
            Positions: `default_${defaultLevel5}`
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

    function processScenario(panel) {
        if (panel.classList.contains('role-processed')) return;
        panel.classList.add('role-processed');

        const ocName = panel.querySelector('.panelTitle___aoGuV')?.innerText.trim() || "Unknown";
        const slots = panel.querySelectorAll('.wrapper___Lpz_D');

        Array.from(slots).forEach(slot => {
            // get raw role text and chance
            const roleElem      = slot.querySelector('.title___UqFNy');
            const chanceElem    = slot.querySelector('.successChance___ddHsR');
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
                slot.classList.add('pulse-border-red');
                slot.style.outline = '4px solid red';
                slot.style.outlineOffset = '0px';
            }
        });
    }

    const observer = new MutationObserver(mutations => {
        mutations.forEach(m => {
            m.addedNodes.forEach(node => {
                if (node.nodeType !== 1) return;
                if (node.matches('.wrapper___U2Ap7')) {
                    processScenario(node);
                } else {
                    node.querySelectorAll?.('.wrapper___U2Ap7').forEach(processScenario);
                }
            });
        });
    });

    const targetNode = document.querySelector('#factionCrimes-root') || document.body;
    observer.observe(targetNode, { childList: true, subtree: true });

    window.addEventListener('load', () => {
        document.querySelectorAll('.wrapper___U2Ap7').forEach(processScenario);
    });

})();
