import { describe, it, expect } from 'vitest';
import { roadPath, makePath, pathAt, roundedPath, routeThrough } from './roads';
import { createSim, stepSim, fieldKpis, assign, teamStatus, taskStatus } from './field-sim';
import { poles, lightCircuits, lightTrafos, lampLevel } from './data-lights';
import { phaseAt, weatherRisk, sectorState, storms, stormAt } from './data-extra';
import { createDocument, REPORTS, compactDocument, restoreDocument, isMapDocument } from './model';
import { distanceKm } from './base';

describe('street-like routes', () => {
  it('starts and ends exactly on the requested points and is longer than the straight line', () => {
    const a: [number, number] = [-46.705, -23.524], b: [number, number] = [-46.865, -23.51];
    const p = roadPath(a, b, 3);
    expect(p[0]).toEqual(a); expect(p.at(-1)).toEqual(b); expect(p.length).toBeGreaterThan(4);
    expect(makePath(p).total).toBeGreaterThan(distanceKm(a, b));
  });
  it('is deterministic and different per seed', () => {
    const a: [number, number] = [-46.6, -23.5], b: [number, number] = [-46.55, -23.56];
    expect(roadPath(a, b, 1)).toEqual(roadPath(a, b, 1)); expect(roadPath(a, b, 1)).not.toEqual(roadPath(a, b, 2));
  });
  it('interpolates along the route and joins legs through every stop', () => {
    const r = routeThrough([[-46.7, -23.5], [-46.65, -23.55], [-46.6, -23.5]], 2), path = makePath(r);
    expect(r).toContainEqual([-46.65, -23.55]);
    const mid = pathAt(path, path.total / 2); expect(Number.isFinite(mid.lon + mid.lat + mid.heading)).toBe(true);
    expect(pathAt(path, 9999)).toMatchObject({ lon: -46.6, lat: -23.5 });
  });
  it('rounds corners without leaving the polyline endpoints', () => {
    const d = roundedPath([{ x: 0, y: 0 }, { x: 40, y: 0 }, { x: 40, y: 40 }], 8);
    expect(d.startsWith('M0.0,0.0')).toBe(true); expect(d).toContain('Q40.0,0.0'); expect(d.endsWith('L40.0,40.0')).toBe(true);
  });
});

describe('field operations simulation', () => {
  it('starts rich: several distinct team and task states at once', () => {
    const s = createSim(3);
    expect(new Set(s.teams.map(teamStatus)).size).toBeGreaterThanOrEqual(3);
    expect(s.log.length).toBeGreaterThan(8);
    expect(fieldKpis(s).done).toBeGreaterThan(0);
  });
  it('stays finite and eventually exercises every lifecycle event over a long run', () => {
    const s = createSim(3), seen = new Set<string>(), teamSeen = new Set<string>(), taskSeen = new Set<string>();
    for (let i = 0; i < 600; i++) { stepSim(s, 1); s.log.forEach((e) => seen.add(e.kind)); s.teams.forEach((t) => { teamSeen.add(teamStatus(t)); expect(Number.isFinite(t.lon + t.lat + t.fuel)).toBe(true); }); s.tasks.forEach((t) => taskSeen.add(taskStatus(t))); }
    for (const k of ['new', 'dispatch', 'arrive', 'start', 'done', 'late', 'return']) expect(seen.has(k)).toBe(true);
    expect(teamSeen.size).toBeGreaterThanOrEqual(5); expect(taskSeen.has('Concluído')).toBe(true);
    expect(fieldKpis(s).km).toBeGreaterThan(20);
  });
  it('is reproducible for the same seed', () => {
    const a = createSim(3), b = createSim(3); stepSim(a, 30); stepSim(b, 30);
    expect(a.teams.map((t) => [t.lon, t.lat, t.status])).toEqual(b.teams.map((t) => [t.lon, t.lat, t.status]));
  });
  it('lets the dispatcher assign manually when automatic dispatch is off', () => {
    const s = createSim(3); s.auto = false; stepSim(s, 3);
    const open = s.tasks.find((t) => t.status === 'Aberto'), free = s.teams.find((t) => t.status === 'Disponível' || t.status === 'Retornando');
    if (open && free) { expect(assign(s, open.id, free.id)).toBe(true); expect(open.status).toBe('A caminho'); expect(assign(s, open.id, free.id)).toBe(false); }
  });
});

describe('street lighting data', () => {
  it('has exactly 3200 poles on unique ids, grouped in circuits with transformers', () => {
    expect(poles).toHaveLength(3200); expect(new Set(poles.map((p) => p.id)).size).toBe(3200);
    const ids = new Set(lightCircuits.map((c) => c.id)); expect(poles.every((p) => ids.has(String(p.properties.circuito)))).toBe(true);
    const tr = new Set(lightTrafos.map((t) => t.id)); expect(lightCircuits.every((c) => tr.has(String(c.properties.trafo)))).toBe(true);
  });
  it('contains two fully dark circuits and a realistic mix of states and technologies', () => {
    const dark = lightCircuits.filter((c) => c.properties.status === 'Falha'); expect(dark.length).toBe(2);
    expect(poles.filter((p) => dark.some((c) => c.id === p.properties.circuito)).every((p) => p.properties.status === 'Falha')).toBe(true);
    const status = new Set(poles.map((p) => p.properties.status)); expect(status.size).toBe(4);
    expect(new Set(poles.map((p) => p.properties.tecnologia)).size).toBe(4);
  });
  it('keeps every pole near São Paulo', () => { for (const p of poles) { const [lon, lat] = p.geometry.coordinates[0]!; expect(lon!).toBeGreaterThan(-47.1); expect(lon!).toBeLessThan(-46.3); expect(lat!).toBeGreaterThan(-23.8); expect(lat!).toBeLessThan(-23.4); } });
});

describe('lamp photocell and dimming', () => {
  it('is off by day, on at night and dimmed (LED only) in the small hours', () => {
    expect(lampLevel(12)).toBe(0); expect(lampLevel(21)).toBe(1); expect(lampLevel(2, 0, 'led')).toBeCloseTo(.68, 2);
    expect(lampLevel(2, 0, 'sodium')).toBe(1); expect(lampLevel(17.95, 0, 'led')).toBeGreaterThan(0); expect(lampLevel(17.95, 0, 'led')).toBeLessThan(1);
  });
});

describe('time-driven maps', () => {
  it('expansion advances from design to licensing to works to done', () => {
    expect(phaseAt(1, 10, 8).fase).toBe('Projeto'); expect(phaseAt(8, 10, 8).fase).toBe('Licenciamento');
    expect(phaseAt(14, 10, 8)).toMatchObject({ fase: 'Em obra', pct: .5 }); expect(phaseAt(30, 10, 8).fase).toBe('Concluído');
  });
  it('storms exist only during their life and the risk follows them', () => {
    const s = storms[0]!; expect(stormAt(s, s.born - 1)).toBeNull(); const mid = stormAt(s, (s.born + s.dies) / 2)!; expect(mid.mmh).toBeGreaterThan(40);
    expect(weatherRisk(mid.lon, mid.lat, (s.born + s.dies) / 2).sev).toBeGreaterThanOrEqual(2); expect(weatherRisk(-46.4, -23.9, 9).sev).toBe(0);
  });
  it('coverage load peaks at lunch and in the evening', () => {
    expect(sectorState(80, -90, 19).prb).toBeGreaterThan(sectorState(80, -90, 4).prb);
    expect(sectorState(80, -112, 4).status).toBe('Urgente');
  });
});

describe('eight maps', () => {
  it('builds each document with unique layers and round-trips through storage compaction', () => {
    expect(REPORTS).toHaveLength(8);
    for (const r of REPORTS) {
      const d = createDocument(r.id); expect(d.layers.length).toBeGreaterThanOrEqual(1); expect(isMapDocument(d)).toBe(true);
      const small = compactDocument(d); expect(JSON.stringify(small).length).toBeLessThan(JSON.stringify(d).length / 2 + 5);
      expect(restoreDocument(small)).toEqual(d);
    }
  });
  it('keeps every link, route and patrol on streets (more than two vertices)', () => {
    const net = createDocument('network').layers[1]!.features; expect(net.every((f) => f.geometry.coordinates.length > 2)).toBe(true);
    expect(createDocument('theft').layers.at(-1)!.features[0]!.geometry.coordinates.length).toBeGreaterThan(4);
    expect(createDocument('expansion').layers[0]!.features.every((f) => f.geometry.coordinates.length > 2)).toBe(true);
  });
});

import { reroute } from './network-tools';
describe('network rerouting', () => {
  it('finds an alternative that avoids the cut link and reports capacity risk', () => {
    const links = createDocument('network').layers[1]!.features;
    const r = reroute(links, links[2]!.id)!; // Lapa → Barra Funda
    expect(r).not.toBeNull(); expect(r.ids).not.toContain(links[2]!.id); expect(r.nodes[0]).toBe(String(links[2]!.properties.origem)); expect(r.nodes.at(-1)).toBe(String(links[2]!.properties.destino));
    expect(r.km).toBeGreaterThan(0); expect(Array.isArray(r.overloaded)).toBe(true);
  });
  it('returns null for an unknown link and when no alternative exists', () => {
    const links = createDocument('network').layers[1]!.features; expect(reroute(links, 'x')).toBeNull();
    expect(reroute(links.slice(0, 1), links[0]!.id)).toBeNull();
  });
});
