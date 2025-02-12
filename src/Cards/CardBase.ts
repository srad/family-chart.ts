import type { SvgNode } from "../view/view.handlers.ts";
import { Person } from "../CalculateTree/CalculateTree";
import { DatumType } from "../view/Models/DatumType";

export type Store<T> = {
  state: T;
  updateMainId(id: string): void;
  updateTree(param: {}): void;
  getTreeMainDatum(): string;
  getDatum(id: string): Person;
  getLastAvailableMainDatum(): DatumType;
  updateData(data: Person[] | Person): void;
  getData(): Person[];
  getMainDatum(): Person;
  getMainId(): string;
};

export type CardDim = {
  height_auto?: boolean;
  w: number;
  h: number;
  text_x: number;
  text_y: number;
  img_w: number;
  img_h: number;
  img_x: number;
  img_y: number
};

export abstract class CardBase<T> {
  protected card_display: ((d: any) => string)[] | null = null;
  protected card_dim: CardDim | null = null;
  protected getCard?: () => void;
  protected cont: Element;
  protected store: Store<T>;
  public is_html: boolean = false;
  protected svg: SvgNode | Element | null = null;
  protected onCardUpdate: (() => void) | null = null;
  protected onCardClick: ((e: Event, d: Element) => void) | null = null;
  protected onCardMouseenter: (() => void) | null = null;
  protected onCardMouseleave: (() => void) | null = null;
  protected node_separation: number;
  protected level_separation: number;
  protected single_parent_empty_card: boolean;
  protected is_horizontal: boolean;
  protected beforeUpdate?: () => void = null;
  protected afterUpdate?: () => void = null;

  // TODO: Really?
  protected onCardUpdates: ({ (d: any): void; id: string; })[] | null = null;

  protected constructor(cont: Element, store: Store<T>) {
    this.cont = cont;
    this.store = store;
  }

  public getDim(): CardDim | null {
    return this.card_dim;
  }
}
