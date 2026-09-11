$ErrorActionPreference='Stop'
$env:Path='C:\Program Files\Git\cmd;C:\Program Files\nodejs;'+$env:Path
$env:SPECIMEN_RECORD_SERVICE_CONFIG='C:\ProgramData\SpecimenArchivePublisher\publisher.json'
& 'C:\Program Files\nodejs\node.exe' 'C:\ProgramData\SpecimenArchivePublisher\record-service.mjs' 1>>'C:\ProgramData\SpecimenArchivePublisher\stdout.log' 2>>'C:\ProgramData\SpecimenArchivePublisher\stderr.log'
exit $LASTEXITCODE
