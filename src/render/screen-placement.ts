// Measured at the glass / inner bezel boundary in the unmodified 1659 × 948
// master (TL, TR, BR, BL). Rendering remains in source-image space at all sizes.
export const screenPlacement={asset:'/assets/apparatus-master-v1.png',width:1659,height:948,corners:[[892,163],[1521,177],[1499,541],[876,484]] as [number,number][]};
export function homography(corners:readonly (readonly number[])[]){
  const [a,b,c,d]=corners,dx1=b[0]-c[0],dx2=d[0]-c[0],dy1=b[1]-c[1],dy2=d[1]-c[1];
  const dx3=a[0]-b[0]+c[0]-d[0],dy3=a[1]-b[1]+c[1]-d[1],det=dx1*dy2-dx2*dy1;
  const g=(dx3*dy2-dx2*dy3)/det,h=(dx1*dy3-dx3*dy1)/det;
  return [b[0]-a[0]+g*b[0],d[0]-a[0]+h*d[0],a[0],b[1]-a[1]+g*b[1],d[1]-a[1]+h*d[1],a[1],g,h,1];
}
export function invert3(m:number[]){
  const [a,b,c,d,e,f,g,h,i]=m,v=[e*i-f*h,c*h-b*i,b*f-c*e,f*g-d*i,a*i-c*g,c*d-a*f,d*h-e*g,b*g-a*h,a*e-b*d];
  const det=a*v[0]+b*v[3]+c*v[6];return v.map(n=>n/det);
}
export function project(m:number[],x:number,y:number){const z=m[6]*x+m[7]*y+m[8];return [(m[0]*x+m[1]*y+m[2])/z,(m[3]*x+m[4]*y+m[5])/z];}
