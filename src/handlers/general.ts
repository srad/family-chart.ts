import type { Person } from '../CalculateTree/CalculateTree.ts';
import { select } from 'd3';
import type { SvgNode } from '../view/view.handlers.ts';

export function manualZoom({ amount, svg, transition_time = 500 }: { amount: number; svg: SvgNode, transition_time: number }) {
  const zoom = svg.__zoomObj;
  select(svg).transition().duration(transition_time || 0).delay(transition_time ? 100 : 0)  // delay 100 because of weird error of undefined something in d3 zoom
    .call(zoom.scaleBy, amount);
}

export function isAllRelativeDisplayed(d: Person, data: Person[]) {
  const r = d.data.rels,
    all_rels = [r.father, r.mother, ...(r.spouses || []), ...(r.children || [])].filter(v => v);
  return all_rels.every(rel_id => data.some(d => d.data.id === rel_id));
}
