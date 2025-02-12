import { line as d3line, curveMonotoneY, curveBasis } from 'd3';

export default function Link({ d, entering, exiting }) {
  const path = createPath(d, entering, exiting);

  return {
    template: (`
    <path d="${path}" fill="none" stroke="#fff" />
  `)
  };
}

// TODO: exiting was missing
export function createPath(d, is_ = false, exiting = false) {
  const line = d3line().curve(curveMonotoneY),
    lineCurve = d3line().curve(curveBasis),
    path_data = is_ ? d._d() : d.d;

  if (!d.curve) {
    return line(path_data);
  } else if (d.curve === true) {
    return lineCurve(path_data);
  }
}
