"""Package selected completed evidence outside ordinary Git history."""
from pathlib import Path
import json, zipfile, hashlib
root=Path(__file__).resolve().parent.parent
summary=json.loads((root/'docs/results/exhibit-heldout.json').read_text(encoding='utf-8'))
endurance=json.loads((root/'docs/results/exhibit-endurance.json').read_text(encoding='utf-8'))
paths=[]
for row in summary['rows']:
    directory=root/'runtime/exhibit-validation'/row['id']
    paths.extend(directory.glob('*'))
session=endurance['sessionId']
for directory in (root/'runtime/exhibit').glob('exhibit_*'):
    record=directory/'record.json'
    if record.exists() and json.loads(record.read_text(encoding='utf-8')).get('sessionId')==session:
        paths.extend(directory.glob('*'))
paths.extend((root/'runtime/integrated-preview').glob('*'))
paths.extend(root/p for p in ['docs/results/exhibit-heldout.json','docs/results/exhibit-endurance.json','docs/EXHIBIT_CONTROLLER.md','docs/INTEGRATED_REVIEW.md'])
target=root/'runtime/specimen-exhibit-evidence.zip'
with zipfile.ZipFile(target,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for path in sorted(set(paths)):
        if path.is_file():
            relative=path.resolve().relative_to(root)
            z.write(path,str(relative).replace('\\','/'))
manifest={'createdAt':__import__('datetime').datetime.now(__import__('datetime').timezone.utc).isoformat(),'file':target.name,'bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'entries':len(zipfile.ZipFile(target).namelist()),'sourceRevision':summary['rows'][0]['sourceRevision'],'restore':'Extract at the repository root. All raw media/trace paths are under ignored runtime/.'}
(root/'docs/results/exhibit-release-asset.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
print(json.dumps(manifest,indent=2))
