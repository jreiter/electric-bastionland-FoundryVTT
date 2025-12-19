const { ItemSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Electric Bastionland Item Sheet (ApplicationV2)
 * @extends {ItemSheetV2}
 */
export class ElectricBastionlandItemSheetV2 extends HandlebarsApplicationMixin(ItemSheetV2) {
  
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["electricbastionland", "sheet", "item"],
    position: {
      width: 420,
      height: 440,
    },
    actions: {},
    window: {
      icon: "fa-solid fa-suitcase",
    },
  };

  /** @override */
  static PARTS = {
    sheet: {
      template: "systems/electricbastionland/templates/item/item-sheet-v2.hbs",
    },
  };

  /** @override */
  tabGroups = {
    primary: "description",
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    // Add item and system data for template access
    context.item = this.document;
    context.systemData = this.document.system;
    context.system = this.document.system;
    context.editable = this.isEditable;

    // Enrich description for editor
    context.enrichedDescription = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
      this.document.system.description,
      {
        async: true,
        secrets: this.document.isOwner,
        relativeTo: this.document,
      },
    );

    return context;
  }

  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);

    // Add change listeners to form inputs
    const form = this.element.querySelector("form");
    if (form) {
      form.addEventListener("change", this._onFormChange.bind(this));
      form.addEventListener("input", this._onFormInput.bind(this));
    }
  }

  /**
   * Handle form changes (for inputs, selects, checkboxes)
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
  }

  /**
   * Handle form input events (for text fields that update on every keystroke)
   * @param {Event} event
   */
  _onFormInput(event) {
    const target = event.target;
    
    // For text inputs that should update immediately (like name)
    if (target.name === "name") {
      // Debounce the update to avoid too many database writes
      clearTimeout(this._inputTimeout);
      this._inputTimeout = setTimeout(async () => {
        await this.document.update({ [target.name]: target.value });
      }, 500);
    }
  }
}
