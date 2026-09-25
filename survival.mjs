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
