using Microsoft.AspNetCore.SignalR;
using SignalR.Shared.Contracts;

namespace SignalR.HubServer.Hubs;

public sealed class ChatHub
    : Microsoft.AspNetCore.SignalR.Hub
{
    // Práctica 4: solo se aceptan estas salas (validación en el servidor)
    private static readonly HashSet<string> AllowedRooms =
        new(StringComparer.Ordinal) { "Desarrollo", "Diseño" };

    // Versión original: envía a todos los conectados
    public async Task SendMessage(string user, string message)
    {
        var chatMessage = CreateMessage(user, message);

        await Clients.All.SendAsync("ReceiveMessage", chatMessage);
    }

    // Práctica 4: unirse a una sala
    public async Task JoinRoom(string room)
    {
        ValidateRoom(room);

        await Groups.AddToGroupAsync(Context.ConnectionId, room);
    }

    // Práctica 4: salir de una sala
    public async Task LeaveRoom(string room)
    {
        ValidateRoom(room);

        await Groups.RemoveFromGroupAsync(Context.ConnectionId, room);
    }

    // Práctica 4: enviar solo a los miembros de una sala
    public async Task SendMessageToRoom(string room, string user, string message)
    {
        ValidateRoom(room);

        var chatMessage = CreateMessage(user, message);

        await Clients.Group(room).SendAsync("ReceiveMessage", chatMessage);
    }

    // Validaciones compartidas (pasos 16 y 17)
    private static ChatMessage CreateMessage(string user, string message)
    {
        if (string.IsNullOrWhiteSpace(user) ||
            string.IsNullOrWhiteSpace(message))
        {
            throw new HubException(
                "El usuario y el mensaje son obligatorios.");
        }

        user = user.Trim();
        message = message.Trim();

        if (user.Length > 40 || message.Length > 1000)
        {
            throw new HubException(
                "El mensaje supera el límite permitido.");
        }

        return new ChatMessage(
            user,
            message,
            DateTimeOffset.UtcNow);
    }

    private static void ValidateRoom(string room)
    {
        if (string.IsNullOrWhiteSpace(room) || !AllowedRooms.Contains(room))
        {
            throw new HubException("La sala no existe.");
        }
    }
}
