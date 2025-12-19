// Import Modules
import { ElectricBastionlandActor } from "./actor/actor.js";
import { ElectricBastionlandActorSheet } from "./actor/actor-sheet.js";
import { ElectricBastionlandActorSheetV2 } from "./actor/actor-sheet-v2.js";
import { ElectricBastionlandItem } from "./item/item.js";
import { ElectricBastionlandItemSheet } from "./item/item-sheet.js";
import { ElectricBastionlandItemSheetV2 } from "./item/item-sheet-v2.js";

const { ActorSheet, ItemSheet } = foundry.appv1.sheets;
const { Actors, Items } = foundry.documents.collections;

Hooks.once("init", async function () {
  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);

  // Register ApplicationV2 sheet
  foundry.applications.apps.DocumentSheetConfig.registerSheet(
    ElectricBastionlandActor,
    "electricbastionland",
    ElectricBastionlandActorSheetV2,
    {
      makeDefault: true,
      label: "Electric Bastionland Character Sheet",
    },
  );

  Items.unregisterSheet("core", ItemSheet);

  // Register ApplicationV2 item sheet
  foundry.applications.apps.DocumentSheetConfig.registerSheet(
    ElectricBastionlandItem,
    "electricbastionland",
    ElectricBastionlandItemSheetV2,
    {
      makeDefault: true,
      label: "Electric Bastionland Item Sheet",
    },
  );

  game.electricbastionland = {
    apps: {
      ElectricBastionlandActorSheet,
      ElectricBastionlandItemSheet,
    },
    entitie: {
      ElectricBastionlandActor,
      ElectricBastionlandItem,
    },
  };

  // Define custom Entity classes
  CONFIG.Actor.documentClass = ElectricBastionlandActor;
  CONFIG.Item.documentClass = ElectricBastionlandItem;

  // If you need to add Handlebars helpers, here are a few useful examples:
  Handlebars.registerHelper("concat", function () {
    let outStr = "";

    for (var arg in arguments) {
      if (typeof arguments[arg] != "object") {
        outStr += arguments[arg];
      }
    }

    return outStr;
  });

  Handlebars.registerHelper("toLowerCase", function (str) {
    return str.toLowerCase();
  });

  Handlebars.registerHelper("boldIf", function (cond, options) {
    return cond ? "<b>" + options.fn(this) + "</b>" : options.fn(this);
  });
});
