import { NodeInfo } from "./LinkBuilder";

export type LinkType = {
  d: [ number, number ][],
  _d: () => [ number, number ][],
  curve: boolean;
  id: string;
  depth: number;
  spouse?: boolean;
  is_ancestry: boolean;
  source: [ NodeInfo, NodeInfo ] | NodeInfo; // TODO: Too many adhoc things going on here.
  target: NodeInfo[] | NodeInfo;
};

export function handleProgenySide({ d, is_horizontal, links, tree }: { d: NodeInfo, tree: NodeInfo[], links: LinkType[], is_horizontal: boolean }) {
  if (!d.children || d.children.length === 0) {
    return;
  }

  d.children.forEach(child => {
    const other_parent = otherParent(child, d, tree) || d;
    const sx = other_parent.sx;

    const parent_pos = !is_horizontal ? { x: sx, y: d.y } : { x: d.x, y: sx };
    links.push({
      d: Link(child, parent_pos, is_horizontal),
      _d: () => Link(parent_pos, { x: _or(parent_pos, "x"), y: _or(parent_pos, "y") }, is_horizontal),
      curve: true,
      id: linkId(child, d, other_parent),
      depth: d.depth + 1,
      is_ancestry: false,
      source: [ d, other_parent ],
      target: child
    });
  });
}

export function handleSpouse({ d, tree, links }: { d: NodeInfo, tree: NodeInfo[], links: LinkType[] }) {
  d.data.rels.spouses.forEach(sp_id => {
    const spouse = getRel(d, tree, d0 => d0.data.id === sp_id);
    if (!spouse || d.spouse) {
      return;
    }
    links.push({
      d: [ [ d.x, d.y ], [ spouse.x, spouse.y ] ],
      _d: () => [
        d.is_ancestry ? [ _or(d, "x") - .0001, _or(d, "y") ] : [ d.x, d.y ], // add -.0001 to line to have some length if d.x === spouse.x
        d.is_ancestry ? [ _or(spouse, "x"), _or(spouse, "y") ] : [ d.x - .0001, d.y ]
      ],
      curve: false,
      id: linkId(d, spouse),
      depth: d.depth,
      spouse: true,
      is_ancestry: spouse.is_ancestry,
      source: d,
      target: spouse
    });
  });
}

export function getMid(d1, d2, side, is_ = false) {
  if (is_) {
    return _or(d1, side) - (_or(d1, side) - _or(d2, side)) / 2;
  } else {
    return d1[side] - (d1[side] - d2[side]) / 2;
  }
}

export function _or(d, k) {
  return d.hasOwnProperty("_" + k) ? d["_" + k] : d[k];
}

export function Link(d, p, is_horizontal: boolean): [ number, number ][] {
  return is_horizontal ? LinkHorizontal(d, p) : LinkVertical(d, p);
}

export function LinkVertical(d: NodeInfo, p: NodeInfo): [ number, number ][] {
  const hy = (d.y + (p.y - d.y) / 2);

  return [
    [ d.x, d.y ],
    [ d.x, hy ],
    [ d.x, hy ],
    [ p.x, hy ],
    [ p.x, hy ],
    [ p.x, p.y ],
  ];
}

export function LinkHorizontal(d, p): [ number, number ][] {
  const hx = (d.x + (p.x - d.x) / 2);

  return [
    [ d.x, d.y ],
    [ hx, d.y ],
    [ hx, d.y ],
    [ hx, p.y ],
    [ hx, p.y ],
    [ p.x, p.y ],
  ];
}

export function linkId(...args): string {
  return args.map(d => d.data.id).sort().join(", ");  // make unique id
}

export function otherParent(child: NodeInfo, p1, data): NodeInfo {
  const condition = d0 => (d0.data.id !== p1.data.id) && ((d0.data.id === child.data.rels.mother) || (d0.data.id === child.data.rels.father));
  return getRel(p1, data, condition);
}

// if there is overlapping of personas in different branches of same family tree, return the closest one
export function getRel(d: NodeInfo, data: NodeInfo[], condition: (node: NodeInfo) => boolean): NodeInfo {
  const rels = data.filter(condition);
  const dist_xy = (a, b) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  if (rels.length > 1) {
    return rels.sort((d0, d1) => dist_xy(d0, d) - dist_xy(d1, d))[0];
  } else {
    return rels[0];
  }
}

export function sameArray(arr1: any[], arr2: any[]) {
  return arr1.every(d1 => arr2.some(d2 => d1 === d2));
}

export function getCardsToMain(first_parent: NodeInfo, links_to_main, main_datum, datum) {
  const all_cards = links_to_main.filter(d => d).reduce((acc, d) => {
    if (Array.isArray(d.target)) {
      acc.push(...d.target);
    } else {
      acc.push(d.target);
    }
    if (Array.isArray(d.source)) {
      acc.push(...d.source);
    } else {
      acc.push(d.source);
    }
    return acc;
  }, []);

  const cards_to_main = [ main_datum, datum ];
  getChildren(first_parent);
  return cards_to_main;

  function getChildren(d) {
    if (d.data.rels.children) {
      d.data.rels.children.forEach(child_id => {
        const child = all_cards.find(d0 => d0.data.id === child_id);
        if (child) {
          cards_to_main.push(child);
          getChildren(child);
        }
      });
    }
  }
}