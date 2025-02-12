import { calculateEnterAndExitPositions } from "../CalculateTree/CalculateTree.handlers";
import { calculateDelay } from "./view";
import { getCardsViewFake } from "./view.html.handlers";
import { select } from "d3";
import { CardUpdateOptions } from "./view.cards";
import { DatumType } from "./Models/DatumType";

export default function updateCardsComponent(div: HTMLDivElement, tree, Card, props: CardUpdateOptions) {
  const card = select(getCardsViewFake(() => div)).selectAll("div.card_cont_fake").data(tree.data, (d: DatumType) => d.data.id),
    card_exit = card.exit(),
    card_enter = card.enter().append("div").attr("class", "card_cont_fake").style("display", "none"),
    card_update = card_enter.merge(card);

  card_exit.each(d => calculateEnterAndExitPositions(d, false, true));
  card_enter.each(d => calculateEnterAndExitPositions(d, true, false));

  card_exit.each(cardExit);
  card.each(cardUpdateNoEnter);
  card_enter.each(cardEnter);
  card_update.each(cardUpdate);

  function cardEnter(d) {
    const card_element = select(Card(d));

    card_element
      .style("position", "absolute")
      .style("top", "0").style("left", "0").style("opacity", 0)
      .style("transform", `translate(${d._x}px, ${d._y}px)`);
  }

  function cardUpdateNoEnter(d) {
  }

  function cardUpdate(d) {
    const card_element = select(Card(d));
    const delay = props.initial ? calculateDelay(tree, d, props.transition_time) : 0;
    card_element.transition().duration(props.transition_time).delay(delay).style("transform", `translate(${d.x}px, ${d.y}px)`).style("opacity", 1);
  }

  function cardExit(d) {
    const card_element = select(Card(d));
    const g = select(this);
    card_element.transition().duration(props.transition_time).style("opacity", 0).style("transform", `translate(${d._x}px, ${d._y}px)`)
      .on("end", () => g.remove()); // remove the card_cont_fake
  }
}
