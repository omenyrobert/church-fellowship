import { Server, Socket } from "socket.io";
import { getChatRoomMessages, createMessage, getMessagesBtnUsers, markMessagesAsRead, getMessageById } from "../Entities/Message";
import { push_expo_notification } from "../Helpers/mobile";
import { getUserById } from "../Entities/User";

type Msg = {
  content: string;
  type: string;
  senderId: number;
  recieverId?: number;
  token: string;
}

export function handleChatRoom(io: Server, socket: Socket) {
  socket.on("chatroom:join", async () => {
    const latestMessages =await getChatRoomMessages();
    socket.join("chatroom");
    socket.emit("chatroom:latestMessages", latestMessages);
  });

  socket.on("chatroom:message", async (msg: Msg) => {
    const message = await createMessage(msg.content, msg.type, msg.senderId, msg.recieverId);
    io.to("chatroom").emit("chatroom:message", message);
    
  });

  socket.on("chatroom:moreMessages", async (page: number) => {
    const messages = await getChatRoomMessages(page);
    socket.emit("chatroom:latestMessages", messages);
  })

}



export function handleUserChat(io: Server, socket: Socket) {

  socket.on("userchat:join", async (users: {
    senderId: number;
    recieverId: number;
  }) => {
    const latestMessages = await getMessagesBtnUsers(users.senderId, users.recieverId);
    socket.join(`userchat:${users.senderId}:${users.recieverId}`);
    socket.join(`userchat:${users.recieverId}:${users.senderId}`);
    socket.emit("userchat:latestMessages", latestMessages);

  })


  socket.on("userchat:message", async (msg: Msg) => {
    const message = await createMessage(msg.content, msg.type, msg.senderId, msg.recieverId);
    io.to(`userchat:${msg.senderId}:${msg.recieverId}`).emit("userchat:message", message);
    if (msg.recieverId) {
      const reciever = await getUserById(msg.recieverId);
      if (!reciever) return;
      await push_expo_notification(reciever.device_token, msg.content, "New Message")
    }
  })

  socket.on("message:read", async ({
                    msgId,
                    user,
                    username
                }) => {
    await markMessagesAsRead(msgId);
    const msg = await getMessageById( msgId);

    if (msg) {
      const latestMessages = await getMessagesBtnUsers(msg.sender.id, msg.reciever.id);
      io.to(`userchat:${msg.sender.id}:${msg.reciever.id}`).emit("userchat:latestMessages", latestMessages);
    }
  })
  

  socket.on("userchat:moreMessages", async ({
    senderId,
    recieverId,
    page
  }) => {
    const messages = await getMessagesBtnUsers(senderId, recieverId, page);
    socket.emit("userchat:latestMessages", messages);
  })


}