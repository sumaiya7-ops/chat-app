"use client";

import { useEffect, useState } from "react";
import socket from "../lib/socket";

export default function Home() {
  const [search, setSearch] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const emojis = ["😊", "😂", "❤️", "🔥", "👍"];

  const currentUser = { id: "user1", name: "kookie" };

  /* USERS LOAD */
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/users");
        const data = await res.json();

        const filtered = data.filter(
          (u: any) => u._id !== currentUser.id
        );

        setUsers(filtered);
      } catch (err) {
        console.error(err);
      }
    };

    loadUsers();
  }, []);

  /* CHAT LOAD */
  useEffect(() => {
    if (!selectedUser) return;

    const loadChat = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/messages?sender=${currentUser.id}&receiver=${selectedUser._id}`
        );

        const data = await res.json();
        setChat(data);
      } catch (err) {
        console.error(err);
      }
    };

    loadChat();
  }, [selectedUser]);

  /* SOCKET */
  useEffect(() => {
    const handleMessage = (data: any) => {
      if (!selectedUser) return;

      const roomId = [currentUser.id, selectedUser._id]
        .sort()
        .join("_");

      if (data.roomId === roomId) {
        setChat((prev) => [...prev, data]);
      }
    };

    socket.on("receive_message", handleMessage);

    return () => {
      socket.off("receive_message", handleMessage);
    };
  }, [selectedUser]);

  /* ROOM */
  const createRoom = (user: any) => {
    setSelectedUser(user);

    const roomId = [currentUser.id, user._id].sort().join("_");
    socket.emit("join_room", roomId);
  };

  /* SEND MESSAGE */
  const sendMessage = () => {
    if (!selectedUser || !message.trim()) return;

    const roomId = [currentUser.id, selectedUser._id]
      .sort()
      .join("_");

    socket.emit("send_message", {
      senderId: currentUser.id,
      receiverId: selectedUser._id,
      text: message,
      roomId,
    });

    setChat((prev) => [
      ...prev,
      {
        senderId: currentUser.id,
        receiverId: selectedUser._id,
        text: message,
        roomId,
      },
    ]);

    setMessage("");
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "Segoe UI", background: "#f0f2f5" }}>

      {/* LEFT */}
      <div style={{ width: 320, background: "#fff", borderRight: "1px solid #ddd", display: "flex", flexDirection: "column" }}>

        <div style={{ padding: 10 }}>
          <input
            placeholder="🔍 Search user"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: 10, marginBottom: 10 }}
          />

          <input
            placeholder="📱 Add by number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            style={{ width: "100%", padding: 10 }}
          />
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 10 }}>
          {users
            .filter((u) =>
              u.name?.toLowerCase().includes(search.toLowerCase())
            )
            .map((user) => {
              const isSelected = selectedUser?._id === user._id;

              return (
                <div
                  key={user._id}
                  onClick={() => createRoom(user)}
                  style={{
                    padding: 10,
                    cursor: "pointer",
                    background: isSelected ? "#e7f3ff" : "transparent",
                    borderRadius: 8,
                    marginBottom: 5,
                  }}
                >
                  {user.name}
                </div>
              );
            })}
        </div>
      </div>

      {/* RIGHT */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

        {/* CHAT */}
        <div style={{ flex: 1, padding: 20, overflowY: "auto" }}>
          {chat.map((msg, i) => {
            const isMe = msg.senderId === currentUser.id;

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: isMe ? "flex-end" : "flex-start",
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    padding: "10px 15px",
                    borderRadius: 15,
                    background: isMe ? "#0084ff" : "#fff",
                    color: isMe ? "#fff" : "#000",
                  }}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}
        </div>

        {/* INPUT */}
        <div style={{ display: "flex", padding: 10, gap: 5 }}>

          {emojis.map((e, i) => (
            <button
              key={i}
              onClick={() => setMessage((p) => p + e)}
              style={{ border: "none", background: "transparent", fontSize: 18 }}
            >
              {e}
            </button>
          ))}

          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type message..."
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 25,
              border: "1px solid #ccc",
            }}
          />

          <button
            onClick={sendMessage}
            style={{
              width: 50,
              height: 50,
              borderRadius: "50%",
              background: "#0084ff",
              color: "#fff",
              border: "none",
            }}
          >
            ➤
          </button>
        </div>

      </div>
    </div>
  );
}