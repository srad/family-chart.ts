import { Person, Spouse } from "./CalculateTree";
import { getCardsToMain, getMid, handleProgenySide, handleSpouse, Link, linkId, LinkType, sameArray } from "./LinkUtils";

export type NodeInfo = {
  is_ancestry: boolean;
  x: number;
  y: number;
  sx: number;
  sy: number;
  depth: number;
  data: Person;
  parents: NodeInfo[];
  spouse: Spouse;
  children: NodeInfo[];
}

export function linkBuilder({ d, tree, is_horizontal = false }: { d: NodeInfo, tree: NodeInfo[], is_horizontal: boolean }) {
  const links: LinkType[] = [];

  if (d.data.rels.spouses && d.data.rels.spouses.length > 0) {
    handleSpouse({ d, tree, links });
  }
  handleAncestrySide(d);
  handleProgenySide({ d, tree, is_horizontal, links });

  return links;

  function handleAncestrySide(d: NodeInfo) {
    if (!d.parents) {
      return;
    }
    const p1 = d.parents[0];
    const p2 = d.parents[1] || p1;

    const p = { x: getMid(p1, p2, "x"), y: getMid(p1, p2, "y") };

    links.push({
      d: Link(d, p, is_horizontal),
      _d: () => {
        const _d = { x: d.x, y: d.y },
          _p = { x: d.x, y: d.y };
        return Link(_d, _p, is_horizontal);
      },
      curve: true,
      id: linkId(d, p1, p2),
      depth: d.depth + 1,
      is_ancestry: true,
      source: d,
      target: [ p1, p2 ]
    });
  }
}

export function pathToMain(cards, links, datum, main_datum) {
  const is_ancestry = datum.is_ancestry;
  const links_data = links.data();
  let links_node_to_main = [];
  let cards_node_to_main = [];

  if (is_ancestry) {
    const links_to_main = [];

    let parent = datum;
    let itteration1 = 0;
    while (parent !== main_datum.data && itteration1 < 100) {
      itteration1++;  // to prevent infinite loop
      const spouse_link = links_data.find(d => d.spouse === true && (d.source === parent || d.target === parent));
      if (spouse_link) {
        const child_link = links_data.find(d => Array.isArray(d.target) && d.target.includes(spouse_link.source) && d.target.includes(spouse_link.target));
        if (!child_link) {
          break;
        }
        links_to_main.push(spouse_link);
        links_to_main.push(child_link);
        parent = child_link.source;
      } else {
        // single parent
        const child_link = links_data.find(d => Array.isArray(d.target) && d.target.includes(parent));
        if (!child_link) {
          break;
        }
        links_to_main.push(child_link);
        parent = child_link.source;
      }
    }
    links.each(function (d) {
      if (links_to_main.includes(d)) {
        links_node_to_main.push({ link: d, node: this });
      }
    });

    const cards_to_main = getCardsToMain(datum, links_to_main, main_datum, datum);
    cards.each(function (d) {
      if (cards_to_main.includes(d)) {
        cards_node_to_main.push({ card: d, node: this });
      }
    });
  } else if (datum.spouse && datum.spouse.data === main_datum.data) {
    links.each(function (d) {
      if (d.target === datum) {
        links_node_to_main.push({ link: d, node: this });
      }
    });
    const cards_to_main = [ main_datum, datum ];
    cards.each(function (d) {
      if (cards_to_main.includes(d)) {
        cards_node_to_main.push({ card: d, node: this });
      }
    });
  } else {
    let links_to_main = [];

    let child = datum;
    let itteration1 = 0;
    while (child !== main_datum.data && itteration1 < 100) {
      itteration1++;  // to prevent infinite loop
      const child_link = links_data.find(d => d.target === child && Array.isArray(d.source));
      if (child_link) {
        const spouse_link = links_data.find(d => d.spouse === true && sameArray([ d.source, d.target ], child_link.source));
        links_to_main.push(child_link);
        links_to_main.push(spouse_link);
        if (spouse_link) {
          child = spouse_link.source;
        } else {
          child = child_link.source[0];
        }
      } else {
        const spouse_link = links_data.find(d => d.target === child && !Array.isArray(d.source));  // spouse link
        if (!spouse_link) {
          break;
        }
        links_to_main.push(spouse_link);
        child = spouse_link.source;
      }
    }

    links.each(function (d) {
      if (links_to_main.includes(d)) {
        links_node_to_main.push({ link: d, node: this });
      }
    });

    const cards_to_main = getCardsToMain(main_datum, links_to_main, main_datum, datum);
    cards.each(function (d) {
      if (cards_to_main.includes(d)) {
        cards_node_to_main.push({ card: d, node: this });
      }
    });
  }
  return [ cards_node_to_main, links_node_to_main ];
}