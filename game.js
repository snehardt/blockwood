import * as THREE from './three.module.js';
import {biomeAt,terrainHeight,createHealth,damage,regenerate,canMine,standing,findPath,createExposure,tickExposure,touchesCactus,isUnderwater,traceBlocks,blockOverlapsBody} from './survival.mjs?v=20260926-r3';
const $=s=>document.querySelector(s),canvas=$('#game');
const renderer=new THREE.WebGLRenderer({canvas,antialias:false});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);renderer.setClearColor(0xa5d4e4);renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene();scene.fog=new THREE.Fog(0xa5d4e4,38,85);const camera=new THREE.PerspectiveCamera(75,innerWidth/innerHeight,.05,140);camera.rotation.order='YXZ';
scene.add(new THREE.HemisphereLight(0xe8f8ff,0x657445,2));const sun=new THREE.DirectionalLight(0xfff0ce,2.1);sun.position.set(-30,60,20);scene.add(sun);
const names=['','Grass','Dirt','Stone','Oak log','Leaves','Sand','Cactus'];const colors=['','#729943','#89603e','#85878a','#795331','#557b33','#d9c387','#528a40'];let rng=1837;function random(){rng=(rng*1664525+1013904223)>>>0;return rng/4294967296}
const atlas=document.createElement('canvas');atlas.width=256;atlas.height=16;const ctx=atlas.getContext('2d');const bases=['#749c43','#88603f','#86878a','#75512e','#547c36','#d8c487','#b58c54','#688d3e','#528a40'];
for(let t=0;t<9;t++){ctx.fillStyle=bases[t];ctx.fillRect(t*16,0,16,16);for(let i=0;i<160;i++){const x=Math.floor(random()*16),y=Math.floor(random()*16);ctx.fillStyle=random()>.5?'rgba(255,255,255,.12)':'rgba(0,0,0,.13)';ctx.fillRect(t*16+x,y,t===3?2:1,t===3?4:1)}if(t===6){ctx.strokeStyle='#775432';for(let j=2;j<8;j+=3)ctx.strokeRect(t*16+j,j,16-j*2,16-j*2)}if(t===7){ctx.fillStyle='#88603f';ctx.fillRect(t*16,6,16,10);for(let x=0;x<16;x++){ctx.fillStyle='#749c43';ctx.fillRect(t*16+x,0,1,4+Math.floor(random()*5))}}}
const texture=new THREE.CanvasTexture(atlas);texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.NearestFilter;texture.colorSpace=THREE.SRGBColorSpace;const material=new THREE.MeshLambertMaterial({map:texture});
let buildHeight=25;
const blocks=new Map(),chunks=new Map(),SIZE=48,key=(x,y,z)=>`${x},${y},${z}`,get=(x,y,z)=>blocks.get(key(x,y,z))||0;function set(x,y,z,t){if(t){blocks.set(key(x,y,z),t);buildHeight=Math.max(buildHeight,y+1);}else blocks.delete(key(x,y,z))}
const height=terrainHeight;
for(let x=-SIZE;x<SIZE;x++)for(let z=-SIZE;z<SIZE;z++){let h=height(x,z);for(let y=0;y<=h;y++)set(x,y,z,y===h?(biomeAt(x,z)==='desert'||h<=5?6:1):y>h-3?(biomeAt(x,z)==='desert'?6:2):3)}
function tree(x,z,h=5){const y=height(x,z)+1;if(get(x,y-1,z)!==1)return;for(let j=0;j<h;j++)set(x,y+j,z,4);for(let dy=-2;dy<=1;dy++){const r=dy===1?1:2;for(let dx=-r;dx<=r;dx++)for(let dz=-r;dz<=r;dz++){if(Math.abs(dx)===2&&Math.abs(dz)===2&&random()>.4)continue;if(!get(x+dx,y+h+dy,z+dz))set(x+dx,y+h+dy,z+dz,5)}}}
for(let x=-42;x<43;x+=6)for(let z=-42;z<43;z+=6){if(random()<.63&&Math.hypot(x-3,z-14)>5)tree(x+Math.floor(random()*3),z+Math.floor(random()*3),4+Math.floor(random()*3))}tree(3,9,5);
for(let x=19;x<44;x+=7)for(let z=-40;z<44;z+=9){if(random()<.65)for(let y=1;y<=3;y++)set(x,height(x,z)+y,z,7)}
const faces=[{d:[1,0,0],v:[[1,0,1],[1,0,0],[1,1,0],[1,1,1]],s:.82},{d:[-1,0,0],v:[[0,0,0],[0,0,1],[0,1,1],[0,1,0]],s:.7},{d:[0,1,0],v:[[0,1,1],[1,1,1],[1,1,0],[0,1,0]],s:1},{d:[0,-1,0],v:[[0,0,0],[1,0,0],[1,0,1],[0,0,1]],s:.5},{d:[0,0,1],v:[[0,0,1],[1,0,1],[1,1,1],[0,1,1]],s:.88},{d:[0,0,-1],v:[[1,0,0],[0,0,0],[0,1,0],[1,1,0]],s:.75}];
function rebuild(cx,cz){const id=`${cx},${cz}`;if(chunks.has(id)){scene.remove(chunks.get(id));chunks.get(id).geometry.dispose()}const p=[],n=[],uv=[],c=[],ix=[];for(let x=cx*16;x<cx*16+16;x++)for(let z=cz*16;z<cz*16+16;z++)for(let y=0;y<buildHeight;y++){const t=get(x,y,z);if(!t)continue;for(let f=0;f<6;f++){const {d,v,s}=faces[f];if(get(x+d[0],y+d[1],z+d[2]))continue;let tile=t===1?(f===2?0:f===3?1:7):t===4?(f===2||f===3?6:3):({2:1,3:2,5:4,6:5,7:8}[t]);let base=p.length/3;for(let j=0;j<4;j++){p.push(x+v[j][0],y+v[j][1],z+v[j][2]);n.push(...d);c.push(s,s,s);uv.push((tile+([0,1,1,0][j]*.98+.01))/16,[.01,.01,.99,.99][j])}ix.push(base,base+1,base+2,base,base+2,base+3)}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(n,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));g.setIndex(ix);const mesh=new THREE.Mesh(g,material);chunks.set(id,mesh);scene.add(mesh)}material.vertexColors=true;
for(let x=-3;x<3;x++)for(let z=-3;z<3;z++)rebuild(x,z);
function updateBlock(x,y,z,t){set(x,y,z,t);const affected=new Set();for(const [dx,dz]of [[0,0],[1,0],[-1,0],[0,1],[0,-1]])affected.add(`${Math.floor((x+dx)/16)},${Math.floor((z+dz)/16)}`);for(const id of affected)rebuild(...id.split(',').map(Number))}
const water=new THREE.Mesh(new THREE.PlaneGeometry(96,96),new THREE.MeshLambertMaterial({color:0x4da6bf,transparent:true,opacity:.65}));water.rotation.x=-Math.PI/2;water.position.y=5.25;scene.add(water);
const cloudmat=new THREE.MeshBasicMaterial({color:0xf1f5ea});for(let i=0;i<17;i++){const cloud=new THREE.Mesh(new THREE.BoxGeometry(7+random()*9,1.5,3+random()*5),cloudmat);cloud.position.set(random()*140-70,27+random()*7,random()*140-70);scene.add(cloud)}const sunbox=new THREE.Mesh(new THREE.BoxGeometry(5,5,1),new THREE.MeshBasicMaterial({color:0xfff3c9}));sunbox.position.set(-38,39,-65);scene.add(sunbox);
const outline=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.008,1.008,1.008)),new THREE.LineBasicMaterial({color:0xf3ffdb}));scene.add(outline);outline.visible=false;
const hand=new THREE.Mesh(new THREE.BoxGeometry(.22,.25,.55),new THREE.MeshLambertMaterial({color:0xbf956d}));camera.add(hand);hand.position.set(.43,-.37,-.62);hand.rotation.set(-.2,-.2,.12);scene.add(camera);
let yaw=0,pitch=-.08,active=false,grounded=false,vy=0,selected=0,breaking=false,progress=0,previous='',mined=0;
const pos=new THREE.Vector3(3.5,height(3,11)+1,11.5),keys={},inventory=['pickaxe','sword',4,1,2,3,5,6],counts={4:32,1:32,2:32,3:32,5:32,6:32,7:32};
let placing=false,placeCooldown=0;
let inventoryOpen=false,exposure=createExposure();
let target=null,health=createHealth(),elapsed=0,actionCooldown=0,swing=0,kills=0,spawnTimer=0,zombie=null,damageFlash=0;
const itemName=t=>t==='pickaxe'?'Stone pickaxe':t==='sword'?'Iron sword':names[t];
const held=new THREE.Group();camera.add(held);held.position.set(.43,-.28,-.65);held.rotation.set(.15,0,-.3);
function box(parent,w,h,d,color,x=0,y=0,z=0){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshLambertMaterial({color}));m.position.set(x,y,z);parent.add(m);return m;}
function disposeGroup(group){group.traverse(o=>{o.geometry?.dispose();o.material?.dispose()});group.clear();}
function equip(){disposeGroup(held);const t=inventory[selected];hand.visible=typeof t==='number';if(t==='pickaxe'){box(held,.055,.48,.055,0x875d37,0,-.03);box(held,.34,.075,.07,0x9ba8a6,0,.2);box(held,.07,.13,.07,0x798987,-.14,.14);box(held,.07,.13,.07,0x798987,.14,.14)}else if(t==='sword'){box(held,.065,.19,.06,0x62432c,0,-.19);box(held,.22,.05,.075,0xd1c39b,0,-.08);box(held,.095,.42,.04,0xd9e8e9,0,.16);box(held,.055,.06,.04,0xeaf8f5,0,.4)}}
function icon(t){const c=document.createElement('canvas');c.width=c.height=16;const g=c.getContext('2d');if(typeof t==='number')g.drawImage(atlas,({1:0,2:1,3:2,4:3,5:4,6:5,7:8}[t])*16,0,16,16,0,0,16,16);else{g.fillStyle='#805833';g.fillRect(7,7,2,8);g.fillStyle='#d4e4e4';if(t==='pickaxe'){g.fillRect(2,3,12,3);g.fillRect(2,6,3,3);g.fillRect(11,6,3,3)}else{g.fillRect(7,1,3,10);g.fillRect(8,0,1,1);g.fillStyle='#c5ad72';g.fillRect(4,10,9,2)}}return c.toDataURL()}
function ui(){ $('#hotbar').innerHTML=inventory.map((t,i)=>`<button class="slot ${i===selected?'active':''}" aria-label="${itemName(t)}${typeof t==='number'?`, ${counts[t]} blocks`:''}" data-slot="${i}"><em>${i+1}</em><img src="${icon(t)}" alt="">${typeof t==='number'?`<strong>${counts[t]}</strong>`:''}</button>`).join('');$('#selected').textContent=itemName(inventory[selected]);document.querySelectorAll('[data-slot]').forEach(b=>b.onclick=()=>select(+b.dataset.slot));}
function select(i){selected=i;progress=0;ui();equip();if(inventoryOpen){inventoryUI();$(`[data-inventory-slot="${selected}"]`).focus()}}
function inventoryUI(){
 $('#inventorySlots').innerHTML=inventory.map((t,i)=>`<button class="slot ${i===selected?'active':''}" data-inventory-slot="${i}" aria-label="Slot ${i+1}: ${itemName(t)}" aria-pressed="${i===selected}"><em>${i+1}</em><img src="${icon(t)}" alt=""></button>`).join('');
 $('#inventoryChoice').textContent=`Choose an item for slot ${selected+1}`;
 $('#inventoryItems').innerHTML=['pickaxe','sword',1,2,3,4,5,6,7].map(t=>`<button class="inventory-item" data-item="${t}"><img src="${icon(t)}" alt=""><span>${itemName(t)}</span><small>${typeof t==='number'?counts[t]+' available':'Tool'}</small></button>`).join('');
 document.querySelectorAll('[data-inventory-slot]').forEach(b=>b.onclick=()=>select(+b.dataset.inventorySlot));
 document.querySelectorAll('[data-item]').forEach(b=>b.onclick=()=>assignItem(b.dataset.item));
}
function assignItem(item){const t=/^[1-7]$/.test(String(item))?Number(item):item;if(!['pickaxe','sword',1,2,3,4,5,6,7].includes(t))return;inventory[selected]=t;select(selected)}
function openInventory(){if(!active)return;inventoryOpen=true;active=false;placing=false;breaking=false;progress=0;dragging=false;Object.keys(keys).forEach(k=>keys[k]=false);$('#mine').style.display='none';document.exitPointerLock?.();$('#inventory').classList.remove('hidden');inventoryUI();$('#inventoryClose').focus()}
function closeInventory(){inventoryOpen=false;$('#inventory').classList.add('hidden');start()}
$('#inventoryClose').onclick=closeInventory;
$('#inventoryButton').onclick=openInventory;
function healthUI(){ $('#hearts').innerHTML=Array.from({length:10},(_,i)=>`<span class="heart ${health.hp>=i*2+2?'full':health.hp===i*2+1?'half':'empty'}"></span>`).join('');$('#hearts').setAttribute('aria-label',`${health.hp} of 20 health`);$('#healthNote').textContent=health.hp===20?'FULL HEALTH':health.sinceHit<4?'RECOVERING…':'REGENERATING'; }
ui();equip();healthUI();let toastTimer;
function toast(msg){$('#toast').textContent=msg;$('#toast').style.opacity=1;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').style.opacity=0,2300)}
function start(){Object.keys(keys).forEach(k=>keys[k]=false);canvas.focus();active=true;$('#overlay').classList.add('hidden');if(!matchMedia('(pointer:coarse)').matches){try{const p=canvas.requestPointerLock();p?.catch(()=>toast('Drag to look, or use arrow keys.'))}catch{toast('Drag to look, or use arrow keys.')}}}
function pause(){inventoryOpen=false;$('#inventory').classList.add('hidden');active=false;placing=false;breaking=false;Object.keys(keys).forEach(k=>keys[k]=false);document.exitPointerLock?.();$('#overlay').classList.remove('hidden');$('#play').innerHTML='RESUME WORLD <span>→</span>'}
$('#play').onclick=start;$('#pause').onclick=pause;
document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement&&active)pause()});
document.addEventListener('keydown',e=>{if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();keys[e.code]=true;if(e.code==='KeyE'&&!e.repeat){e.preventDefault();if(inventoryOpen)closeInventory();else openInventory()}if(e.code==='Escape'){if(inventoryOpen)closeInventory();else pause()}if(inventoryOpen&&e.code==='Tab'){const buttons=[...$('#inventory').querySelectorAll('button')];const first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}if(/^Digit[1-8]$/.test(e.code))select(+e.code.slice(-1)-1)});
document.addEventListener('keyup',e=>keys[e.code]=false);window.addEventListener('blur',()=>{if(active)pause()});
let dragging=false;
document.addEventListener('mousedown',e=>{if(active&&e.button===2&&!e.target.closest?.('button')){e.preventDefault();placing=true;placeCooldown=.18;place()}});
document.addEventListener('contextmenu',e=>{if(active)e.preventDefault()});
canvas.addEventListener('pointerdown',e=>{if(!active)return;if(e.pointerType==='touch'){dragging=true;canvas.setPointerCapture(e.pointerId)}else if(e.button===0){breaking=true;if(inventory[selected]==='sword')primary()}});
document.addEventListener('mouseup',e=>{if(e.button===2)placing=false});
document.addEventListener('pointerup',()=>{placing=false;breaking=false;dragging=false});document.addEventListener('pointercancel',()=>{placing=false;breaking=false;dragging=false});
document.addEventListener('mousemove',e=>{if(active&&(document.pointerLockElement||e.buttons===1)){yaw-=e.movementX*.0022;pitch=Math.max(-1.5,Math.min(1.5,pitch-e.movementY*.0022))}});
canvas.addEventListener('pointermove',e=>{if(e.pointerType==='touch'&&dragging){yaw-=e.movementX*.005;pitch=Math.max(-1.5,Math.min(1.5,pitch-e.movementY*.005))}});
canvas.oncontextmenu=e=>e.preventDefault();canvas.addEventListener('wheel',e=>select((selected+(e.deltaY>0?1:7))%8));
document.querySelectorAll('[data-key]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();keys[b.dataset.key]=true;b.setPointerCapture(e.pointerId)};b.onpointerup=b.onpointercancel=()=>keys[b.dataset.key]=false});
$('#touchMine').onpointerdown=e=>{if(!active)return;breaking=true;primary();e.target.setPointerCapture(e.pointerId)};$('#touchMine').onpointerup=$('#touchMine').onpointercancel=()=>breaking=false;$('#touchPlace').onclick=place;
function collision(p){for(let x=Math.floor(p.x-.29);x<=Math.floor(p.x+.29);x++)for(let y=Math.floor(p.y+.001);y<=Math.floor(p.y+1.75);y++)for(let z=Math.floor(p.z-.29);z<=Math.floor(p.z+.29);z++)if(get(x,y,z))return true;return false}
function aim(){const direction=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);return traceBlocks(get,camera.position.toArray(),direction.toArray(),6)}
function place(){
 if(!active)return;
 camera.position.copy(pos).add(new THREE.Vector3(0,1.62,0));camera.rotation.set(pitch,yaw,0);target=aim();
 const t=inventory[selected];
 if(typeof t!=='number')return toast('Press E to choose a block for your hotbar.');
 if(!target?.last)return toast('Aim at a block face within reach to place.');
 if(!counts[t])return toast('Break blocks to collect more.');
 const [x,y,z]=target.last;
 if(y<0||y>=256||x< -48||x>=48||z< -48||z>=48)return toast('World boundary reached.');
 if(get(x,y,z))return;
 if(blockOverlapsBody(target.last,pos.toArray()))return toast('Step back or jump to make room for this block.');
 if(zombie&&blockOverlapsBody(target.last,zombie.pos.toArray(),.4,1.95))return toast('A zombie is in the way.');
 updateBlock(x,y,z,t);if(zombie)zombie.repath=0;counts[t]--;ui();sound(150,.04);
}
let audio;function sound(freq,duration){try{audio??=new AudioContext();const o=audio.createOscillator(),g=audio.createGain();o.type='square';o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(freq*.4,audio.currentTime+duration);g.gain.setValueAtTime(.035,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration)}catch{}}
const particles=[];
function burst(at,color){for(let i=0;i<10;i++){const m=box(scene,.1,.1,.1,color,...at);particles.push({m,v:new THREE.Vector3((random()-.5)*4,random()*4,(random()-.5)*4),life:.7})}}
function destroy(){if(!target||target.a[1]===0)return;if(!canMine(target.t,inventory[selected]))return toast(target.t===3?'Select your pickaxe (1) to mine stone.':'Use your pickaxe (1) to mine blocks.');const {a,t}=target;updateBlock(...a,0);counts[t]++;mined++;if(zombie)zombie.repath=0;ui();sound(t===4?100:180,.1);toast(`+1 ${names[t]}`);burst(a.map(v=>v+.5),colors[t]);target=aim()}
function zombieHitDistance(){if(!zombie)return null;const ray=new THREE.Ray(camera.position,new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion));const b=new THREE.Box3(zombie.pos.clone().add(new THREE.Vector3(-.4,0,-.4)),zombie.pos.clone().add(new THREE.Vector3(.4,1.95,.4)));const hit=ray.intersectBox(b,new THREE.Vector3());if(!hit)return null;const d=camera.position.distanceTo(hit);return d<=3.2&&(!target||d<target.distance)?d:null;}
function primary(){if(!active||actionCooldown>0)return;actionCooldown=.4;swing=.22;if(inventory[selected]==='sword'){sound(250,.06);if(zombieHitDistance()!==null){zombie.hp-=5;zombie.flash=.2;zombie.stun=.3;burst(zombie.pos.clone().add(new THREE.Vector3(0,1,0)).toArray(),0x809c50);if(zombie.hp<=0){scene.remove(zombie.group);disposeGroup(zombie.group);zombie=null;kills++;spawnTimer=3;toast('Zombie defeated! Another arrives in 3 seconds.')}}}else destroy();}
function spawnPoint(cx,cz,min=8,max=15){for(let r=min;r<=max;r++)for(let i=0;i<20;i++){const a=i*Math.PI/10,x=Math.floor(cx+Math.sin(a)*r),z=Math.floor(cz-Math.cos(a)*r);if(Math.abs(x)>44||Math.abs(z)>44)continue;for(let y=23;y>5;y--){const floor=get(x,y-1,z);if([1,2,3,6].includes(floor)&&standing(get,x,y,z)){const p=new THREE.Vector3(x+.5,y,z+.5);if(!collision(p))return p}}}return new THREE.Vector3(3.5,height(3,11)+1,11.5)}
function spawnZombie(){const group=new THREE.Group(),p=spawnPoint(pos.x,pos.z);const torso=box(group,.62,.7,.33,0x347f83,0,1.05);box(group,.53,.53,.5,0x698e43,0,1.67);box(group,.1,.08,.015,0x172322,-.13,1.72,.258);box(group,.1,.08,.015,0x172322,.13,1.72,.258);box(group,.22,.055,.02,0x304735,0,1.52,.258);const legs=[box(group,.23,.7,.27,0x474a77,-.17,.35),box(group,.23,.7,.27,0x474a77,.17,.35)];box(group,.2,.2,.7,0x698e43,-.42,1.22,.28);box(group,.2,.2,.7,0x698e43,.42,1.22,.28);scene.add(group);group.position.copy(p);zombie={group,pos:p,hp:20,legs,torso,path:[],repath:0,attack:1,flash:0,stun:0};}
function lineClear(a,b){const delta=b.clone().sub(a),length=delta.length();for(let d=.15;d<length;d+=.1){const p=a.clone().addScaledVector(delta,d/length);if(get(Math.floor(p.x),Math.floor(p.y),Math.floor(p.z)))return false}return true;}
function respawnPlayer(){pos.copy(spawnPoint(3,11,0,6));health=createHealth();exposure=createExposure();vy=0;damageFlash=0;if(zombie){scene.remove(zombie.group);disposeGroup(zombie.group);zombie=null}spawnTimer=4;toast('You respawned with full hearts and your gear.');healthUI()}
function tickZombie(dt){if(!zombie){spawnTimer-=dt;if(spawnTimer<=0)spawnZombie();return}const z=zombie;z.attack-=dt;z.repath-=dt;z.stun-=dt;z.flash=Math.max(0,z.flash-dt);z.group.traverse(o=>{if(o.material)o.material.emissive.setHex(z.flash>0?0x993b2b:0)});
  if(z.repath<=0 && (!z.path.length || (Math.abs(z.pos.x%1-.5)<.04 && Math.abs(z.pos.z%1-.5)<.04))){z.path=findPath(get,[z.pos.x,Math.round(z.pos.y),z.pos.z],pos.toArray());z.repath=.85;}
  const distance=z.pos.distanceTo(pos);
  if(z.path.length&&distance>1.15&&z.stun<=0){const n=z.path[0],goal=new THREE.Vector3(n[0]+.5,n[1],n[2]+.5),delta=goal.clone().sub(z.pos),horizontal=Math.hypot(delta.x,delta.z),step=Math.min(horizontal,dt*1.65);if(horizontal>.01){const next=z.pos.clone();next.x+=delta.x/horizontal*step;next.z+=delta.z/horizontal*step;next.y=Math.max(next.y,goal.y);if(!collision(next)){z.pos.copy(next);if(horizontal<.4)z.pos.y=goal.y}else{z.path=[];z.repath=0}}if(horizontal<.08){z.pos.copy(goal);z.path.shift()}}
  // Settle onto newly mined terrain instead of floating over removed blocks.
  if(!get(Math.floor(z.pos.x),Math.floor(z.pos.y-.05),Math.floor(z.pos.z))){const next=z.pos.clone();next.y-=dt*4;if(!collision(next))z.pos.copy(next)}
  z.group.position.copy(z.pos);z.group.rotation.y=Math.atan2(pos.x-z.pos.x,pos.z-z.pos.z);const walk=z.path.length?Math.sin(elapsed*7)*.35:0;z.legs[0].rotation.x=walk;z.legs[1].rotation.x=-walk;
  if(distance<1.7&&z.attack<=0&&lineClear(z.pos.clone().add(new THREE.Vector3(0,1.4,0)),pos.clone().add(new THREE.Vector3(0,1.2,0)))){damage(health,2);z.attack=1.15;damageFlash=.35;sound(65,.12);if(health.hp<=0)respawnPlayer()}
}
function tickEnvironment(dt){
 const submerged=isUnderwater(get,pos.x,pos.y+1.62,pos.z);
 const amount=tickExposure(exposure,dt,touchesCactus(get,pos.x,pos.y,pos.z),submerged);
 if(amount){damage(health,amount);damageFlash=.35;sound(65,.12);if(health.hp<=0)respawnPlayer()}
 $('#air').hidden=!submerged;$('#air').textContent=`AIR ${Math.ceil(exposure.air)} / 10`;
}
spawnZombie();
let last=performance.now();
function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.04);last=now;
 if(active){elapsed+=dt;actionCooldown=Math.max(0,actionCooldown-dt);swing=Math.max(0,swing-dt);damageFlash=Math.max(0,damageFlash-dt);
  if(keys.ArrowLeft)yaw+=dt*1.8;if(keys.ArrowRight)yaw-=dt*1.8;if(keys.ArrowUp)pitch=Math.min(1.5,pitch+dt*1.4);if(keys.ArrowDown)pitch=Math.max(-1.5,pitch-dt*1.4);
  let dx=(+!!keys.KeyD)-(+!!keys.KeyA),dz=(+!!keys.KeyS)-(+!!keys.KeyW),len=Math.hypot(dx,dz)||1,speed=keys.ShiftLeft?7:4.4;dx/=len;dz/=len;const vx=(dx*Math.cos(yaw)+dz*Math.sin(yaw))*speed,vz=(-dx*Math.sin(yaw)+dz*Math.cos(yaw))*speed;
  for(const [axis,v]of [['x',vx],['z',vz]]){const steps=Math.max(1,Math.ceil(Math.abs(v*dt)/.04));for(let i=0;i<steps;i++){const old=pos[axis];pos[axis]+=v*dt/steps;if(Math.abs(pos[axis])>46.8){pos[axis]=old;break}
   if(collision(pos)){
    // At the surface, swim onto a low ledge without needing the lake bed.
    let climbed=false;
    if(keys.Space&&pos.y<5.25){
     const nearSurface=pos.y+.8>=4.95;
     const maxRise=nearSurface?1.85:1.01;
     for(let top=Math.floor(pos.y+.001)+1;top<=6&&top-pos.y<=maxRise;top++){
      const ledge=pos.clone();ledge.y=top;
      if(!collision(ledge)&&collision(ledge.clone().add(new THREE.Vector3(0,-.05,0)))){pos.copy(ledge);vy=Math.max(0,vy);climbed=true;break}
     }
    }
    if(!climbed){pos[axis]=old;break}
   }}}
  const swimming=isUnderwater(get,pos.x,pos.y+.8,pos.z);
  const supported=vy<=0&&collision(pos.clone().add(new THREE.Vector3(0,-.05,0)));
  if(keys.Space&&supported){vy=8.2;grounded=false;}
  // Preserve a full jump's momentum instead of clamping it to swim speed.
  if(swimming&&vy<=3){vy=keys.Space?3:Math.max(-2,vy-6*dt)}else vy-=22*dt;
  const verticalSteps=Math.max(1,Math.ceil(Math.abs(vy*dt)/.04));grounded=false;
  for(let i=0;i<verticalSteps;i++){const old=pos.y;pos.y+=vy*dt/verticalSteps;if(collision(pos)){pos.y=old;grounded=vy<0;vy=0;break}}
  if(pos.y<-10)respawnPlayer();
  if(placing){placeCooldown-=dt;if(placeCooldown<=0){place();placeCooldown=.18}}
  camera.position.copy(pos).add(new THREE.Vector3(0,1.62,0));camera.rotation.set(pitch,yaw,0);target=aim();const enemyAimed=zombieHitDistance()!==null;outline.visible=!!target&&!enemyAimed;
  if(target){outline.position.set(...target.a.map(v=>v+.5));const id=target.a.join(',');if(id!==previous)progress=0;previous=id;
   if(breaking&&inventory[selected]!=='sword'&&target.a[1]>0&&canMine(target.t,inventory[selected])){progress+=dt/(target.t===4?.65:target.t===3?.45:.3);if(progress>=1){destroy();swing=.2;progress=0}}else progress=0;
  }else progress=0;
  if(breaking&&inventory[selected]==='sword')primary();
  $('#target').textContent=enemyAimed&&zombie?`Zombie · ${zombie.hp}/20`:target?names[target.t]+(target.t===3&&inventory[selected]!=='pickaxe'?' · Pickaxe required':''):'';
  $('#mine').style.display=progress?'block':'none';$('#mine i').style.width=`${progress*100}%`;
  hand.position.y=-.37+(breaking?Math.sin(now*.025)*.045:Math.hypot(vx,vz)>0?Math.sin(now*.012)*.015:0);held.rotation.x=.15+(swing>0?Math.sin(swing/.22*Math.PI)*1.1:progress>0?Math.sin(now*.025)*.2:0);
  tickZombie(dt);tickEnvironment(dt);regenerate(health,dt);healthUI();$('#damage').style.opacity=damageFlash*1.8;$('#coords').textContent=`${Math.floor(pos.x)} / ${Math.floor(pos.z)} · DESERT → EAST`;$('#biome').textContent=biomeAt(pos.x,pos.z)==='desert'?'THE DESERT':'THE WOODLANDS';$('#enemyStatus').textContent=`${zombie?'ZOMBIE · '+zombie.hp+'/20':'NEXT ZOMBIE · '+Math.ceil(spawnTimer)+'s'}  |  DEFEATED ${kills}`;
  for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt;p.v.y-=10*dt;p.m.position.addScaledVector(p.v,dt);p.m.rotation.x+=dt*3;if(p.life<=0){scene.remove(p.m);p.m.geometry.dispose();p.m.material.dispose();particles.splice(i,1)}}
 }else{camera.position.copy(pos).add(new THREE.Vector3(0,1.62,0));camera.rotation.set(pitch,yaw,0)}renderer.render(scene,camera);
}
requestAnimationFrame(frame);window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
window.blockwood={getState:()=>({active,inventoryOpen,hotbar:[...inventory],air:exposure.air,position:pos.toArray(),biome:biomeAt(pos.x,pos.z),health:health.hp,selected:itemName(inventory[selected]),target:target?{block:names[target.t],position:target.a}:null,inventory:{...counts},mined,blocks:blocks.size,zombie:zombie?{health:zombie.hp,position:zombie.pos.toArray(),pathLength:zombie.path.length}:null,kills,spawnTimer})};
if(document.modelContext?.registerTool){try{document.modelContext.registerTool({name:'inspect_block_world',description:'Read player health, biome, equipment, zombie, and collected block inventory.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>window.blockwood.getState()})}catch{}}
