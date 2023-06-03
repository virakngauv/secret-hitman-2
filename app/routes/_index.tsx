import { useEffect, useRef, useState } from "react";

import { useSocket } from "~/context";

export default function Index() {
  const socket = useSocket();
  const [playerName, setPlayerName] = useState("");
  const [cards, setCards] = useState<Array<any>>([]);
  const [messages, setMessages] = useState<Array<any>>([
    'Type "start" to start or re-start a game',
  ]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!socket) return;

    socket.on("event", (data) => {
      console.log(data);
    });

    socket.on("session", ({ userId, playerId }) => {
      socket.auth = { userId };
      window.sessionStorage.setItem("userId", userId);

      socket.playerId = playerId;
    });

    socket.on("chat message", (data) => {
      console.log("chat message data", { data });

      setMessages((messages) => {
        const newMessages = messages.concat([data]);
        if (newMessages.length > 5) {
          newMessages.shift();
        }

        return newMessages;
      });
    });

    socket.on("spotItCards", (cards: [number, number]) => {
      const [cardOneOrdinal, cardTwoOrdinal] = cards;
      const cardOneImage = (
        <img
          src={`/images/cards/${cardOneOrdinal}.png`}
          alt={`card ${cardOneOrdinal}`}
        />
      );
      const cardTwoImage = (
        <img
          src={`/images/cards/${cardTwoOrdinal}.png`}
          alt={`card ${cardTwoOrdinal}`}
        />
      );

      console.log("inside spotItCards event");
      // const newMessages = messages.concat([[cardOneImage, cardTwoImage]]);
      // console.log("newMessages", newMessages);
      // setMessages(newMessages);
      setCards([cardOneImage, cardTwoImage]);
    });
  }, [socket]);

  // const messageInputRef = useRef(null);
  useEffect(() => {
    // window.scrollTo(0, document.body.scrollHeight);
    console.log("messages changed!");

    // messageInputRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    console.log("open dialog maybe?");
    const dialogElement = document.getElementById(
      "selectPlayerNameDialog"
    ) as HTMLDialogElement | null;
    if (dialogElement && !dialogElement.open) {
      dialogElement.showModal();
    }
  }, []);

  function handleSubmitMessage() {
    console.log("in handlesubmitmessage");
    if (!socket) return;

    if (!playerName) {
      console.error("no player name bruh");
    }
    socket.emit("new chat message", { playerName, message });
    setMessage("");
  }

  function handleSubmitPlayer() {
    // console.log(!!socket);
    if (!socket) return;

    socket.emit("new_player", playerName);
    const dialogElement = document.getElementById(
      "selectPlayerNameDialog"
    ) as HTMLDialogElement | null;
    if (dialogElement) {
      dialogElement.close();
    }
  }

  return (
    <div>
      <dialog id="selectPlayerNameDialog">
        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <input
            value={playerName}
            onChange={(e) => {
              setPlayerName(e.target.value);
            }}
          />
          <input
            type="submit"
            value="Submit Name"
            onClick={handleSubmitPlayer}
          />
        </form>
      </dialog>
      <div>{cards}</div>
      <div>
        {messages.map((message) => {
          return <div key={message}>{message}</div>;
        })}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <input
          // ref={messageInputRef}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
          }}
        />
        <input type="submit" value="Submit" onClick={handleSubmitMessage} />
      </form>
    </div>
  );
}
