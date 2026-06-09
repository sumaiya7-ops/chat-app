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

        const filteredUsers = data.filter(
          (u: any) => u._id !== currentUser.id
        );

        setUsers(filteredUsers.length > 0 ? filteredUsers : data);
      } catch (error) {
        console.error(error);
      }
    };

    loadUsers();
  }, []);

  /* CHAT LOAD */
  useEffect(() => {
    if (!selectedUser) return;

    const loadChatHistory = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/messages?sender=${currentUser.id}&receiver=${selectedUser._id}`
        );

        const data = await res.json();
        setChat(data);
      } catch (error) {
        console.error(error);
      }
    };

    loadChatHistory();
  }, [selectedUser]);

  /* SOCKET */
  useEffect(() => {
    const handleMessage = (data: any) => {
      if (!selectedUser) return;

      const roomId = [currentUser.id, selectedUser._id]
        .sort()
        .join("_");

      if (data.roomId === roomId) {
        setChat((prev) => {
          const exists = prev.some((m) => m._id === data._id);
          if (exists) return prev;
          return [...prev, data];
        });
      }
    };

    socket.on("receive_message", handleMessage);

    return () => {
      socket.off("receive_message", handleMessage);
    };
  }, [selectedUser]);

  /* CREATE ROOM */
  const createRoom = (user: any) => {
    setSelectedUser(user);

    const roomId = [currentUser.id, user._id].sort().join("_");
    socket.emit("join_room", roomId);
  };

  /* SEND MESSAGE */
  const sendMessage = () => {
    if (!selectedUser || !message.trim()) return;

    const roomId = [currentUser.id, selectedUser._id].sort().join("_");

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
    <div
      style={{
        display: "flex",
        height: "100vh",
        fontFamily: "Segoe UI",
        backgroundColor: "#f0f2f5",
      }}
    >
      {/* LEFT SIDE */}
      <div
        style={{
          width: "320px",
          backgroundColor: "#fff",
          borderRight: "1px solid #ddd",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: "10px" }}>
          <input
            type="text"
            placeholder="🔍 Search user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "10px",
              border: "1px solid #ddd",
              marginBottom: "10px",
            }}
          />

          <input
            type="text"
            placeholder="📱 Add by Number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "10px",
              border: "1px solid #ddd",
            }}
          />
        </div>

        {/* USERS */}
        <div style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
          {users
            .filter((user) =>
              user.name
                ?.toLowerCase()
                .includes(search.toLowerCase())
            )
            .map((user) => {
              const isSelected =
                selectedUser?._id === user._id;

              return (
                <div
                  key={user._id}
                  onClick={() => createRoom(user)}
                  style={{
                    padding: 10,
                    cursor: "pointer",
                    borderRadius: 8,
                    marginBottom: 5,
                    backgroundColor: isSelected
                      ? "#e7f3ff"
                      : "transparent",
                  }}
                >
                  {user.name}
                </div>
              );
            })}
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* CHAT BOX */}
        <div
          style={{
            flex: 1,
            padding: 20,
            overflowY: "auto",
          }}
        >
          {chat.map((msg, i) => {
            const isMe =
              msg.senderId === currentUser.id;

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: isMe
                    ? "flex-end"
                    : "flex-start",
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    padding: "10px 15px",
                    borderRadius: 10,
                    background: isMe
                      ? "#0084ff"
                      : "#fff",
                    color: isMe
                      ? "#fff"
                      : "#000",
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
              onClick={() => setMessage((prev) => prev + e)}
              style={{ fontSize: 18, background: "none", border: "none" }}
            >
              {e}
            </button>
          ))}

          <input
            value={message}
            onChange={(e) =>
              setMessage(e.target.value)
            }
            onKeyDown={(e) =>
              e.key === "Enter" && sendMessage()
            }
            placeholder="Type a message..."
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "25px",
              border: "1px solid #ccc",
              outline: "none",
            }}
          />

          <button
            onClick={sendMessage}
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              border: "none",
              backgroundColor: "#0084ff",
              color: "#fff",
              fontSize: "20px",
              cursor: "pointer",
            }}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}