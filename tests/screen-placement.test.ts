import test from 'node:test';
import assert from 'node:assert/strict';
import { homography,invert3,project,screenPlacement as P,containedScreen } from '../src/render/screen-placement';
test('measured display corners and interior survive inverse mapping at all display scales',()=>{
  const unit=[[0,0],[1,0],[1,1],[0,1]],h=homography(P.corners),inverse=invert3(h);
  unit.forEach((p,i)=>project(h,...p as [number,number]).forEach((v,k)=>assert(Math.abs(v-P.corners[i][k])<1e-8)));
  for(const scale of [.24,.5,1,2])for(const [u,v] of [...unit,[.25,.8],[.7,.3]]){
    const scaled=homography(P.corners.map(p=>p.map(n=>n*scale))),point=project(scaled,u,v),roundtrip=project(inverse,point[0]/scale,point[1]/scale);
    assert(Math.abs(roundtrip[0]-u)<1e-8);assert(Math.abs(roundtrip[1]-v)<1e-8);
  }
});
test('Different desktop aspect ratios are contained without stretching or losing any pixels',()=>{for(const [w,h] of [[1280,800],[1920,1080],[800,1280],[2560,1080]]){const [x,y]=containedScreen(w,h);assert(x<=1&&y<=1&&x>0&&y>0);assert(Math.abs((x*P.aspect)/y-w/h)<1e-9);assert(x===1||y===1);}assert(Math.abs(containedScreen(1280,800)[0]-.9)<1e-12);});
