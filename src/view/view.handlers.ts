import { select, zoomIdentity } from "d3";

export class SvgNode extends Element {
  public __zoomObj: any; // TODO: Is this some d3 super duper object?
  public  __zoom: boolean;
  public transform: string;
  public parentNode: SvgNode;
}

function positionTree({ t, svg, transition_time = 2000 }: { t: { x: number; y: number, k: number }, svg: SvgNode, transition_time: number, with_transition: boolean }) {
  const el_listener = svg.__zoomObj ? svg : svg.parentNode;  // if we need listener for svg and html, we will use parent node
  // TODO: What is going on here? Why parent node?
  const zoom = el_listener.__zoomObj;

  select(el_listener)
    .transition()
    .duration(transition_time || 0)
    .delay(transition_time ? 100 : 0)  // delay 100 because of weird error of undefined something in d3 zoom
    .call(zoom.transform, zoomIdentity.scale(t.k).translate(t.x, t.y));
}

export type TreeFitOptions = {
  svg: SvgNode;
  svg_dim: SvgDim;
  tree_dim: TreeDim;
  with_transition?: boolean;
  transition_time: number;
};

export function treeFit({ svg, svg_dim, tree_dim, with_transition, transition_time }: TreeFitOptions) {
  const t = calculateTreeFit(svg_dim, tree_dim);
  positionTree({ t, svg, with_transition, transition_time });
}

export type SvgDim = {
  x: number, y: number, k: number, width?: number, height?: number;
};

export type TreeDim = {
  x_off: number;
  y_off: number;
  height: number;
  width: number;
};

export function calculateTreeFit(svg_dim: SvgDim, tree_dim: TreeDim): SvgDim {
  let k = Math.min(svg_dim.width / tree_dim.width, svg_dim.height / tree_dim.height);
  if (k > 1) {
    k = 1;
  }
  const x = tree_dim.x_off + (svg_dim.width - tree_dim.width * k) / k / 2;
  const y = tree_dim.y_off + (svg_dim.height - tree_dim.height * k) / k / 2;

  return { k, x, y };
}

export function cardToMiddle({ datum, svg, svg_dim, scale, transition_time }) {
  const k = scale || 1, x = svg_dim.width / 2 - datum.x * k, y = svg_dim.height / 2 - datum.y,
    t = { k, x: x / k, y: y / k };
  positionTree({ t, svg, with_transition: true, transition_time });
}
