export const MAX_HEALTH = 20;
export const biomeAt = (x, z) => x > 12 + Math.sin(z * .12) * 3 ? 'desert' : 'woodlands';
export function terrainHeight(x, z) {
  if (biomeAt(x, z) === 'desert') return Math.max(6, Math.floor(9 + Math.sin(x * .12 + z * .08) * 2 + Math.cos(z * .17) * 1.5));
  return Math.floor(7 + Math.sin(x * .105) * 2.5 + Math.cos(z * .13) * 2 + Math.sin(x * .24 + z * .17) * 1.3);
}
export function createHealth() { return { hp: MAX_HEALTH, sinceHit: 0, regen: 0 }; }
export function damage(state, amount) { state.hp = Math.max(0, state.hp - amount); state.sinceHit = 0; state.regen = 0; }
export function regenerate(state, dt) {
  const before = state.sinceHit; state.sinceHit += dt;
  if (state.hp <= 0 || state.hp >= MAX_HEALTH) return;
  state.regen += Math.max(0, state.sinceHit - Math.max(4, before));
  while (state.regen >= 1.5 && state.hp < MAX_HEALTH) { state.hp++; state.regen -= 1.5; }
}
export const canMine = (block, tool) => tool !== 'sword' && (block !== 3 || tool === 'pickaxe');
export function standing(get, x, y, z) { return y > 0 && !!get(x,y-1,z) && !get(x,y,z) && !get(x,y+1,z); }
// Breadth-first navigation follows actual blocks, including one-block steps and short drops.
export function findPath(get, from, to, limit = 6500) {
  const start = from.map(Math.floor), goal = to.map(Math.floor), id = p => p.join(',');
  const queue = [start], parents = new Map([[id(start), null]]), nodes = new Map([[id(start), start]]);
  let best = start, bestScore = Infinity;
  for (let i=0; i<queue.length && i<limit; i++) {
    const p=queue[i], score=Math.hypot(p[0]-goal[0],p[2]-goal[2])+Math.abs(p[1]-goal[1]);
    if (score < bestScore) { best=p; bestScore=score; }
    if (score < 1.2) break;
    for (const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const x=p[0]+dx,z=p[2]+dz;
      if(Math.abs(x)>46 || Math.abs(z)>46) continue;
      for(let y=p[1]+1;y>=Math.max(1,p[1]-3);y--) {
        if(!standing(get,x,y,z)) continue;
        // Both sides of the crossing must clear the zombie's head.
        const crossY=Math.max(y,p[1]);
        if(get(p[0],crossY,p[2]) || get(p[0],crossY+1,p[2]) || get(x,crossY,z) || get(x,crossY+1,z)) continue;
        const n=[x,y,z], k=id(n);
        if(!parents.has(k)) { parents.set(k,id(p)); nodes.set(k,n); queue.push(n); }
        break;
      }
    }
  }
  const path=[]; let k=id(best);
  while(parents.get(k)!==null) { path.push(nodes.get(k)); k=parents.get(k); }
  return path.reverse();
}

// Water fills empty cells below the lake surface inside the island bounds.
export function isUnderwater(get,x,y,z){return x>=-48&&x<48&&z>=-48&&z<48&&y>=0&&y<5.25&&!get(Math.floor(x),Math.floor(y),Math.floor(z));}
export function touchesCactus(get,x,y,z){
  // A small contact margin reaches solid cactus even when movement is blocked.
  for(let bx=Math.floor(x-.34);bx<=Math.floor(x+.34);bx++)
    for(let by=Math.floor(y-.05);by<=Math.floor(y+1.8);by++)
      for(let bz=Math.floor(z-.34);bz<=Math.floor(z+.34);bz++)if(get(bx,by,bz)===7)return true;
  return false;
}
export function createExposure(){return {air:10,cactus:0,drowning:0};}
export function tickExposure(state,dt,cactus,submerged){
  let amount=0;
  if(cactus){state.cactus-=dt;if(state.cactus<=0){amount++;state.cactus+=1;}}else state.cactus=0;
  if(submerged){const remaining=state.air;state.air=Math.max(0,remaining-dt);state.drowning+=Math.max(0,dt-remaining);while(state.drowning>=1){amount+=2;state.drowning-=1;}}
  else{state.air=10;state.drowning=0;}
  return amount;
}

// Visit voxels at exact face crossings, including negative coordinates and edge ties.
export function traceBlocks(get,origin,direction,reach=6){
 const cell=origin.map(Math.floor),step=direction.map(Math.sign);
 const delta=direction.map(d=>d===0?Infinity:Math.abs(1/d));
 const next=direction.map((d,i)=>d===0?Infinity:((cell[i]+(d>0?1:0))-origin[i])/d);
 let last=null,distance=0;
 while(distance<=reach){
  const t=get(...cell);if(t)return {a:[...cell],last,t,distance};
  let axis=0;if(next[1]<next[axis])axis=1;if(next[2]<next[axis])axis=2;
  if(!Number.isFinite(next[axis]))return null;
  last=[...cell];distance=next[axis];cell[axis]+=step[axis];next[axis]+=delta[axis];
 }
 return null;
}
export function blockOverlapsBody([x,y,z],[px,py,pz],radius=.29,height=1.75){
 const epsilon=.00001;
 return x+1>px-radius+epsilon&&x<px+radius-epsilon&&y+1>py+epsilon&&y<py+height-epsilon&&z+1>pz-radius+epsilon&&z<pz+radius-epsilon;
}
