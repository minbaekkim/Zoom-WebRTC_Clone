// Backend
// import WebSocket from "ws";
import http from "http";
import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/*",(req,res) => res.render("home"));
app.get("/",(req,res) => res.render("home"));

const httpServer = http.createServer(app);
const wsServer = new Server(httpServer, {
    cors: {
        origin: ["https://admin.socket.io"],
        credentials: true,
    },
});

instrument(wsServer, {
    auth: false,
});

wsServer.on("connection",(socket) => {
    wsServer.sockets.emit("room_change", publicRooms());
    socket["nickname"] = "Anon";
    socket.onAny((event)=>{
        console.log(`socket event:${event}`);
    });
    socket.on("enter_room",(roomName, done) => {
        socket.join(roomName);
        done();
        socket.to(roomName).emit("welcome", socket.nickname, CountRoom(roomName));
        wsServer.sockets.emit("room_change", publicRooms());
    });
    socket.on("disconnecting",()=>{
        socket.rooms.forEach(room => {
            socket.to(room).emit("bye",socket.nickname, CountRoom(room)-1);
        });
    });
    socket.on("disconnect", () => {
        wsServer.sockets.emit("room_change", publicRooms());
    });
    socket.on("new_message",(msg, room, done)=>{
        socket.to(room).emit("new_message",`${socket.nickname}: ${msg}`);
        done();
    })
    socket.on("nickname", (nickname) => (socket["nickname"] = nickname));
});

function publicRooms() {
    const {
        sockets: {
            adapter: { sids, rooms },
        },
    } = wsServer;
    const publicRooms = [];
    // sids는 소켓 아이디를 말하며 rooms는 자동으로 소켓 아이디와 같은 방에 접속하게 됨
    // 만약 방 아이디중, 소켓 아이디에 없는 것이 있다면 그 방은 public이라는 뜻
    rooms.forEach((_, key) => {
        if (sids.get(key) === undefined) {
            publicRooms.push(key); 
        }
    });
    return publicRooms;
}

function CountRoom(roomName) {
    return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}


// const wss =  new WebSocket.Server({server});
/* const sockets = [];
wss.on("connection", (socket) => {
    sockets.push(socket);
    socket["nickname"] = "Anonymous";
    console.log("Connected to Browser!");
    socket.on("close",() => console.log("Disconnected the Browser!"));
    socket.on("message",(msg) => {
        const message = JSON.parse(msg.toString());
        switch(message.type){
            case "new_message":
                sockets.forEach(aSocket => {
                    if(socket.nickname === aSocket.nickname)
                        aSocket.send(`${socket.nickname}(나): ${message.payload}`); 
                    else                       
                        aSocket.send(`${socket.nickname}: ${message.payload}`);
                });
                break;
            case "nickname":
                socket["nickname"] = message.payload;
                break;
        }
    });
}); */

httpServer.listen(3000, () => {
    console.log(`Listening on http://localhost:3000`);
});
