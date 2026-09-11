import { replayEpisode } from '../server/exhibit/replay';
import { loadCircuit } from '../server/browser/runner';
if(!process.argv[2])throw new Error('Usage: npm run exhibit:replay -- runtime/exhibit/<run-id>');
console.log(await replayEpisode(process.argv[2],loadCircuit()));
