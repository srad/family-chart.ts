import { updateCardSvgDefs } from "../view/elements/Card.defs";
import { processCardDisplay } from "./utils";
import { CardBase, Store } from "./CardBase";
import { select } from "d3";
import { Card } from "../view/elements/Card";
import { PersonData } from "../CalculateTree/CalculateTree";

export default function CardSvgWrapper(cont: HTMLElement, store: Store<PersonData>) {
  return new CardSvg(cont, store);
}

export class CardSvg extends CardBase<PersonData> {
  private mini_tree: boolean;
  private link_break: boolean;

  constructor(cont: HTMLElement, store: Store<PersonData>) {
    super(cont, store);
    this.card_dim = { w: 220, h: 70, text_x: 75, text_y: 15, img_w: 60, img_h: 60, img_x: 5, img_y: 5 };
    this.card_display = [ d => `${d.data["first name"]} ${d.data["last name"]}` ];
    this.mini_tree = true;
    this.link_break = false;
    this.onCardClick = this.onCardClickDefault;
    this.is_html = false;

    this.svg = this.cont.querySelector("svg.main_svg");

    this.getCard = () => Card({
      store: this.store,
      svg: this.svg,
      card_dim: this.card_dim,
      card_display: this.card_display,
      mini_tree: this.mini_tree,
      link_break: this.link_break,
      onCardClick: this.onCardClick,
      onCardUpdate: this.onCardUpdate,
      onCardUpdates: this.onCardUpdates
    });
  }

  setCardDisplay(card_display) {
    this.card_display = processCardDisplay(card_display);
    return this;
  }

  setCardDim(card_dim) {
    if (typeof card_dim !== "object") {
      console.error("card_dim must be an object");
      return this;
    }
    for (let key in card_dim) {
      const val = card_dim[key];
      if (typeof val !== "number") {
        console.error(`card_dim.${key} must be a number`);
        return this;
      }
      if (key === "width") {
        key = "w";
      }
      if (key === "height") {
        key = "h";
      }
      this.card_dim[key] = val;
    }

    updateCardSvgDefs(this.svg, this.card_dim);

    return this;
  }

  setMiniTree(mini_tree) {
    this.mini_tree = mini_tree;

    return this;
  }

  setLinkBreak(link_break) {
    this.link_break = link_break;

    return this;
  }

  setCardTextSvg(cardTextSvg) {
    function onCardUpdate(d) {
      const card_node = select(this);
      const card_text = card_node.select(".card-text text");
      const card_text_g = card_text.node().parentNode;
      card_text_g.innerHTML = cardTextSvg(d.data);
    }

    onCardUpdate.id = "setCardTextSvg";
    if (!this.onCardUpdates) {
      this.onCardUpdates = [];
    }
    this.onCardUpdates = this.onCardUpdates.filter(fn => fn.id !== "setCardTextSvg");
    this.onCardUpdates.push(onCardUpdate);

    return this;
  }

  onCardClickDefault(e, d) {
    this.store.updateMainId(d.data.id);
    this.store.updateTree({});
  }

  setOnCardClick(onCardClick) {
    this.onCardClick = onCardClick;

    return this;
  }
}
