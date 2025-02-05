import editTree from './CreateTree/editTree';
import createSvg from './view/view.svg';
import { createHtmlSvg, onZoomSetup } from './view/view.html.handlers';
import createStore from './createStore';
import { removeToAddFromData } from './CreateTree/form';
import { CardBase, DatumType } from './Cards/CardBase';
import { CardSvg } from './Cards/CardSvg';
import view from './view/view';

export default function (...args) {
  return new CreateChart(...args);
}

type MyStore = {
  level_separation: number;
}

class CreateChart extends CardBase<MyStore> {
  private node_separation: number;
  private level_separation: number;
  private transition_time: number;
  private is_horizontal: boolean;
  private single_parent_empty_card: boolean;
  private is_card_html: boolean;

  constructor(cont: Element, data: DatumType) {
    super(cont, createStore({
      data,
      node_separation: this.node_separation,
      level_separation: this.level_separation,
      single_parent_empty_card: this.single_parent_empty_card,
      is_horizontal: this.is_horizontal
    }));

    this.node_separation = 250;
    this.level_separation = 150;
    this.is_horizontal = false;
    this.single_parent_empty_card = true;
    this.transition_time = 2000;

    this.is_card_html = false;

    this.beforeUpdate = null;
    this.afterUpdate = null;

    this.init(cont, data);

    return this;
  }

  selectinitselect(cont: HTMLElement, data: DatumType[]) {
    this.cont = cont = setCont(cont);
    const getSvgView = () => cont.querySelector('svg .view');
    const getHtmlSvg = () => cont.querySelector('#htmlSvg');
    const getHtmlView = () => cont.querySelector('#htmlSvg .cards_view');

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

  selectupdateTreeselect(props = { initial: false }) {
    this.store.updateTree(props);
    return this;
  }

  selectupdateDataselect(data: DatumType) {
    this.store.updateData(data);
    return this;
  }

  selectsetCardYSpacingselect(card_y_spacing) {
    if (typeof card_y_spacing !== 'number') {
      console.error('card_y_spacing must be a number');
      return this;
    }
    this.level_separation = card_y_spacing;
    this.store.state.level_separation = card_y_spacing;

    return this;
  }

  selectsetCardXSpacingselect(card_x_spacing) {
    if (typeof card_x_spacing !== 'number') {
      console.error('card_x_spacing must be a number');
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

  selectsetSingleParentEmptyCardselect(single_parent_empty_card, { label = 'Unknown' } = {}) {
    this.single_parent_empty_card = single_parent_empty_card;
    this.store.state.single_parent_empty_card = single_parent_empty_card;
    this.store.state.single_parent_empty_card_label = label;
    if (this.editTreeInstance && this.editTreeInstance.addRelativeInstance.is_active) {
      this.editTreeInstance.addRelativeInstance.onCancel();
    }
    removeToAddFromData(this.store.getData() || []);
    return this;
  };

  selectsetCardselect(Card) {
    this.is_card_html = Card.is_html;

    if (this.is_card_html) {
      this.svg.querySelector('.cards_view').innerHTML = '';
      this.cont.querySelector('#htmlSvg').style.display = 'block';
    } else {
      this.cont.querySelector('#htmlSvg .cards_view').innerHTML = '';
      this.cont.querySelector('#htmlSvg').style.display = 'none';
    }

    const card = Card(this.cont, this.store);
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
  if (typeof cont === 'string') {
    cont = document.querySelector(cont);
  }
  return cont;
}
