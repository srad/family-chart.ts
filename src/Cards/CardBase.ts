﻿import type { SvgNode } from '../view/view.handlers.ts';

export type DatumType = {
  main: boolean;
  main_id: string;
  id: string;
  data: DatumType;
  _new_rel_data?: boolean;
}

export type Store<T> = {
  state: T;
  updateMainId(id: string): void;
  updateTree(param: {}): void;
  getTreeMainDatum(): string;
  getDatum(id: string): DatumType;
  getLastAvailableMainDatum(): DatumType;
  updateData(data: DatumType): void;
  getData(): DatumType;
  getMainDatum(): DatumType;
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
  protected is_html: boolean = false;
  protected svg: SvgNode | null = null;
  protected onCardUpdate: (() => void) | null = null;
  protected onCardClick: ((e: Event, d: Element) => void) | null = null;
  protected onCardMouseenter: (() => void) | null = null;
  protected onCardMouseleave: (() => void) | null = null;

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
