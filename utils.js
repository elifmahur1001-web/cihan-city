export const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export const random=(min,max)=>min+Math.random()*(max-min);
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export const angleTo=(a,b)=>Math.atan2(b.y-a.y,b.x-a.x);
export const intersects=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
