/* Original preview renderer: weighted mesh animation, NOT the official Spine runtime. */
(function(root){
'use strict';
const loaded=new Map();let active=0;
const RIG={format:'fashion-mesh-rig/1',bones:[{name:'root',x:.5,y:.6},{name:'chest',parent:'root',x:.5,y:.32},{name:'head',parent:'chest',x:.5,y:.15},{name:'hair-left',parent:'head',x:.33,y:.14},{name:'hair-right',parent:'head',x:.68,y:.14},{name:'sleeve-left',parent:'chest',x:.22,y:.4},{name:'sleeve-right',parent:'chest',x:.78,y:.4},{name:'hem',parent:'root',x:.5,y:.8}],mesh:{columns:12,rows:22},animations:['idle','showcase']};
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
function point(u,v,time,animation='idle'){
 const pace=animation==='showcase'?1.6:1,phase=time*1.8,breath=Math.sin(phase),sway=Math.sin(time*.8)*.008*pace;
 let x=u+sway*(.35+v),y=v+breath*.0018;
 const chest=Math.exp(-Math.pow((v-.33)/.16,2))*Math.exp(-Math.pow((u-.5)/.24,2));x+=(u-.5)*breath*.008*chest;y-=breath*.002*chest;
 const head=Math.exp(-Math.pow((v-.145)/.11,2))*Math.exp(-Math.pow((u-.5)/.23,2));const headTurn=Math.sin(time*.7)*.009;x-=(v-.16)*headTurn*head;y+=(u-.5)*headTurn*head;
 const hair=smooth(.05,.16,v)*(1-smooth(.34,.50,v));const side=smooth(.07,.24,Math.abs(u-.5));x+=Math.sin(phase*.7+u*4)*.009*hair*side*pace;
 const sleeve=Math.exp(-Math.pow((v-.46)/.18,2))*smooth(.15,.35,Math.abs(u-.5));x+=Math.sin(phase*.9+u*5)*.008*sleeve*pace;y+=Math.cos(phase*.8+u*3)*.002*sleeve;
 const hem=smooth(.54,.95,v);x+=Math.sin(phase*.65+u*5+v)*.012*hem*(.4+Math.abs(u-.5))*pace;y+=Math.cos(phase*.7+u*6)*.0025*hem*pace;
 return [x,y];
}
function load(src){if(!loaded.has(src)){loaded.set(src,new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>{loaded.delete(src);reject(new Error('立绘加载失败'));};im.src=src;}));}return loaded.get(src);}
function program(gl,vs,fs){function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}const p=gl.createProgram();const a=shader(gl.VERTEX_SHADER,vs),b=shader(gl.FRAGMENT_SHADER,fs);gl.attachShader(p,a);gl.attachShader(p,b);gl.linkProgram(p);gl.deleteShader(a);gl.deleteShader(b);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p;}
let spineRenderer=null;
function mount(options){
 if(options.model.spine&&spineRenderer)return spineRenderer(options);
 const canvas=options.canvas,model=options.model;let disposed=false,raf=0,paused=Boolean(options.paused)||matchMedia('(prefers-reduced-motion: reduce)').matches,start=performance.now(),fixed=0,last=0,frames=0,im=null,gl=null,ctx=null,prog=null,texture=null,posBuffer=null,uvBuffer=null,indexBuffer=null;
 active++;
 const cols=RIG.mesh.columns,rows=RIG.mesh.rows,count=(cols+1)*(rows+1),coords=new Float32Array(count*2),uv=new Float32Array(count*2),ids=[];
 const rect=model.rect||[0,0,1,1];
 for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++){const n=(y*(cols+1)+x)*2;uv[n]=rect[0]+x/cols*rect[2];uv[n+1]=rect[1]+y/rows*rect[3];}
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const a=y*(cols+1)+x;ids.push(a,a+1,a+cols+1,a+1,a+cols+2,a+cols+1);}
 function dimensions(){const r=canvas.getBoundingClientRect(),w=Math.max(1,r.width),h=Math.max(1,r.height),dpr=Math.min(2,devicePixelRatio||1);if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}const ar=im.width*rect[2]/(im.height*rect[3]);const mh=Math.max(230,h-155),mw=Math.min(w*1.14,mh*ar),height=mw/ar;return {w,h,dpr,mw,height,left:w*.45-mw/2,top:Math.max(82,h-72-height)};}
 function initGL(){
  gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true});if(!gl)return false;
  prog=program(gl,`attribute vec2 p;attribute vec2 uv;uniform vec2 res;varying vec2 tex;void main(){vec2 clip=p/res*2.0-1.0;gl_Position=vec4(clip.x,-clip.y,0.0,1.0);tex=uv;}`,`precision mediump float;varying vec2 tex;uniform sampler2D img;uniform vec4 rect;uniform float mask;void main(){vec2 a=(tex-rect.xy)/rect.zw;float lo=0.0;float hi=1.0;if(mask>0.5&&mask<1.5){float t=clamp(a.y/.62,0.0,1.0);lo=mix(.22,0.0,t);hi=mix(.78,1.0,t);if(a.y>.31&&a.y<.62)hi=min(hi,.93);}if(mask>1.5&&mask<2.5&&a.y>.63){lo=.19;hi=.83;}if(mask>2.5&&a.y>.60)lo=.13;if(a.x<lo||a.x>hi)discard;gl_FragColor=texture2D(img,tex);}`);
  gl.useProgram(prog);posBuffer=gl.createBuffer();uvBuffer=gl.createBuffer();indexBuffer=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,posBuffer);gl.bufferData(gl.ARRAY_BUFFER,coords,gl.DYNAMIC_DRAW);const p=gl.getAttribLocation(prog,'p');gl.enableVertexAttribArray(p);gl.vertexAttribPointer(p,2,gl.FLOAT,false,0,0);
  gl.bindBuffer(gl.ARRAY_BUFFER,uvBuffer);gl.bufferData(gl.ARRAY_BUFFER,uv,gl.STATIC_DRAW);const a=gl.getAttribLocation(prog,'uv');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(ids),gl.STATIC_DRAW);
  texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,im);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);return true;
 }
 function draw(time){if(!im||disposed)return;const d=dimensions();for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++){const n=(y*(cols+1)+x)*2,q=point(x/cols,y/rows,time,options.animation||'idle');coords[n]=d.left+q[0]*d.mw;coords[n+1]=d.top+q[1]*d.height;}
  if(gl){gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(prog);gl.bindBuffer(gl.ARRAY_BUFFER,posBuffer);gl.bufferSubData(gl.ARRAY_BUFFER,0,coords);gl.uniform2f(gl.getUniformLocation(prog,'res'),d.w,d.h);gl.uniform4fv(gl.getUniformLocation(prog,'rect'),rect);gl.uniform1f(gl.getUniformLocation(prog,'mask'),model.mask||0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.drawElements(gl.TRIANGLES,ids.length,gl.UNSIGNED_SHORT,0);}
  else{ctx.setTransform(d.dpr,0,0,d.dpr,0,0);ctx.clearRect(0,0,d.w,d.h);const q=point(.5,.5,time);ctx.save();ctx.translate(d.left+(q[0]-.5)*d.mw,d.top+(q[1]-.5)*d.height);ctx.drawImage(im,rect[0]*im.width,rect[1]*im.height,rect[2]*im.width,rect[3]*im.height,0,0,d.mw,d.height);ctx.restore();}
  frames++;canvas.dataset.frames=String(frames);canvas.dataset.engine=gl?'weighted-webgl-mesh':'2d-fallback';canvas.dataset.ready='true';
 }
 function frame(now){raf=0;if(disposed)return;if(!paused&&!document.hidden&&!document.querySelector('dialog[open]')&&now-last>=1000/30){fixed=(now-start)/1000;draw(fixed);last=now;}raf=requestAnimationFrame(frame);}
 const resize=new ResizeObserver(()=>{if(im)draw(fixed);});resize.observe(canvas);
 load(model.src).then(image=>{if(disposed)return;im=image;try{if(!initGL()){ctx=canvas.getContext('2d');paused=true;}}catch(e){options.onError?.(e);return;}draw(0);options.onReady?.(gl?'weighted-webgl-mesh':'2d-fallback');if(!paused)raf=requestAnimationFrame(frame);}).catch(e=>options.onError?.(e));
 return {pause(){paused=true;if(raf)cancelAnimationFrame(raf);raf=0;draw(fixed);},resume(){if(!paused)return;paused=false;start=performance.now()-fixed*1000;if(!raf)raf=requestAnimationFrame(frame);},get paused(){return paused;},dispose(){if(disposed)return;disposed=true;active--;if(raf)cancelAnimationFrame(raf);resize.disconnect();if(gl){gl.deleteTexture(texture);gl.deleteBuffer(posBuffer);gl.deleteBuffer(uvBuffer);gl.deleteBuffer(indexBuffer);gl.deleteProgram(prog);const ext=gl.getExtension('WEBGL_lose_context');ext?.loseContext();}canvas.dataset.disposed='true';},snapshot(){draw(fixed);return canvas.toDataURL("image/png");},get frames(){return frames;}};
}
root.FashionMeshPreview={mount,point,rig:RIG,get active(){return active;},registerSpineRenderer(fn){if(typeof fn!=='function')throw new TypeError('Renderer must be a function');spineRenderer=fn;}};
})(globalThis);
