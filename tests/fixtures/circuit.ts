import type { Circuit } from '../../shared/types';
// Deliberately tiny synthetic software fixture. Never imported by the server,
// ingestion pipeline, scientific validation command or specimen interface.
export const fixtureCircuit:Circuit={version:'synthetic-test-fixture',selection:'Software test only',sourceCounts:{nodes:3,edges:2,synapses:3},nodes:[
  {id:'fixture-sensory',name:'Fixture sensory',type:'fixture',category:'sensory',side:'L',sourceClass:'fixture'},
  {id:'fixture-inter',name:'Fixture inter',type:'fixture',category:'interneuron',side:'L',sourceClass:'fixture'},
  {id:'fixture-motor',name:'Fixture motor',type:'fixture',category:'motor',side:'L',sourceClass:'fixture'},
],edges:[{source:'fixture-sensory',target:'fixture-inter',weight:2},{source:'fixture-inter',target:'fixture-motor',weight:1}]};
