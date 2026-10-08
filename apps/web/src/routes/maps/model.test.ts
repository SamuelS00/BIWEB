import { describe, it, expect } from 'vitest';
import { createDocument, isMapDocument, DEMO_DATASET, distanceKm, featureColor, mapRows, relatedRows, severity } from './model';
import { parseCSV, parseGeoJSON } from './import';
const mapping={latitude:'latitude',longitude:'longitude',label:'nome',color:'status'};
describe('shared map engine',()=>{
  it('maps actual rows and rejects missing, blank, nonnumeric and out-of-range coordinates',()=>{
    const result=mapRows([{id:'a',latitude:-23.5,longitude:-46.6},{latitude:'',longitude:0},{latitude:91,longitude:0},{latitude:null,longitude:0},{latitude:'NaN',longitude:10},{latitude:0,longitude:0}],mapping,'id');
    expect(result.rejected).toBe(4);expect(result.features).toHaveLength(2);expect(result.features[0]?.geometry.coordinates).toEqual([[-46.6,-23.5]]);
  });
  it('joins pole maintenance by key without leaking unrelated rows',()=>{
    const orderTable=DEMO_DATASET.tables.find((t)=>t.id==='manutencoes')!,pole=String(orderTable.rows[0]!.poste_id);
    const result=relatedRows(DEMO_DATASET,'postes',{id:pole});
    expect(result[0]?.rows.length).toBeGreaterThan(0);expect(result[0]?.rows.every((r)=>r.poste_id===pole)).toBe(true);
    expect(relatedRows(DEMO_DATASET,'postes',{id:'missing'})[0]?.rows).toHaveLength(0);
  });
  it('classifies attenuation at the configured boundaries',()=>{
    const f=createDocument('network').layers[1]!.features[2]!;
    expect(severity(f,[12,18,24])).toBe(2);expect(severity(f,[20,25,30])).toBe(0);
  });
  it('uses the selected color field and supports an explicit color override',()=>{
    const l=createDocument('lights').layers[0]!,f=l.features[0]!;
    expect(featureColor({...l,colorBy:''},f,[12,18,24])).toBe(l.color);
    expect(featureColor({...l,colorBy:'tecnologia'},f,[12,18,24])).not.toBe(featureColor({...l,colorBy:'status'},f,[12,18,24]));
  });
  it('has distinct scenes and 3200 real pole features',()=>{
    expect(createDocument('lights').layers[0]?.features).toHaveLength(3200);expect(createDocument('lights').layers[0]?.render).toBe('lights');
    expect(createDocument('network').dimension).toBe('3d');expect(createDocument('incidents').aggregation).toBe('Heatmap');
    expect(createDocument('field').layers[0]?.features[0]?.geometry.type).toBe('Polygon');expect(createDocument('theft').layers).toHaveLength(5);
  });
  it('calculates geographic proximity in km',()=>{expect(distanceKm([0,0],[0,1])).toBeCloseTo(111.195,2);expect(distanceKm([-46,-23],[-46,-23])).toBe(0);});
});
describe('portable reports',()=>{
  it('validates all round-tripped documents and rejects corrupt configurations',()=>{
    for(const id of ['network','theft','lights','incidents','field','coverage','expansion','weather'] as const) expect(isMapDocument(JSON.parse(JSON.stringify(createDocument(id))))).toBe(true);
    expect(isMapDocument({...createDocument('network'),bands:[24,12,18]})).toBe(false);
    expect(isMapDocument({...createDocument('network'),layers:[null]})).toBe(false);
    expect(isMapDocument({version:1,id:'network'})).toBe(false);
  });
  it('resolves both stations, route and readings from a selected network segment',()=>{
    const r=relatedRows(DEMO_DATASET,'trechos',{...createDocument('network').layers[1]!.features[2]!.properties,id:'OPS-0382'});
    expect(r).toHaveLength(4);expect(r.find((r)=>r.table==='leituras')?.rows).toHaveLength(3);
    expect(r.find((r)=>r.table==='rotas')?.rows[0]?.id).toBe('SP-04');
  });
});
describe('geographic imports',()=>{
  it('reads quoted commas, escaped quotes, multiline cells, BOM and semicolon files',()=>{
    expect(parseCSV('\uFEFFid,nome,latitude,longitude\n1,"Rua, A",-23,-46')[0]?.nome).toBe('Rua, A');
    expect(parseCSV('id;nome\n1;"A ""B""\nC"')[0]?.nome).toBe('A "B"\nC');
  });
  it('rejects malformed CSV without silently losing columns',()=>{expect(()=>parseCSV('id,nome\n1')).toThrow();expect(()=>parseCSV('id,id\n1,2')).toThrow();expect(()=>parseCSV('id,nome\n1,"x')).toThrow();});
  it('reads points, lines and polygons as actual features',()=>{
    const features=parseGeoJSON(JSON.stringify({type:'FeatureCollection',features:[{type:'Feature',id:'P1',properties:{nome:'Poste'},geometry:{type:'Point',coordinates:[-46,-23]}},{type:'Feature',geometry:{type:'LineString',coordinates:[[0,0],[1,1]]}}]}));
    expect(features).toHaveLength(2);expect(features[0]?.id).toBe('P1');expect(features[0]?.properties.latitude).toBe(-23);expect(features[1]?.geometry.type).toBe('LineString');
  });
  it('rejects unsupported and invalid geometry instead of inventing data',()=>{
    expect(()=>parseGeoJSON('{"type":"Point","coordinates":[200,0]}')).toThrow();expect(()=>parseGeoJSON('{"type":"MultiPoint","coordinates":[[0,0]]}')).toThrow();
    expect(()=>parseGeoJSON('{"type":"Polygon","coordinates":[[[0,0],[1,1],[0,1],[2,2]]]}')).toThrow();
  });
});
