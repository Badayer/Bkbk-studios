
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/+esm';
import {GLTFLoader} from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js/+esm';

const $ = id => document.getElementById(id);
const sex = document.body.dataset.avatarSex === 'male' ? 'male' : 'female';
const storageKey = 'bkbk-avatar-room-v2-' + sex;
const presets = {
 female:{skin:'#c48e72',hair:'#332820',eyes:'#514135',hairStyle:'waves',outfit:'dress',fabric:'#805b64',accent:'#ede0c8',face:100,body:100},
 male:{skin:'#ba886b',hair:'#302823',eyes:'#4a4439',hairStyle:'crop',outfit:'suit',fabric:'#4c5650',accent:'#e6dac6',face:100,body:100}
};
let state={...presets[sex]};try{const s=JSON.parse(localStorage.getItem(storageKey)||'{}');for(const k of Object.keys(state)){if(Object.prototype.hasOwnProperty.call(s,k)&&typeof s[k]===typeof state[k])state[k]=s[k]}}catch{}
const hex=(v,fallback='#999999')=>/^#[0-9a-fA-F]{6}$/.test(v)?v:fallback;
for(const id of ['skin','hair','eyes','fabric','accent'])state[id]=hex(state[id],presets[sex][id]);
const stage=$('stage'),canvas=$('avatar-canvas'),status=$('load-status');
const setMessage=(t)=>{status.textContent=t;status.hidden=!t};
const scene=new THREE.Scene();
const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.7));
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.35;
const camera=new THREE.OrthographicCamera(-1,1,1,-1,.01,40);
camera.position.set(0,1.1,3.35);camera.lookAt(0,.9,0);
scene.add(new THREE.HemisphereLight(0xffffff,0x877a69,3.1));
const key=new THREE.DirectionalLight(0xffefdc,3.0);key.position.set(-2.5,5,4);scene.add(key);
const fill=new THREE.DirectionalLight(0xdfe7ff,1.8);fill.position.set(3,2,3);scene.add(fill);
const rim=new THREE.DirectionalLight(0xfff2cf,1.0);rim.position.set(2,3,-3);scene.add(rim);
const root=new THREE.Group();scene.add(root);
let model=null,bodyMesh=null,eyesMesh=null,browsMesh=null,headBone=null,hairGroup=null,clothesGroup=null;
let motion='idle',time=0,rotation=0,dragging=false,lastX=0,walkLegs=[],walkArms=[];
const mat=(color,roughness=.84)=>new THREE.MeshStandardMaterial({color,roughness,metalness:0,side:THREE.DoubleSide});
const make=(geo,color,parent,x=0,y=0,z=0)=>{const mesh=new THREE.Mesh(geo,mat(color));mesh.position.set(x,y,z);parent.add(mesh);return mesh};
function resize(){
 const bounds=canvas.getBoundingClientRect();
 if(!bounds.width||!bounds.height)return;
 renderer.setSize(bounds.width,bounds.height,false);
 const span=2.07;
 camera.top=span/2;camera.bottom=-span/2;
 camera.right=span*bounds.width/bounds.height/2;camera.left=-camera.right;
 camera.updateProjectionMatrix();
}
window.addEventListener('resize',resize,{passive:true});
const ro=typeof ResizeObserver!=='undefined'?new ResizeObserver(resize):null;if(ro)ro.observe(stage);

function tintBase(){
 if(!bodyMesh)return;
 const pos=bodyMesh.geometry.getAttribute('position');
 if(!pos)return;
 const arr=new Float32Array(pos.count*3);
 const skin=new THREE.Color(state.skin),top=new THREE.Color(state.fabric),accent=new THREE.Color(state.accent);
 const pants=new THREE.Color(sex==='female'&&state.outfit==='dress'?'#d1bdad':sex==='male'&&state.outfit==='suit'?'#313638':'#81756a');
 const shoes=new THREE.Color(sex==='male'?'#322f2d':'#a4947a');
 const shirt=new THREE.Color(sex==='male'&&state.outfit==='suit'?'#ded9cf':state.fabric);
 const temp=new THREE.Color();
 for(let i=0;i<pos.count;i++){
   const x=pos.getX(i),y=pos.getY(i);
   let tone;
   if(y>1.5){tone=skin}
   else if(y<.155){tone=shoes}
   else if(y<.90){tone=pants}
   else if(Math.abs(x)>.52 && y<1.19){tone=skin}
   else if(sex==='male' && state.outfit==='suit' && Math.abs(x)<.23 && y>1.19){tone=shirt}
   else if(sex==='female'&&state.outfit==='dress'&&y<1.06){tone=accent}
   else{tone=top}
   temp.copy(tone);
   // subtle consistent lighting across shaded body geometry
   arr[i*3]=temp.r;arr[i*3+1]=temp.g;arr[i*3+2]=temp.b;
 }
 bodyMesh.geometry.setAttribute('color',new THREE.BufferAttribute(arr,3));
 bodyMesh.material=new THREE.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:.93,metalness:0,side:THREE.DoubleSide,skinning:true});
 if(browsMesh)browsMesh.material=mat(state.hair);
 if(eyesMesh)eyesMesh.material=mat(state.eyes,.45);
}

function createHair(){
 if(hairGroup){hairGroup.parent?.remove(hairGroup);hairGroup.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose()}})}
 hairGroup=new THREE.Group();
 const anchor=headBone||model;
 anchor.add(hairGroup);
 // All styles are real meshes attached to the head skeleton.
 const c=state.hair;
 const cap=make(new THREE.SphereGeometry(.133,22,14),c,hairGroup,0,.104,-.009);
 cap.scale.set(1.04,.72,.96);
 if(sex==='female'){
   if(state.hairStyle==='waves'){
     for(const sign of [-1,1]){
       const side=make(new THREE.SphereGeometry(.065,20,12),c,hairGroup,sign*.106,-.078,-.027);
       side.scale.set(.85,2.6,1.15);
       const end=make(new THREE.SphereGeometry(.06,16,12),c,hairGroup,sign*.104,-.215,-.04);end.scale.set(.9,1.1,1);
     }
     const back=make(new THREE.SphereGeometry(.14,22,15),c,hairGroup,0,-.065,-.089);back.scale.set(1.08,1.7,.78);
   }else if(state.hairStyle==='bob'){
     for(const sign of [-1,1]){const side=make(new THREE.SphereGeometry(.077,20,12),c,hairGroup,sign*.102,-.067,-.026);side.scale.set(.83,1.55,.99)}
     const back=make(new THREE.SphereGeometry(.13,20,12),c,hairGroup,0,-.065,-.091);back.scale.set(1.03,1.1,.75);
   }else{
     const back=make(new THREE.SphereGeometry(.08,20,12),c,hairGroup,0,.04,-.167);back.scale.set(1.25,1.1,.8);
     const bun=make(new THREE.SphereGeometry(.085,20,14),c,hairGroup,0,.065,-.21);bun.scale.set(1.1,.9,.84);
   }
 }else if(state.hairStyle==='swept'){
   const fringe=make(new THREE.SphereGeometry(.122,24,16),c,hairGroup,-.025,.139,.044);fringe.scale.set(1.15,.37,.65);fringe.rotation.z=.19;
 }else if(state.hairStyle==='curly'){
   for(let i=0;i<13;i++){const a=i*2.39996;const r=.063*Math.sqrt(i/13);make(new THREE.SphereGeometry(.038,12,9),c,hairGroup,Math.cos(a)*r,.158+Math.sin(i*5)*.012,Math.sin(a)*r+.004)}
 }else{
   const fringe=make(new THREE.SphereGeometry(.115,24,14),c,hairGroup,0,.13,.013);fringe.scale.set(1,.36,.78);
 }
}

function createClothing(){
 if(clothesGroup){root.remove(clothesGroup);clothesGroup.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose()}})}
 clothesGroup=new THREE.Group();root.add(clothesGroup);
 const fabric=state.fabric,accent=state.accent;
 if(sex==='female'){
   if(state.outfit==='dress'){
     const skirt=make(new THREE.CylinderGeometry(.18,.41,.79,36,1,true),fabric,clothesGroup,0,.63,0);
     skirt.material.side=THREE.DoubleSide;
     const belt=make(new THREE.CylinderGeometry(.184,.191,.06,28),accent,clothesGroup,0,1.02,0);
   } else if(state.outfit==='abaya'){
     const wrap=make(new THREE.CylinderGeometry(.3,.43,1.24,36,1,true),fabric,clothesGroup,0,.69,0);
     const trim=make(new THREE.BoxGeometry(.018,.91,.02),accent,clothesGroup,0,.83,.325);
     wrap.material.transparent=true;wrap.material.opacity=.95;
   } else {
     const collar=make(new THREE.TorusGeometry(.17,.028,9,26),accent,clothesGroup,0,1.37,.026);
     collar.rotation.x=.22;
   }
 }else{
   if(state.outfit==='suit'){
     const lapelL=make(new THREE.BoxGeometry(.11,.39,.035),accent,clothesGroup,-.12,1.28,.103);
     lapelL.rotation.z=.31;const lapelR=lapelL.clone();lapelR.position.x=.12;lapelR.rotation.z=-.31;clothesGroup.add(lapelR);
     const tie=make(new THREE.ConeGeometry(.036,.32,5),fabric,clothesGroup,0,1.23,.13);
   }else if(state.outfit==='classic'){
     make(new THREE.BoxGeometry(.026,.47,.025),accent,clothesGroup,0,1.19,.144);
   }else{
     const collar=make(new THREE.TorusGeometry(.16,.024,8,24),accent,clothesGroup,0,1.39,.016);
     collar.rotation.x=.18;
   }
 }
}

function updateVisual(){
 if(!model)return;
 tintBase();
 createHair();
 createClothing();
 root.scale.set(Number(state.body)/100,1,Number(state.body)/100);
 if(headBone)headBone.scale.x=Number(state.face)/100;
}

function useSkeleton(){
 headBone=model.getObjectByName('Head')||null;
 const find=name=>model.getObjectByName(name)||null;
 walkLegs=[find('thigh_l'),find('thigh_r')].filter(Boolean).map(b=>({bone:b,base:b.rotation.x}));
 walkArms=[find('upperarm_l'),find('upperarm_r')].filter(Boolean).map(b=>({bone:b,base:b.rotation.x}));
 const parts=[];model.traverse(o=>{if(o.isSkinnedMesh||o.isMesh)parts.push(o)});
 bodyMesh=parts.find(o=>/superhero|retopology/i.test(o.name))||parts.sort((a,b)=>b.geometry.getAttribute('position').count-a.geometry.getAttribute('position').count)[0];
 eyesMesh=parts.find(o=>/eyes/i.test(o.name))||parts[1];
 browsMesh=parts.find(o=>/brow/i.test(o.name))||parts[0];
 if(bodyMesh)bodyMesh.geometry=bodyMesh.geometry.clone();
 updateVisual();
}

function showError(){
 setMessage('The 3D model could not load. Reload this preview or check your connection.');
}
setMessage('Loading 3D character…');
new GLTFLoader().load('assets/bkbk-avatar-'+sex+'.glb',gltf=>{
 model=gltf.scene;root.add(model);
 useSkeleton();
 setMessage('');
},undefined,showError);

function changeInput(e){
 const el=e.target,k=el.dataset.setting;if(!k)return;
 if(k==='body'||k==='face')state[k]=Math.min(115,Math.max(85,Number(el.value)||100));
 else state[k]=el.value;
 updateVisual();
}
document.querySelectorAll('[data-setting]').forEach(el=>{
 if(Object.hasOwn(state,el.dataset.setting))el.value=String(state[el.dataset.setting]);
 el.addEventListener('input',changeInput);
 el.addEventListener('change',changeInput);
});
document.querySelectorAll('[data-tab]').forEach(btn=>btn.addEventListener('click',()=>{
 const t=btn.dataset.tab;
 document.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-selected',String(b===btn)));
 document.querySelectorAll('[data-panel]').forEach(p=>p.hidden=p.dataset.panel!==t);
}));
const say=(s)=>{$('save-status').textContent=s};
$('save-avatar').addEventListener('click',()=>{try{localStorage.setItem(storageKey,JSON.stringify(state));say('Your avatar choices are saved on this device.')}catch{say('Saving was blocked by this browser.')}});
$('reset-avatar').addEventListener('click',()=>{
 state={...presets[sex]};
 document.querySelectorAll('[data-setting]').forEach(el=>el.value=String(state[el.dataset.setting]));
 updateVisual();say('Original choices restored. Press Save to keep them.');
});
$('night-mode').addEventListener('click',()=>{
 const night=stage.dataset.mode!=='night';stage.dataset.mode=night?'night':'day';
 stage.style.backgroundImage='url("'+(night?stage.dataset.night:stage.dataset.day)+'")';
 $('night-mode').textContent=night?'☀ Day view':'☾ Night view';
});
document.querySelectorAll('[data-turn]').forEach(btn=>btn.addEventListener('click',()=>{rotation+=Number(btn.dataset.turn)*Math.PI/6}));
$('motion').addEventListener('click',()=>{
 motion=motion==='idle'?'walk':'idle';
 $('motion').textContent=motion==='walk'?'Stop walking':'Walk in place';
 $('motion').classList.toggle('active',motion==='walk');
});
canvas.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(dragging){rotation+=(e.clientX-lastX)*.011;lastX=e.clientX}});
canvas.addEventListener('pointerup',()=>dragging=false);
canvas.addEventListener('pointercancel',()=>dragging=false);
resize();
const clock=new THREE.Clock();
let animationId=0;
function frame(){
 animationId=requestAnimationFrame(frame);
 const dt=Math.min(clock.getDelta(),.05);
 time+=dt;
 root.rotation.y+=(rotation-root.rotation.y)*Math.min(1,dt*9);
 if(model){
   const walk=motion==='walk';
   walkLegs.forEach(({bone,base},i)=>bone.rotation.x=base+(walk?Math.sin(time*8+i*Math.PI)*.32:0));
   walkArms.forEach(({bone,base},i)=>bone.rotation.x=base+(walk?Math.sin(time*8+i*Math.PI+Math.PI)*.17:0));
   model.position.y=walk?Math.sin(time*16)*.012:Math.sin(time*1.5)*.004;
 }
 renderer.render(scene,camera);
}
frame();
document.addEventListener('visibilitychange',()=>{if(document.hidden){clock.getDelta()}});
