// Layout of the network diagram. Each line is drawn through a few anchors, given
// as [station number, x, y], and the stations between them are spaced evenly.

export const VIEW = { width: 1100, height: 800 };

const ANCHORS = {
  purple: [[1, 1060, 250], [12, 760, 250], [15, 680, 330], [23, 470, 330], [26, 392, 330], [37, 128, 594]],
  green: [[1, 290, 30], [13, 470, 210], [17, 470, 330], [24, 470, 554], [26, 470, 618], [32, 314, 774]],
  yellow: [[1, 470, 554], [5, 610, 554], [16, 830, 774]],
};

// Stations named on the diagram. The rest appear when you point at them.
export const LABELS = {
  PL01: { text: 'Whitefield', dx: 12, dy: -26, anchor: 'end', major: true },
  PL12: { text: 'KR Puram', dx: 0, dy: -24, anchor: 'middle' },
  PL16: { dx: 0, dy: 34, anchor: 'middle' },
  PL19: { dx: 0, dy: -24, anchor: 'middle' },
  GL17: { text: 'Majestic', dx: -24, dy: -16, anchor: 'end', major: true },
  PL27: { dx: -18, dy: -12, anchor: 'end' },
  PL36: { dx: -22, dy: -6, anchor: 'end' },
  PL37: { dx: -6, dy: 36, anchor: 'middle', major: true },
  GL01: { dx: 26, dy: 6, anchor: 'start', major: true },
  GL10: { dx: -24, dy: 2, anchor: 'end' },
  GL24: { dx: -28, dy: 6, anchor: 'end', major: true },
  GL26: { dx: -24, dy: 12, anchor: 'end' },
  GL32: { dx: -26, dy: 6, anchor: 'end', major: true },
  YL05: { dx: 18, dy: -22, anchor: 'start' },
  YL12: { dx: 24, dy: 0, anchor: 'start' },
  YL16: { dx: 26, dy: 6, anchor: 'start', major: true },
};

// Names printed along each line, so they can be told apart without colour.
export const LINE_LABELS = [
  { id: 'purple', x: 880, y: 290, anchor: 'middle' },
  { id: 'green', x: 378, y: 92, anchor: 'start' },
  { id: 'yellow', x: 520, y: 600, anchor: 'start' },
];

const stationNumber = (station) => Number(station.stationId.slice(2));

export function stationPosition(station) {
  const anchors = ANCHORS[station.line];
  const number = stationNumber(station);

  for (let i = 0; i < anchors.length - 1; i += 1) {
    const [startNumber, startX, startY] = anchors[i];
    const [endNumber, endX, endY] = anchors[i + 1];
    if (number >= startNumber && number <= endNumber) {
      const progress = (number - startNumber) / (endNumber - startNumber);
      return { x: startX + (endX - startX) * progress, y: startY + (endY - startY) * progress };
    }
  }
  return null;
}

export function linePath(lineId) {
  return ANCHORS[lineId]
    .map(([, x, y], index) => `${index === 0 ? 'M' : 'L'} ${x} ${y}`)
    .join(' ');
}
