const socket = io();

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");
const room = document.getElementById("room");

room.hidden = true;

let roomName;

function ShowRoom(msg){
    welcome.hidden = true;
    room.hidden = false;
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName}`;
    
    const msgForm = room.querySelector("#msg");
    msgForm.addEventListener("submit",(event)=>{
        event.preventDefault();
        const input = room.querySelector("#msg input");
        const value = input.value;
        socket.emit("new_message",value,roomName,()=>{
            AddMessage(`You: ${value}`);
        });
        input.value="";
    });

    const nameForm = room.querySelector("#name");
    nameForm.addEventListener("submit",(event)=>{
        event.preventDefault();
        const input = room.querySelector("#name input");
        socket.emit("nickname", input.value);
    });
}

form.addEventListener("submit",(event) => {
    event.preventDefault();
    const input = form.querySelector("input");
    roomName = input.value;
    socket.emit("enter_room", roomName, ShowRoom);
    input.value = "";
});


socket.on("welcome",(user, newCount)=>{
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName} (${newCount})`;
    AddMessage(`${user} arrived!`);
});

socket.on("bye", (left, newCount) => {
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName} (${newCount})`;
    addMessage(`${left} left ㅠㅠ`);
});

socket.on("new_message",AddMessage);

socket.on("room_change",(rooms)=>{
    const roomList = welcome.querySelector("ul");
    roomList.innerHTML = "";
    if(rooms.length === 0){
        return;
    }
    rooms.forEach((room) => {
        const li = document.createElement("li");
        li.innerText = room;
        roomList.append(li);
    });
});

function AddMessage(message){
    const ul = room.querySelector("ul");
    const li = document.createElement("li");
    li.innerText = message;
    ul.appendChild(li);
}