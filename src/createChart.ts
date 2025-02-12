import editTree from "./CreateTree/editTree";
import createSvg from "./view/view.svg";
import { createHtmlSvg, onZoomSetup } from "./view/view.html.handlers";
import createStore from "./createStore";
import { removeToAddFromData } from "./CreateTree/form";
import { CardBase } from "./Cards/CardBase";
import { CardSvg } from "./Cards/CardSvg";
import view from "./view/view";
import { DatumType } from "./view/Models/DatumType";
import { CardHtml } from "./Cards/CardHtml";
import CardElements from "./view/Elements/Card.elements";

type MyStore = {
  level_separation: number;
}

export class CreateChart extends CardBase<MyStore> {
  private transition_time: number;
  private is_card_html: boolean;
  private svgElement: SVGElement;
  
  constructor(cont: HTMLElement, data: DatumType) {
    super(cont, createStore({
      data,
      node_separation: 250,
      level_separation: 150,
      single_parent_empty_card: true,
      is_horizontal: false,
    }));

    this.transition_time = 2000;

    this.is_card_html = false;

    this.init(cont, data);

    return this;
  }

  init(cont: HTMLElement, data: DatumType[]) {
    this.cont = cont = setCont(cont);
    const getSvgView = () => cont.querySelector("svg .view");
    const getHtmlSvg = () => cont.querySelector("#htmlSvg");
    const getHtmlView = () => cont.querySelector("#htmlSvg .cards_view");

    this.svg = createSvg(cont, { onZoom: onZoomSetup(getSvgView, getHtmlView) });
    createHtmlSvg(cont);

    this.setCard(CardSvg); // set default card

    this.store.setOnUpdate(props => {
      if (this.beforeUpdate) {
        this.beforeUpdate(props);
      }
      props = Object.assign({ transition_time: this.transition_time }, props || {});
      if (this.is_card_html) {
        props = Object.assign({}, props || {}, { cardHtml: getHtmlSvg() });
      }
      view(this.store.getTree(), this.svg, this.getCard(), props || {});
      if (this.afterUpdate) {
        this.afterUpdate(props);
      }
    });
  }

  updateTreeselect(props = { initial: false }) {
    this.store.updateTree(props);
    return this;
  }

  updateDataselect(data: DatumType) {
    this.store.updateData(data);
    return this;
  }

  setCardYSpacingselect(card_y_spacing) {
    if (typeof card_y_spacing !== "number") {
      console.error("card_y_spacing must be a number");
      return this;
    }
    this.level_separation = card_y_spacing;
    this.store.state.level_separation = card_y_spacing;

    return this;
  }

  setCardXSpacingselect(card_x_spacing) {
    if (typeof card_x_spacing !== "number") {
      console.error("card_x_spacing must be a number");
      return this;
    }
    this.node_separation = card_x_spacing;
    this.store.state.node_separation = card_x_spacing;

    return this;
  }

  selectsetOrientationVerticalselect() {
    this.is_horizontal = false;
    this.store.state.is_horizontal = false;
    return this;
  }

  selectsetOrientationHorizontalselect() {
    this.is_horizontal = true;
    this.store.state.is_horizontal = true;
    return this;
  }

  selectsetSingleParentEmptyCardselect(single_parent_empty_card, { label = "Unknown" } = {}) {
    this.single_parent_empty_card = single_parent_empty_card;
    this.store.state.single_parent_empty_card = single_parent_empty_card;
    this.store.state.single_parent_empty_card_label = label;
    if (this.editTreeInstance && this.editTreeInstance.addRelativeInstance.is_active) {
      this.editTreeInstance.addRelativeInstance.onCancel();
    }
    removeToAddFromData(this.store.getData() || []);
    return this;
  };

  setCard(card: CardHtml) {
    this.is_card_html = card.is_html;

    if (this.is_card_html) {
      this.svg.querySelector(".cards_view").innerHTML = "";
      this.cont.querySelector("#htmlSvg").style.display = "block";
    } else {
      this.cont.querySelector("#htmlSvg .cards_view").innerHTML = "";
      this.cont.querySelector("#htmlSvg").style.display = "none";
    }

    const card = card(this.cont, this.store);
    this.getCard = () => card.getCard();

    return card;
  };

  selectsetTransitionTimeselect(transition_time) {
    this.transition_time = transition_time;

    return this;
  };

  selecteditTreeselect() {
    return this.editTreeInstance = editTree(this.cont, this.store);
  };

  selectupdateMainselect(d) {
    this.store.updateMainId(d.data.id);
    this.store.updateTree({});

    return this;
  };

  selectupdateMainIdselect(id) {
    this.store.updateMainId(id);

    return this;
  };

  selectgetMainDatumselect() {
    return this.store.getMainDatum();
  };

  selectgetDataJsonselect(fn) {
    const data = this.store.getData();
    return f3.handlers.cleanupDataJson(JSON.stringify(data));
  }

  selectsetBeforeUpdateselect(fn) {
    this.beforeUpdate = fn;
    return this;
  }

  selectsetAfterUpdateselect(fn) {
    this.afterUpdate = fn;
    return this;
  }
}

function setCont(cont) {
  if (typeof cont === "string") {
    cont = document.querySelector(cont);
  }
  return cont;
}
