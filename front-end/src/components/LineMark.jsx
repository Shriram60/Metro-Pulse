const NAMES = { purple: 'Purple Line', green: 'Green Line', yellow: 'Yellow Line' };

export const lineName = (id) => NAMES[id] || id;

export default function LineMark({ line }) {
  return <span className={`line-mark line-mark--${line}`} role="img" aria-label={lineName(line)} title={lineName(line)} />;
}
