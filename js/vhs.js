function applyVhs(target,amount,progress){amount=Math.max(0,Math.min(1,Number(amount)||0));if(!amount)return;const surface=target.canvas,w=surface.width,h=surface.height;applyVhs.cache ||= new WeakMap();let buffers=applyVhs.cache.get(surface);if(!buffers||buffers.w!==w||buffers.h!==h){const small=document.createElement('canvas'),texture=document.createElement('canvas'),red=document.createElement('canvas'),cyan=document.createElement('canvas');small.width=Math.min(480,w);small.height=Math.round(h*small.width/w);red.width=cyan.width=small.width;red.height=cyan.height=small.height;texture.width=256;texture.height=256;const tc=texture.getContext('2d'),pixels=tc.createImageData(256,256);let seed=817;for(let i=0;i<pixels.data.length;i+=4){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const v=seed>>>24;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=v;pixels.data[i+3]=255}tc.putImageData(pixels,0,0);buffers={w,h,small,texture,red,cyan};applyVhs.cache.set(surface,buffers)}const low=buffers.small.getContext('2d',{willReadFrequently:true});low.clearRect(0,0,buffers.small.width,buffers.small.height);low.drawImage(surface,0,0,buffers.small.width,buffers.small.height);target.save();target.setTransform(1,0,0,1,0,0);target.globalCompositeOperation='source-over';target.imageSmoothingEnabled=true;target.globalAlpha=amount*.86;target.filter='blur(.45px) saturate(.84) contrast(1.08)';target.drawImage(buffers.small,0,0,w,h);target.filter='none';target.globalCompositeOperation='screen';target.globalAlpha=amount*.10;target.drawImage(buffers.small,1.5,0,w,h);target.globalCompositeOperation='multiply';target.globalAlpha=amount*.08;target.drawImage(buffers.small,-1,-1,w,h);const channels=low.getImageData(0,0,buffers.small.width,buffers.small.height),redData=new ImageData(new Uint8ClampedArray(channels.data),channels.width,channels.height);for(let i=0;i<channels.data.length;i+=4){redData.data[i+1]=redData.data[i+2]=0;channels.data[i]=0}buffers.red.getContext('2d').putImageData(redData,0,0);buffers.cyan.getContext('2d').putImageData(channels,0,0);target.globalCompositeOperation='screen';target.globalAlpha=amount*.20;target.filter='blur(1.5px)';target.drawImage(buffers.red,2.5,0,w,h);target.drawImage(buffers.cyan,-2.5,0,w,h);target.filter='none';target.globalCompositeOperation='soft-light';target.globalAlpha=amount*.30;target.fillStyle=target.createPattern(buffers.texture,'repeat');target.fillRect(0,0,w,h);target.globalCompositeOperation='source-over';target.globalAlpha=amount*.24;target.fillStyle='#09101b';const step=Math.max(3,Math.round(w/300));for(let y=0;y<h;y+=step)target.fillRect(0,y,w,1);target.restore();}

// Single-frame color and texture treatment; no temporal sampling or duplicated edges.
function applyTapeTone(target,amount){
 amount=Math.max(0,Math.min(1,Number(amount)||0));if(!amount)return;
 const w=target.canvas.width,h=target.canvas.height;
 const frame=target.getImageData(0,0,w,h),source=new Uint8ClampedArray(frame.data),pixels=frame.data;
 // Keep the ungraded colors for a Gaussian screen layer.
 applyTapeTone.buffers ||= new WeakMap();
 let glow=applyTapeTone.buffers.get(target.canvas);
 if(!glow||glow.width!==w||glow.height!==h){glow=document.createElement('canvas');glow.width=w;glow.height=h;applyTapeTone.buffers.set(target.canvas,glow);}
 glow.getContext('2d').putImageData(frame,0,0);
 const boost=amount*amount;
 const radius=Math.max(1,Math.round(w/160*amount*(1+boost)));let seed=817;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*4,lum=.299*source[i]+.587*source[i+1]+.114*source[i+2];
  let red=0,green=0,blue=0;
  for(let tap=-2;tap<=2;tap++){
   const j=(y*w+Math.max(0,Math.min(w-1,x+tap*radius)))*4,weight=tap===0?.4:Math.abs(tap)===1?.2:.1;
   red+=source[j]*weight;green+=source[j+1]*weight;blue+=source[j+2]*weight;
  }
  const blurredLum=.299*red+.587*green+.114*blue;
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  const grain=((seed>>>24)/255-.5)*(9+boost*21);
  for(let c=0;c<3;c++){
   const blurred=c===0?red:c===1?green:blue;
   const chroma=(source[i+c]-lum)*(1-amount*.8)+(blurred-blurredLum)*amount*.8;
   const softened=lum+(blurredLum-lum)*amount*(.1+boost*.14);
   const faded=softened*(.85-boost*.23)+25+boost*23+chroma*(.65-boost*.27);
   pixels[i+c]=source[i+c]*(1-amount)+(faded+grain)*amount;
  }
 }
 target.putImageData(frame,0,0);
 target.save();
 target.setTransform(1,0,0,1,0,0);
 target.globalCompositeOperation='screen';
 // Map slider 50% to the previous Gaussian strength at 80%, keeping both endpoints.
 const glowAmount=Math.pow(amount,Math.log(.8)/Math.log(.5));
 target.globalAlpha=.68*Math.pow(glowAmount,1.25);
 target.filter='blur('+(w/960*(4+14*glowAmount))+'px)';
 target.drawImage(glow,0,0);
 target.restore();
}

// Directional luminance relief retains the source colors and leaves flat areas unchanged.
function applyVhsEmboss(target,amount){
 amount=Math.max(0,Math.min(1,Number(amount)||0));if(!amount)return;
 const w=target.canvas.width,h=target.canvas.height,frame=target.getImageData(0,0,w,h);
 const pixels=frame.data,luma=new Float32Array(w*h),step=Math.max(1,Math.round(w/400));
 for(let i=0;i<luma.length;i++)luma[i]=pixels[i*4]*.299+pixels[i*4+1]*.587+pixels[i*4+2]*.114;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const a=Math.max(0,y-step)*w+Math.max(0,x-step),b=Math.min(h-1,y+step)*w+Math.min(w-1,x+step);
  const relief=Math.max(-120,Math.min(120,(luma[a]-luma[b])*1.6))*amount,i=(y*w+x)*4;
  pixels[i]+=relief;pixels[i+1]+=relief;pixels[i+2]+=relief;
 }
 target.putImageData(frame,0,0);
}
