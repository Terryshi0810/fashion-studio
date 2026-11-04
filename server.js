'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=__dirname, port=Number(process.env.PORT||8128);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.mp4':'video/mp4','.ogg':'audio/ogg','.wav':'audio/wav','.md':'text/plain; charset=utf-8','.json':'application/json; charset=utf-8'};
http.createServer((req,res)=>{
  let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);res.end();return;}
  const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
  if(!file.startsWith(root+path.sep)||file===path.join(root,'server.js')){res.writeHead(403);res.end();return;}
  fs.stat(file,(err,stat)=>{
    if(err||!stat.isFile()){res.writeHead(404);res.end('Not found');return;}
    const headers={'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Accept-Ranges':'bytes'};
    let start=0,end=stat.size-1,code=200;
    if(req.headers.range){
      const range=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      if(!range){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`});res.end();return;}
      if(range[1]){start=Number(range[1]);end=range[2]?Math.min(end,Number(range[2])):end;}
      else if(range[2])start=Math.max(0,stat.size-Number(range[2]));
      if(start>end||start>=stat.size){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`});res.end();return;}
      code=206;headers['Content-Range']=`bytes ${start}-${end}/${stat.size}`;
    }
    headers['Content-Length']=end-start+1;
    res.writeHead(code,headers);
    if(req.method==='HEAD'){res.end();return;}
    fs.createReadStream(file,{start,end}).on('error',()=>res.destroy()).pipe(res);
  });
}).listen(port,'127.0.0.1',()=>console.log('Fashion Studio: http://127.0.0.1:'+port));
