import {createServer} from 'node:net';
// Reserve a pair together so restarts can retain one task-owned browser origin.
export const reserveBrowserPorts=async():Promise<readonly [number,number]>=>{
 const sockets=[createServer(),createServer()];
 try{await Promise.all(sockets.map(socket=>new Promise<void>((resolve,reject)=>{socket.once('error',reject);socket.listen(0,'127.0.0.1',resolve);})));const ports=sockets.map(socket=>{const address=socket.address();if(!address||typeof address==='string')throw new Error('test_port_unavailable');return address.port;});return [ports[0]!,ports[1]!];}
 finally{await Promise.all(sockets.map(socket=>new Promise<void>(resolve=>{if(!socket.listening){resolve();return;}socket.close(()=>resolve());})));}
};
