import { BaseType, select } from 'd3';
import { DatumType } from "./Models/DatumType";

export function assignUniqueIdToTreeData(div: BaseType, tree_data) {
  const card = select(div)
    .selectAll('div.card_cont_2fake')
    .data(tree_data, (d: DatumType) => d.data.id);  // how this doesn't break if there is multiple cards with the same id?

  const card_exit = card.exit();
  const card_enter = card.enter().append('div').attr('class', 'card_cont_2fake').style('display', 'none').attr('data-id', () => Math.random());
  const card_update = card_enter.merge(card);

  card_exit.each(cardExit);
  card_enter.each(cardEnter);
  card_update.each(cardUpdate);

  function cardEnter(d) {
    d.unique_id = select(this).attr('data-id');
  }

  function cardUpdate(d) {
    d.unique_id = select(this).attr('data-id');
  }

  function cardExit(d) {
    d.unique_id = select(this).attr('data-id');
    select(this).remove();
  }
}

export function setupHtmlSvg(getHtmlSvg) {
  select(getHtmlSvg()).append('div').attr('class', 'cards_view_fake').style('display', 'none');  // important for handling data
}

export function getCardsViewFake(getHtmlSvg: () => HTMLElement): BaseType {
  return select(getHtmlSvg()).select('div.cards_view_fake').node();
}

export function onZoomSetup(getSvgView: () => Element, getHtmlView: () => Element) {
  return function onZoom(e) {
    const t = e.transform;

    select(getSvgView()).style('transform', `translate(${t.x}px, ${t.y}px) scale(${t.k}) `);
    select(getHtmlView()).style('transform', `translate(${t.x}px, ${t.y}px) scale(${t.k}) `);
  };
}

export function setupReactiveTreeData(getHtmlSvg) {
  let tree_data = [];

  return function getReactiveTreeData(new_tree_data) {
    const tree_data_exit = getTreeDataExit(new_tree_data, tree_data);
    tree_data = [ ...new_tree_data, ...tree_data_exit ];
    assignUniqueIdToTreeData(getCardsViewFake(getHtmlSvg), tree_data);
    return tree_data;
  };
}

export function createHtmlSvg(cont: HTMLElement) {
  const f3Canvas = select(cont).select('#f3Canvas');
  const cardHtml = f3Canvas.append('div').attr('id', 'htmlSvg')
    .attr('style', 'position: absolute; width: 100%; height: 100%; z-index: 2; top: 0; left: 0');
  cardHtml.append('div').attr('class', 'cards_view').style('transform-origin', '0 0');
  setupHtmlSvg(() => cardHtml.node());

  return cardHtml.node();
}

function getTreeDataExit(new_tree_data, old_tree_data) {
  if (old_tree_data.length > 0) {
    return old_tree_data.filter(d => !new_tree_data.find(t => t.data.id === d.data.id));
  } else {
    return [];
  }
}

export function getUniqueId(d) {
  return d.unique_id;
}
