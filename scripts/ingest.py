"""Import the published RDS igraph object, preserving IDs and measured weights.

Run with Python 3.12 after installing scripts/requirements.txt. No R installation,
CATMAID credentials, microscopy volumes or runtime network access is required.
"""
from pathlib import Path
import collections, datetime, hashlib, io, json, urllib.request, warnings, zipfile
import rdata

ROOT = Path(__file__).resolve().parents[1]
RAW, OUT = ROOT / 'data/raw', ROOT / 'data/processed'
URL = 'https://cdn.elifesciences.org/articles/97964/elife-97964-fig2-data1-v1.zip'
TYPES = {'celltype1', 'celltype2', 'celltype3', 'celltype57', 'celltype84', 'celltype85', 'celltype86', 'celltype104'}
CATEGORIES = {'sensory neuron': 'sensory', 'interneuron': 'interneuron', 'motoneuron': 'motor', 'effector': 'effector', 'fragmentum': 'fragment', 'other': 'other'}

def digest(data): return hashlib.sha256(data).hexdigest()
def write(name, value):
    payload = (json.dumps(value, ensure_ascii=False, separators=(',', ':'), allow_nan=False) + '\n').encode()
    (OUT / name).write_bytes(payload)
    return {'file': 'data/processed/' + name, 'sha256': digest(payload), 'bytes': len(payload)}

def main():
    RAW.mkdir(parents=True, exist_ok=True); OUT.mkdir(parents=True, exist_ok=True)
    archive = RAW / 'graph.zip'
    if not archive.exists():
        last = None
        for _ in range(2):
            try:
                with urllib.request.urlopen(URL, timeout=30) as response: archive.write_bytes(response.read())
                break
            except Exception as exc: last = exc
        else: raise RuntimeError(f'Published supplement unavailable: {last}. No synthetic fallback.')
    raw_bytes = archive.read_bytes()
    with zipfile.ZipFile(io.BytesIO(raw_bytes)) as z:
        assert z.namelist() == ['Figure2_source_data1.rds'], 'Unexpected archive; inspect before converting'
        rds = z.read('Figure2_source_data1.rds')
    rds_path = RAW / 'Figure2_source_data1.rds'; rds_path.write_bytes(rds)
    with warnings.catch_warnings():
        warnings.simplefilter('ignore') # unhandled R class wrappers; underlying igraph list is checked below
        graph = rdata.read_rds(rds_path)
    assert len(graph) == 10 and int(graph[0][0]) == 2675 and bool(graph[1][0]), 'Unexpected igraph representation'
    attrs, weights = graph[8][2], graph[8][3]['weight']
    nodes = []
    for i, skid in enumerate(attrs['skids']):
        source_class = str(attrs['class'][i])
        nodes.append({'id': str(skid), 'name': str(attrs['names'][i]).strip(), 'type': str(attrs['celltype_annotation'][i]),
            'category': CATEGORIES[source_class], 'sourceClass': source_class,
            'side': {'left_side':'L','right_side':'R'}.get(str(attrs['side'][i]), 'U'),
            'module': str(attrs['partition_name'][i]), 'segment': str(attrs['segment'][i]),
            'layout': [float(attrs['x'].values[i]), float(attrs['y'].values[i])]})
    assert len({n['id'] for n in nodes}) == len(nodes)
    edges = []
    for source, target, weight in zip(graph[2], graph[3], weights):
        assert int(source) == source and int(target) == target and int(weight) == weight and weight > 0
        edges.append({'source': nodes[int(source)]['id'], 'target': nodes[int(target)]['id'], 'weight': int(weight)})
    counts = {'nodes': len(nodes), 'edges': len(edges), 'synapses': sum(e['weight'] for e in edges), **dict(collections.Counter(n['category'] for n in nodes))}
    assert (counts['nodes'],counts['edges'],counts['synapses'],counts['fragment']) == (2675,14066,26881,467)
    selected = {n['id'] for n in nodes if n['type'] in TYPES and n['category'] in {'sensory','interneuron','motor'}}
    candidates = [e for e in edges if e['source'] in selected and e['target'] in selected]
    def reachable(starts, reverse=False):
        seen=set(starts)
        while True:
            before=len(seen)
            for e in candidates:
                a,b=(e['target'],e['source']) if reverse else (e['source'],e['target'])
                if a in seen: seen.add(b)
            if len(seen)==before:return seen
    inputs = {n['id'] for n in nodes if n['type']=='celltype1'}
    outputs = {n['id'] for n in nodes if n['id'] in selected and n['category']=='motor'}
    active = selected & reachable(inputs) & reachable(outputs, True)
    circuit_nodes=[n for n in nodes if n['id'] in active]
    circuit_edges=[e for e in candidates if e['source'] in active and e['target'] in active]
    selection='Eight named visual/postural cell types, intersected with directed PRC-to-MN reachability; induced measured edges only.'
    version='elife-97964-fig2-data1-v1'
    outputs_manifest=[write('connectome.json',{'version':version,'nodes':nodes,'edges':edges,'sourceCounts':counts,'selection':'Complete published filtered Figure 2 graph.'}),
        write('circuit.json',{'version':version,'nodes':circuit_nodes,'edges':circuit_edges,'sourceCounts':counts,'selection':selection})]
    manifest={
        'schemaVersion':1,'datasetVersion':version,'articleVersion':'Version of Record, 2025-08-27; DOI 10.7554/eLife.97964.3',
        'sourceUrl':URL,'archiveMember':'Figure2_source_data1.rds','archiveSha256':digest(raw_bytes),'memberSha256':digest(rds),
        'attribution':'Veraszto, Jasek, Guhmann, Bezares-Calderon, Williams, Shahidi and Jekely (2025), Whole-body connectome of a segmented annelid larva, eLife 13:RP97964.',
        'license':'CC BY 4.0','licenseUrl':'https://creativecommons.org/licenses/by/4.0/','licenseEvidence':['https://elifesciences.org/articles/97964#copyright','https://zenodo.org/records/15830426'],
        'sourceStudyCounts':{'reconstructedBodyCells':9162,'classifiedNeurons':966,'classifiedNeuronTypes':202},
        'importedCounts':counts,'activeCounts':{'neurons':len(circuit_nodes),'edges':len(circuit_edges),'synapses':sum(e['weight'] for e in circuit_edges),**dict(collections.Counter(n['category'] for n in circuit_nodes))},
        'edgeMeaning':'Directed presynaptic-to-postsynaptic pair; integer weight is number of anatomical chemical synapses, not functional efficacy.',
        'transformations':['Decode R serialization using rdata 1.0.0; validate igraph slots and counts.','Map zero-based igraph endpoints to unmodified source skeleton IDs.','Preserve labels, celltype annotation, class and side; retain published x/y exclusively as force-layout coordinates.',selection],
        'selectedTypes':sorted(TYPES),'excludedCandidateIds':sorted(selected-active),
        'exclusions':['Fragments, effectors, other classes and unselected neuron types remain in explorer data but never enter model.','No unknown not_celltype annotations are promoted to named circuit neurons.','No anatomical coordinates, transmitter assignments or functional weights are fabricated as source data.'],
        'versionCautions':['Graph class labels include immature/untyped neurons: 1627 graph-class neurons is not 966 classified neurons.','An older GraphML at repository tag 1.1 has 2706 nodes / 14294 edges; it is not merged into this import.','The archived Figure 1 raster has older category numbers; Figure 2 supplement is authoritative for imported graph counts.'],
        'outputs':outputs_manifest}
    write('manifest.json',manifest)
    print(json.dumps({'imported':counts,'active':manifest['activeCounts'],'excluded':manifest['excludedCandidateIds']},indent=2))

if __name__ == '__main__': main()
