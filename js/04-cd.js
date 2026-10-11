// CD 플레이어: scene assets and renderer. Shared controls live in series-editor.js.
window.SceneProject={"active":"exe","pool":{"cat-exe-a":"../assets/cat/exe-a.jpg","cat-exe-album":"../assets/cat/exe-album.jpg","cat-exe-b":"../assets/cat/exe-b.jpg","cat-exe":"../assets/cat/exe.jpg","cd-base":"../assets/cd/player-base-clean-top.png","cd-lid":"../assets/cd/player-lid-integrated-joints.png"}};
function cdMaterials(){
const color=/^#[0-9a-f]{6}$/i.test(config.accent)?config.accent:'#287eb4',base=images['cd-base'],lid=images['cd-lid'];
if(cdMaterials.cache?.color===color&&cdMaterials.cache.base===base&&cdMaterials.cache.lid===lid)return cdMaterials.cache;
const rgb=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));
const tint=im=>{const surface=document.createElement('canvas');surface.width=im.width;surface.height=im.height;const ctx=surface.getContext('2d');ctx.drawImage(im,0,0);const frame=ctx.getImageData(0,0,im.width,im.height),d=frame.data;for(let i=0;i<d.length;i+=4){if(!d[i+3])continue;const r=d[i],g=d[i+1],b=d[i+2],mask=clamp((b-r-8)/36)*clamp((b-g+12)/40);if(!mask)continue;const light=(r*.2126+g*.7152+b*.0722)/255;for(let j=0;j<3;j++){const value=light<.45?rgb[j]*light/.45:rgb[j]+(255-rgb[j])*(light-.45)/.55;d[i+j]=d[i+j]*(1-mask)+value*mask}}ctx.putImageData(frame,0,0);return surface};
return cdMaterials.cache={color,base,lid,body:tint(base),cover:tint(lid)};
}
function cdMotion(p){
const smooth=v=>v*v*v*(v*(v*6-15)+10),u=clamp((p-.04)/.76),brake=clamp((p-.80)/.10);
const flutter=.012*Math.sin(18*Math.PI*u)*Math.pow(Math.sin(Math.PI*u),2),jolt=Math.sin(5*Math.PI*brake)*Math.exp(-3*brake)*Math.sin(Math.PI*brake);
return {angle:Math.PI/12+2*Math.PI*(3*smooth(u)+flutter)+.09*jolt,shake:1.6*jolt,stage:p<.80?'PLAY':'STOP',elapsed:p<.80?Math.floor(p*config.duration):0}}
function exe(p){
rr(0,0,900,1100,0,config.backgroundColor||'#e5e9eb');if(config.wallpaper==='photo'){const blur=clamp(Number(config.backgroundBlur)||0,0,30),pad=blur*3;c.save();c.filter=`blur(${blur*2}px)`;pic('bg',-pad,-pad,900+pad*2,1100+pad*2);c.restore()}
const materials=cdMaterials(),m=cdMotion(config.motion?p:0),cx=450,cy=610,r=260;
c.save();c.shadowColor='#16293633';c.shadowBlur=25;c.shadowOffsetY=18;c.drawImage(materials.body,100,300,700,700);c.restore();if(m.stage!=='PLAY'){c.save();c.beginPath();c.arc(555,912,17,0,Math.PI*2);c.clip();c.filter='hue-rotate(115deg) saturate(1.2)';c.drawImage(images['cd-base'],100,300,700,700);c.restore()}
function disc(){const x=cx+m.shake,y=cy-m.shake*.45;c.save();c.translate(x,y);c.rotate(m.angle);c.shadowColor='#12232d66';c.shadowBlur=8;c.shadowOffsetY=5;c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.arc(0,0,21,0,Math.PI*2,true);c.fillStyle='#c8d9dd';c.fill('evenodd');c.shadowColor='transparent';c.save();c.beginPath();c.arc(0,0,r-5,0,Math.PI*2);c.arc(0,0,24,0,Math.PI*2,true);c.clip('evenodd');pic('album',-r,-r,r*2,r*2);c.restore();c.beginPath();c.arc(0,0,29,0,Math.PI*2);c.strokeStyle='#dce8eabb';c.lineWidth=9;c.stroke();c.beginPath();c.arc(0,0,r-2,0,Math.PI*2);c.strokeStyle='#ecf8ffb0';c.lineWidth=3;c.stroke();c.restore()}
function lid(){const im=materials.cover;c.save();c.beginPath();c.rect(160,320,580,580);c.clip();c.filter='saturate(.72) brightness(1.03)';c.globalAlpha=.28;c.drawImage(im,160,320,580,580);c.save();c.globalAlpha=.43;c.beginPath();c.rect(160,320,580,580);c.moveTo(685,610);c.arc(450,610,235,0,Math.PI*2);c.clip('evenodd');c.drawImage(im,160,320,580,580);c.restore();c.globalAlpha=.85;c.beginPath();c.roundRect(432,847,39,39,5);c.clip();c.drawImage(im,160,320,580,580);c.restore()}
rr(365,905,160,37,5,'#aebbac','#68736a');txt(m.stage==='STOP'?'STOP':'01  '+ipodClock(m.elapsed),445,913,19,'#35483c',400,145,'center','mono');
disc();lid();

}


window.renderScene=exe;
