# Development and recorder trail

Development commits use the Specimen Archive project identity and real timestamps. Public source is https://github.com/SpecimenArchive/Specimen-Archive. Normal source increments remain on master. Automated records use the specimen-records branch; their messages begin with Specimen Recorder and their JSON identifies the automation.

The recorder publishes one immutable compact configuration/result record at a completed experiment boundary. It supports both the original motor-integral light experiment and the pixel-to-neural-to-browser task. Each record names the executed source revision, data/model/configuration versions, run ID, neural outputs, engineering selection rule, commands/condition and outcome. Continuous telemetry stays under ignored runtime/.

Only verified GitHub contents and a real commit receipt produce the published state. Disabled, dirty-source and unversioned runs remain pending. Authentication or transport failures appear as failed with a reason and a bounded retry interval. After a lost receipt the recorder verifies the existing bytes and recovers the commit, preventing duplicate records. It never force-pushes or mutates the local development worktree.

Configure RECORDER_REPOSITORY=SpecimenArchive/Specimen-Archive and RECORDER_ENABLED=1 in the ignored .env file after pushing the executed source revision. The local GitHub CLI supplies credentials through its standard secure authentication flow. No tokens are stored in project files. A missing permission is reported, never treated as a completed publication.

For project-scoped manual pushes, use git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push origin master. Project-local user.name and user.email determine Git attribution separately from GitHub authentication.

The observation feed links actual publication commits. Bounded exported evidence belongs in docs/evidence/browser with recorded hashes; a publication schedule alone is not proof of model involvement. See BROWSER_CONTROLLER.md and FEEDBACK_LOOP.md for the executed mappings, replay and interventions.
