// Offline structural regression test: run "node scripts/qa-avatar.cjs" from repo root.
// This checks assets and interface contracts, NOT GPU rendering or visual quality.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const js=read('avatar-room-preview.js');
const bare=js.replace(/^import .+;\s*$/gm,'');
new Function(bare);
assert(js.includes("new GLTFLoader().load('assets/bkbk-avatar-'+sex+'.glb'"));
assert(js.includes("bodyMesh.geometry.setAttribute('color'"));
assert(js.includes("root.rotation.y"));
assert(js.includes("motion==='wave'"));
assert(js.includes("motion==='walk'"));
assert(js.includes("localStorage.setItem(storageKey"));
assert(js.includes("stage.dataset.modelReady='true'"));
for(const sex of ['female','male']){
 const file=path.join(root,'assets','bkbk-avatar-'+sex+'.glb');
 const b=fs.readFileSync(file);
 assert.equal(b.toString('utf8',0,4),'glTF');
 assert.equal(b.readUInt32LE(4),2);
 assert.equal(b.readUInt32LE(8),b.length);
 assert.equal(b.toString('utf8',16,20),'JSON');
 const data=JSON.parse(b.toString('utf8',20,20+b.readUInt32LE(12)));
 const nodes=new Set((data.nodes||[]).map(n=>n.name));
 for(const n of ['Head','thigh_l','thigh_r','upperarm_l','upperarm_r','lowerarm_r'])assert(nodes.has(n),sex+' missing '+n);
 assert(data.skins?.some(s=>s.joints.length>=50),sex+' model has no humanoid skeleton');
 assert(data.meshes?.length>=3,sex+' missing character geometry');
 const html=read('bkbk-avatar-'+sex+'.html');
 for(const id of ['stage','avatar-canvas','load-status','motion','wave','save-avatar','reset-avatar','outfit','hairStyle','face','body','skin','eyes'])assert(html.includes('id="'+id+'"'),sex+' missing '+id);
 assert(html.includes('type="importmap"'),sex+' missing module map');
 assert(html.includes('avatar-room-preview.js'),sex+' missing rendering module');
 assert(html.includes('data-setting="outfit"'));
 console.log('PASS '+sex+': valid GLB, skinned humanoid, controls wired');
}
console.log('PASS JavaScript parses, both dressing rooms contain interactive customization controls.');
console.log('NOTE Browser GPU appearance, third-party CDN and iOS Safari still need live-device QA.');
