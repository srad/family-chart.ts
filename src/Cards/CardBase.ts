export type DatumType = {
  main_id: string;
  id: string;
  data: DatumType;
  _new_rel_data?: boolean;
}

export type Store = {
  state: { single_parent_empty_card_label: string }
  updateMainId(id: string): void;
  updateTree(param: {}): void;
  getTreeMainDatum(): string;
  getDatum(id: string): DatumType;
  getLastAvailableMainDatum(): string;
  updateData(data: DatumType): void;
  getData(): DatumType;
  getMainDatum(): DatumType;
  getMainId(): string;
};

export abstract class CardBase {
  protected card_display: ((d) => string)[];
  protected card_dim: { w: number; h: number; text_x: number; text_y: number; img_w: number; img_h: number; img_x: number; img_y: number };
  protected getCard?: () => void;
  protected cont: HTMLElement;
  protected store: Store;
  protected is_html: boolean = false;
  protected svg: SVGElement;
  protected onCardUpdate: () => void;
  protected onCardClick: (e, d) => void;
  protected onCardMouseenter: () => void;
  protected onCardMouseleave: () => void;

  // TODO: Really?
  protected onCardUpdates: ({ (d: any): void; id: string; })[];

  constructor(cont: HTMLElement, store: Store) {
    this.cont = cont;
    this.store = store;
  }
}