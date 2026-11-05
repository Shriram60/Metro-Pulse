import { useEffect, useRef, useState } from 'react';

const HEIGHT = 280;
const MARGIN = { top: 28, right: 12, bottom: 32, left: 46 };
const GRID = [0, 25, 50, 75, 100];

function useWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(720);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, width];
}

const yFor = (value) => MARGIN.top + (1 - value / 100) * (HEIGHT - MARGIN.top - MARGIN.bottom);
const BASELINE = yFor(0);

function Grid({ width }) {
  return GRID.map((value) => (
    <g key={value} className="chart-grid">
      <line x1={MARGIN.left} x2={width - MARGIN.right} y1={yFor(value)} y2={yFor(value)} />
      <text x={MARGIN.left - 8} y={yFor(value) + 4} textAnchor="end">{value}%</text>
    </g>
  ));
}

function Tip({ x, y, width, title, value }) {
  const flip = x > width - 130;
  return (
    <div className="chart-tip" style={{ top: y, left: x, transform: `translate(${flip ? '-100%' : '0'}, -100%)` }}>
      <strong>{title}</strong> {value}%
    </div>
  );
}

function TableView({ caption, rows }) {
  return (
    <details className="chart-table">
      <summary>Show as a table</summary>
      <table className="table">
        <caption className="visually-hidden">{caption}</caption>
        <tbody>
          {rows.map(({ label, value }) => (
            <tr key={label}><th scope="row">{label}</th><td>{value}%</td></tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

const roundedTop = (x, y, width, baseline, radius = 4) => {
  const r = Math.min(radius, width / 2, baseline - y);
  return `M ${x} ${baseline} V ${y + r} Q ${x} ${y} ${x + r} ${y} H ${x + width - r} Q ${x + width} ${y} ${x + width} ${y + r} V ${baseline} Z`;
};

export function BarChart({ data, caption, highlight, highlightLabel, labelEvery = 3 }) {
  const [ref, width] = useWidth();
  const [hovered, setHovered] = useState(null);

  const step = (width - MARGIN.left - MARGIN.right) / data.length;
  const gap = 2;

  return (
    <figure className="chart" ref={ref}>
      <svg width={width} height={HEIGHT} role="img" aria-label={caption}>
        <Grid width={width} />
        {data.map((entry, index) => {
          const x = MARGIN.left + index * step;
          const y = yFor(entry.value);
          const isHighlight = index === highlight;
          return (
            <g key={entry.label}>
              <path
                d={roundedTop(x + gap / 2, y, step - gap, BASELINE)}
                className={`chart-bar${isHighlight ? ' chart-bar--now' : ''}${hovered === index ? ' is-hovered' : ''}`}
              />
              {isHighlight && (
                <text x={x + step / 2} y={y - 8} textAnchor="middle" className="chart-direct">{highlightLabel}</text>
              )}
              {index % labelEvery === 0 && (
                <text x={x + step / 2} y={BASELINE + 20} textAnchor="middle" className="chart-axis">{entry.label}</text>
              )}
              <rect
                x={x}
                y={MARGIN.top}
                width={step}
                height={BASELINE - MARGIN.top}
                className="chart-target"
                onMouseEnter={() => setHovered(index)}
                onMouseLeave={() => setHovered(null)}
              />
            </g>
          );
        })}
      </svg>
      {hovered !== null && (
        <Tip
          x={MARGIN.left + hovered * step + step / 2}
          y={yFor(data[hovered].value) - 8}
          width={width}
          title={data[hovered].label}
          value={data[hovered].value}
        />
      )}
      <TableView caption={caption} rows={data} />
    </figure>
  );
}

export function LineChart({ data, caption }) {
  const [ref, width] = useWidth();
  const [hovered, setHovered] = useState(null);

  const inner = width - MARGIN.left - MARGIN.right;
  const step = inner / data.length;
  const xFor = (index) => MARGIN.left + step * index + step / 2;
  const path = data
    .map((entry, index) => `${index === 0 ? 'M' : 'L'} ${xFor(index)} ${yFor(entry.value)}`)
    .join(' ');

  const values = data.map((entry) => entry.value);
  const highest = values.indexOf(Math.max(...values));
  const lowest = values.indexOf(Math.min(...values));

  return (
    <figure className="chart" ref={ref}>
      <svg width={width} height={HEIGHT} role="img" aria-label={caption}>
        <Grid width={width} />
        {hovered !== null && (
          <line x1={xFor(hovered)} x2={xFor(hovered)} y1={MARGIN.top} y2={BASELINE} className="chart-crosshair" />
        )}
        <path d={path} className="chart-line" />
        {data.map((entry, index) => (
          <g key={entry.label}>
            <circle cx={xFor(index)} cy={yFor(entry.value)} r={hovered === index ? 6 : 5} className="chart-point" />
            {(index === highest || index === lowest) && (
              <text x={xFor(index)} y={yFor(entry.value) - 14} textAnchor="middle" className="chart-direct">
                {entry.value}%
              </text>
            )}
            <text x={xFor(index)} y={BASELINE + 20} textAnchor="middle" className="chart-axis">{entry.label}</text>
            <rect
              x={xFor(index) - step / 2}
              y={MARGIN.top}
              width={step}
              height={BASELINE - MARGIN.top}
              className="chart-target"
              onMouseEnter={() => setHovered(index)}
              onMouseLeave={() => setHovered(null)}
            />
          </g>
        ))}
      </svg>
      {hovered !== null && (
        <Tip
          x={xFor(hovered)}
          y={yFor(data[hovered].value) - 12}
          width={width}
          title={data[hovered].label}
          value={data[hovered].value}
        />
      )}
      <TableView caption={caption} rows={data} />
    </figure>
  );
}
