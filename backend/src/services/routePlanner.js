const Station = require('../models/Station');
const { HttpError } = require('../middleware/errors');

const MINUTES_PER_STOP = 2.2;
const MINUTES_PER_INTERCHANGE = 5;

// [highest station count in the slab, fare in rupees]
const FARE_SLABS = [[2, 10], [3, 20], [4, 30], [5, 40], [6, 50], [8, 60], [10, 70], [12, 80]];
const MAX_FARE = 90;

function calculateFare(stationCount) {
  const slab = FARE_SLABS.find(([limit]) => stationCount <= limit);
  return slab ? slab[1] : MAX_FARE;
}

function groupByLine(stations) {
  const lines = new Map();
  for (const station of stations) {
    if (!lines.has(station.line)) lines.set(station.line, []);
    lines.get(station.line).push(station);
  }
  for (const list of lines.values()) {
    list.sort((a, b) => a.stationId.localeCompare(b.stationId));
  }
  return lines;
}

// Stations with the same name are one physical interchange, such as Majestic
// on the Purple and Green lines, so the graph is keyed by name.
function buildGraph(lines) {
  const graph = new Map();
  const link = (from, to, line) => {
    if (!graph.has(from)) graph.set(from, []);
    graph.get(from).push({ to, line });
  };

  for (const [line, list] of lines) {
    for (let i = 0; i < list.length - 1; i += 1) {
      link(list[i].name, list[i + 1].name, line);
      link(list[i + 1].name, list[i].name, line);
    }
  }
  return graph;
}

// Breadth-first search, so the first path to reach the goal has the fewest stops.
function findPath(graph, start, goal) {
  const cameFrom = new Map([[start, null]]);
  const queue = [start];

  while (queue.length > 0) {
    const current = queue.shift();
    if (current === goal) break;
    for (const { to, line } of graph.get(current) || []) {
      if (!cameFrom.has(to)) {
        cameFrom.set(to, { name: current, line });
        queue.push(to);
      }
    }
  }

  if (!cameFrom.has(goal)) return null;

  const hops = [];
  for (let name = goal; cameFrom.get(name); name = cameFrom.get(name).name) {
    const { name: from, line } = cameFrom.get(name);
    hops.unshift({ from, to: name, line });
  }
  return hops;
}

function describe(station, minutes) {
  return {
    stationId: station.stationId,
    name: station.name,
    type: station.type,
    minute: Math.round(minutes),
  };
}

function buildLegs(hops, lines) {
  const stationOn = (line, name) => lines.get(line).find((station) => station.name === name);
  const legs = [];
  let minutes = 0;

  for (const hop of hops) {
    let leg = legs[legs.length - 1];
    if (!leg || leg.line !== hop.line) {
      if (leg) minutes += MINUTES_PER_INTERCHANGE;
      leg = { line: hop.line, towards: null, stations: [describe(stationOn(hop.line, hop.from), minutes)] };
      legs.push(leg);
    }
    minutes += MINUTES_PER_STOP;
    leg.stations.push(describe(stationOn(hop.line, hop.to), minutes));
  }

  for (const leg of legs) {
    const list = lines.get(leg.line);
    const first = leg.stations[0].stationId;
    const last = leg.stations[leg.stations.length - 1].stationId;
    leg.towards = (last > first ? list[list.length - 1] : list[0]).name;
  }
  return legs;
}

function summarize(station) {
  return { stationId: station.stationId, name: station.name, line: station.line };
}

// Finds the route between two station ids, or null if there is none.
// Takes the stations as an argument so it can be tested without a database.
function findRoute(stations, fromId, toId) {
  const from = stations.find((station) => station.stationId === fromId);
  const to = stations.find((station) => station.stationId === toId);
  if (!from || !to) return null;

  const lines = groupByLine(stations);
  const hops = findPath(buildGraph(lines), from.name, to.name);
  if (!hops || hops.length === 0) return null;

  const legs = buildLegs(hops, lines);
  const lastLeg = legs[legs.length - 1];
  const stationCount = hops.length + 1;

  return {
    from: summarize(from),
    to: summarize(to),
    stations: stationCount,
    stops: hops.length,
    interchanges: legs.length - 1,
    fare: calculateFare(stationCount),
    minutes: lastLeg.stations[lastLeg.stations.length - 1].minute,
    legs,
  };
}

// Plans a trip from the database and turns bad input into API errors.
async function planTrip(fromId, toId) {
  if (typeof fromId !== 'string' || typeof toId !== 'string' || !fromId || !toId) {
    throw new HttpError(400, 'Choose a start and an end station');
  }

  const stations = await Station.find().lean();
  const from = stations.find((station) => station.stationId === fromId);
  const to = stations.find((station) => station.stationId === toId);

  if (!from || !to) throw new HttpError(404, 'Station not found');
  if (from.name === to.name) throw new HttpError(400, 'Choose two different stations');
  if (!from.operational || !to.operational) {
    throw new HttpError(400, 'One of those stations is not in service');
  }

  const route = findRoute(stations, fromId, toId);
  if (!route) throw new HttpError(404, 'No route between those stations');
  return route;
}

module.exports = { calculateFare, findRoute, planTrip };
