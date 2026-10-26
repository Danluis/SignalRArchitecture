"use strict";

const connection =
    new signalR.HubConnectionBuilder()
    .withUrl("https://localhost:7001/chatHub")
    .withAutomaticReconnect()
    .build();

const sendButton = document.getElementById("sendButton");
const status = document.getElementById("status");
const messagesList = document.getElementById("messagesList");
const roomSelect = document.getElementById("roomSelect");

let currentRoom = roomSelect.value;

// Práctica 1: mostrar la hora (SentAt llega como message.sentAt)
connection.on("ReceiveMessage", (message) => {
    const item = document.createElement("li");
    const time = new Date(message.sentAt).toLocaleTimeString();
    item.textContent = `[${time}] ${message.user}: ${message.message}`;
    messagesList.appendChild(item);
});

// Práctica 3: estados de la conexión
connection.onreconnecting(() => {
    status.textContent = "Reconectando...";
    sendButton.disabled = true;
});

connection.onreconnected(async () => {
    // Al reconectar cambia el ConnectionId y se pierden los grupos:
    // hay que volver a unirse a la sala
    await joinRoom(currentRoom);
    status.textContent = `Conectado a ${currentRoom}`;
    sendButton.disabled = false;
});

connection.onclose(() => {
    // Se ejecuta cuando la reconexión automática se rinde
    status.textContent = "Desconectado. Reintentando...";
    sendButton.disabled = true;
    setTimeout(startConnection, 5000);
});

async function joinRoom(room) {
    await connection.invoke("JoinRoom", room);
}

async function startConnection() {
    try {
        await connection.start();
        await joinRoom(currentRoom);
        status.textContent = `Conectado a ${currentRoom}`;
        sendButton.disabled = false;
    } catch (error) {
        // Práctica 3: el primer start no se reintenta solo, lo hacemos aquí
        status.textContent = "Error de conexión. Reintentando...";
        console.error(error);
        setTimeout(startConnection, 5000);
    }
}

// Práctica 4: cambiar de sala
roomSelect.addEventListener("change", async () => {
    const newRoom = roomSelect.value;

    if (connection.state !== signalR.HubConnectionState.Connected) {
        currentRoom = newRoom;
        return;
    }

    try {
        await connection.invoke("LeaveRoom", currentRoom);
        await joinRoom(newRoom);
        currentRoom = newRoom;
        messagesList.innerHTML = "";
        status.textContent = `Conectado a ${currentRoom}`;
    } catch (error) {
        console.error("No se pudo cambiar de sala:", error);
        roomSelect.value = currentRoom;
    }
});

sendButton.addEventListener("click", async () => {
    const user = document
        .getElementById("userInput").value.trim();
    const message = document
        .getElementById("messageInput").value.trim();

    if (!user || !message) {
        alert("Completa el usuario y el mensaje.");
        return;
    }

    if (connection.state !== signalR.HubConnectionState.Connected) {
        alert("No existe una conexión activa.");
        return;
    }

    try {
        await connection.invoke(
            "SendMessageToRoom", currentRoom, user, message);
        document.getElementById("messageInput").value = "";
    } catch (error) {
        // Práctica 2: aquí aparece el HubException del servidor
        console.error("No se pudo enviar el mensaje:", error);
    }
});

startConnection();
