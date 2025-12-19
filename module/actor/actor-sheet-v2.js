const { ActorSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Electric Bastionland Actor Sheet (ApplicationV2)
 * @extends {ActorSheetV2}
 */
export class ElectricBastionlandActorSheetV2 extends HandlebarsApplicationMixin(
  ActorSheetV2,
) {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["electricbastionland", "sheet", "actor"],
    position: {
      width: 500,
      height: 600,
    },
    actions: {
      rollAbility: ElectricBastionlandActorSheetV2.prototype._onRollAbility,
      rollItem: ElectricBastionlandActorSheetV2.prototype._onRollItem,
      rollLuck: ElectricBastionlandActorSheetV2.prototype._onRollLuck,
      rest: ElectricBastionlandActorSheetV2.prototype._onRest,
      restore: ElectricBastionlandActorSheetV2.prototype._onRestore,
      createItem: ElectricBastionlandActorSheetV2.prototype._onCreateItem,
      editItem: ElectricBastionlandActorSheetV2.prototype._onEditItem,
      deleteItem: ElectricBastionlandActorSheetV2.prototype._onDeleteItem,
    },
    window: {
      icon: "fa-solid fa-user",
      resizable: true,
    },
  };

  /** @override */
  static PARTS = {
    sheet: {
      template:
        "systems/electricbastionland/templates/actor/actor-sheet-v2.hbs",
    },
  };

  /** @override */
  tabGroups = {
    primary: "description",
  };

  /**
   * Override to prevent rendering when an item sheet is open
   * This prevents scroll position from resetting when editing items
   * @override
   */
  async render(options = {}, _options = {}) {
    if (this._suppressRenderOnItemUpdate) {
      return this;
    }
    return super.render(options, _options);
  }

  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);

    // Manually activate tab listeners since ApplicationV2 doesn't do it automatically
    const tabLinks = this.element.querySelectorAll(
      '[data-group="primary"][data-tab]',
    );
    for (const link of tabLinks) {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        const tab = event.currentTarget.dataset.tab;
        this._onChangeTab(event, "primary", tab);
      });
    }

    // Show the active tab
    this._activateTab(this.tabGroups.primary);

    // Add form change listeners to update actor data
    const form = this.element.querySelector("form");
    if (form) {
      form.addEventListener("change", this._onFormChange.bind(this));
    }
  }

  /**
   * Handle form changes
   * @param {Event} event
   */
  async _onFormChange(event) {
    const target = event.target;
    const name = target.name;

    if (!name) return;

    let value;
    if (target.type === "checkbox") {
      value = target.checked;
    } else if (target.dataset.dtype === "Number") {
      value = parseFloat(target.value) || 0;
    } else {
      value = target.value;
    }

    await this.document.update({ [name]: value });
    this.render();
  }

  /**
   * Handle changing tabs
   * @param {Event} event
   * @param {string} group
   * @param {string} tab
   */
  _onChangeTab(event, group, tab) {
    this.tabGroups[group] = tab;
    this._activateTab(tab);
  }

  /**
   * Activate a specific tab
   * @param {string} tabName
   */
  _activateTab(tabName) {
    const tabs = this.element.querySelectorAll('.tab[data-group="primary"]');
    const links = this.element.querySelectorAll(
      '[data-group="primary"][data-tab]',
    );

    for (const tab of tabs) {
      tab.classList.toggle("active", tab.dataset.tab === tabName);
    }

    for (const link of links) {
      link.classList.toggle("active", link.dataset.tab === tabName);
    }
  }

  /** @override */
  async _preparePartContext(partId, context, options) {
    const partContext = await super._preparePartContext(
      partId,
      context,
      options,
    );

    // Add actor and system data for template access
    partContext.actor = this.document;
    partContext.systemData = this.document.system;
    partContext.system = this.document.system;
    partContext.editable = this.isEditable;

    // Convert items collection to array for Handlebars iteration
    partContext.items = Array.from(this.document.items);

    // Enrich biography for editor
    partContext.enrichedBiography =
      await foundry.applications.ux.TextEditor.implementation.enrichHTML(
        this.document.system.biography,
        {
          async: true,
          secrets: this.document.isOwner,
          relativeTo: this.document,
        },
      );

    return partContext;
  }

  /* -------------------------------------------- */
  /*  Action Handlers                              */
  /* -------------------------------------------- */

  /**
   * Handle rolling an ability save
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The target element
   */
  async _onRollAbility(event, target) {
    const ability = target.dataset.ability;
    const roll = new Roll(`d20`, this.document.system);
    const label = `${ability} save`;
    await roll.evaluate();

    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.document }),
      flavor: label,
    });
  }

  /**
   * Handle rolling item damage
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The target element
   */
  async _onRollItem(event, target) {
    const formula = target.dataset.roll;
    const label = target.dataset.label || "";

    if (formula) {
      const roll = new Roll(formula, this.document.system);
      await roll.evaluate();

      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.document }),
        flavor: label,
      });
    }
  }

  /**
   * Handle rolling luck
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The target element
   */
  async _onRollLuck(event, target) {
    const roll = new Roll("1d6");
    await roll.evaluate();

    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.document }),
      flavor: "Luck",
    });
  }

  /**
   * Handle rest action
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The target element
   */
  async _onRest(event, target) {
    if (!this.document.system.deprived) {
      await this.document.update({
        "system.hp.value": this.document.system.hp.max,
      });
      this.render();
    }
  }

  /**
   * Handle restore abilities action
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The target element
   */
  async _onRestore(event, target) {
    await this.document.update({
      "system.abilities.STR.value": this.document.system.abilities.STR.max,
      "system.abilities.DEX.value": this.document.system.abilities.DEX.max,
      "system.abilities.CHA.value": this.document.system.abilities.CHA.max,
    });
    this.render();
  }

  /**
   * Handle creating a new item
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The target element
   */
  async _onCreateItem(event, target) {
    const type = target.dataset.type;
    const name = `New ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    const itemData = {
      name: name,
      type: type,
      system: {},
    };

    await this.document.createEmbeddedDocuments("Item", [itemData]);
    this.render();
  }

  /**
   * Handle editing an item
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The target element
   */
  async _onEditItem(event, target) {
    const itemId = target.closest("[data-item-id]").dataset.itemId;
    const item = this.document.items.get(itemId);

    if (item) {
      // Suppress renders while the item sheet is open
      this._suppressRenderOnItemUpdate = true;

      // When the item sheet closes, re-enable renders but don't re-render immediately
      const sheet = item.sheet;
      const originalClose = sheet.close.bind(sheet);
      sheet.close = async function (options) {
        await originalClose(options);

        // Re-enable rendering for future updates
        this._suppressRenderOnItemUpdate = false;

        // Manually update just this item's row in the DOM without re-rendering the whole sheet
        this._updateItemRow(item);
      }.bind(this);

      sheet.render(true);
    }
  }

  /**
   * Handle deleting an item
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The target element
   */
  async _onDeleteItem(event, target) {
    const itemId = target.closest("[data-item-id]").dataset.itemId;
    await this.document.deleteEmbeddedDocuments("Item", [itemId]);
  }

  /**
   * Update a single item row in the DOM without re-rendering the entire sheet
   * @param {Item} item - The item to update
   */
  _updateItemRow(item) {
    const itemRow = this.element.querySelector(`[data-item-id="${item.id}"]`);
    if (!itemRow) return;

    // Find the item name span and update it
    const nameSpan = itemRow.querySelector(".item-name");
    if (nameSpan) {
      // Rebuild the item name display with quantity and equipped status
      const quantityText = item.system.quantity;
      const nameText = item.system.equipped ? `<b>${item.name}</b>` : item.name;
      nameSpan.innerHTML = `${quantityText} ${nameText}`;
    }

    // Update the item info spans (bulky, blast, armour, damage)
    const itemInfoContainer = nameSpan?.parentElement;
    if (itemInfoContainer) {
      // Remove old info spans
      const oldInfoSpans = itemInfoContainer.querySelectorAll(".item-info");
      oldInfoSpans.forEach((span) => span.remove());

      // Add new info spans
      if (item.system.bulky) {
        const bulkySpan = document.createElement("span");
        bulkySpan.className = "item-info";
        bulkySpan.textContent = "BULKY";
        itemInfoContainer.appendChild(bulkySpan);
      }
      if (item.system.blast) {
        const blastSpan = document.createElement("span");
        blastSpan.className = "item-info";
        blastSpan.textContent = "BLAST";
        itemInfoContainer.appendChild(blastSpan);
      }
      if (item.system.armour) {
        const armourSpan = document.createElement("span");
        armourSpan.className = "item-info";
        armourSpan.textContent = `Armour ${item.system.armour}`;
        itemInfoContainer.appendChild(armourSpan);
      }
      if (item.system.damageFormula) {
        const damageSpan = document.createElement("span");
        damageSpan.className = "item-info";
        damageSpan.textContent = `${item.system.damageFormula} damage`;
        itemInfoContainer.appendChild(damageSpan);
      }
    }

    // Also update the actor's armour display if item armour changed
    const armourDisplay = this.element
      .querySelector('[name="data.armour"], [for="data.armour"]')
      ?.closest(".resource")
      ?.querySelector("span");
    if (armourDisplay) {
      armourDisplay.textContent = this.document.system.armour;
    }
  }
}
