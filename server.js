const fs = require("fs");
const { createServer } = require("http");
const path = require("path");

const { createRequestHandler } = require("@remix-run/express");
const compression = require("compression");
const express = require("express");
const morgan = require("morgan");
const { Server } = require("socket.io");
const { randomUUID } = require("crypto");

const MODE = process.env.NODE_ENV;
const BUILD_DIR = path.join(process.cwd(), "server/build");

if (!fs.existsSync(BUILD_DIR)) {
  console.warn(
    "Build directory doesn't exist, please run `npm run dev` or `npm run build` before starting the server."
  );
}

console.log("in server.js");

const app = express();

// You need to create the HTTP server from the Express app
const httpServer = createServer(app);

// And then attach the socket.io server to the HTTP server
const io = new Server(httpServer);

// Move into own store
const users = {};

io.use((socket, next) => {
  const userId = socket.handshake.userId;
  const playerId = socket.handshake.playerId;

  if (userId && playerId) {
    socket.userId = userId;
    socket.playerId = playerId;

    return next();
  }

  socket.userId = randomUUID();
  socket.playerId = randomUUID();
  next();
});

io.on("connection", (socket) => {
  socket.emit("session", {
    userId: socket.userId,
    playerId: socket.playerId,
  });

  socket.on("event", (data) => {
    console.log(socket.id, data);
    socket.emit("event", "pong");
  });

  socket.on("new chat message", ({ playerName, message }) => {
    // console.log(socket.id, msg);
    io.emit("chat message", `${playerName}: ${message}`);
    messageProcessor(socket.userId, message);
  });

  socket.on("new_player", (name) => {
    users[socket.userId] = { playerName: name };
    console.log("users", users);
  });
});

app.use(compression());

// You may want to be more aggressive with this caching
app.use(express.static("public", { maxAge: "1h" }));

// Remix fingerprints its assets so we can cache forever
app.use(express.static("public/build", { immutable: true, maxAge: "1y" }));

app.use(morgan("tiny"));
app.all(
  "*",
  MODE === "production"
    ? createRequestHandler({ build: require("./build") })
    : (req, res, next) => {
        purgeRequireCache();
        const build = require("./build");
        return createRequestHandler({ build, mode: MODE })(req, res, next);
      }
);

const port = process.env.PORT || 3000;

// instead of running listen on the Express app, do it on the HTTP server
httpServer.listen(port, () => {
  console.log(`Express server listening on port ${port}`);
});

////////////////////////////////////////////////////////////////////////////////
function purgeRequireCache() {
  // purge require cache on requests for "server side HMR" this won't let
  // you have in-memory objects between requests in development,
  // alternatively you can set up nodemon/pm2-dev to restart the server on
  // file changes, we prefer the DX of this though, so we've included it
  // for you by default
  for (const key in require.cache) {
    if (key.startsWith(BUILD_DIR)) {
      delete require.cache[key];
    }
  }
}

/**
 *
  "0": [
    26,
    10,
    20,
    0,
    5,
    15
  ],
  "1": [
    14,
    15,
    21,
    8,
    2,
    27
  ],
 */
const deck = {
  0: [26, 10, 20, 0, 5, 15],
  1: [14, 15, 21, 8, 2, 27],
  2: [7, 22, 17, 12, 2, 26],
  3: [16, 19, 17, 18, 25, 15],
  4: [7, 4, 10, 29, 18, 21],
  5: [16, 22, 3, 9, 10, 27],
  6: [30, 12, 8, 20, 16, 4],
  7: [0, 22, 29, 19, 8, 11],
  8: [10, 12, 13, 25, 14, 11],
  9: [0, 13, 21, 17, 9, 30],
  10: [29, 15, 12, 9, 1, 23],
  11: [26, 4, 9, 24, 19, 14],
  12: [26, 3, 23, 18, 8, 13],
  13: [14, 30, 5, 1, 18, 22],
  14: [1, 20, 19, 13, 7, 27],
  15: [22, 23, 25, 24, 21, 20],
  16: [13, 28, 6, 22, 4, 15],
  17: [16, 21, 6, 1, 11, 26],
  18: [1, 3, 4, 0, 25, 2],
  19: [15, 11, 3, 30, 24, 7],
  20: [25, 8, 9, 5, 6, 7],
  21: [0, 14, 28, 7, 23, 16],
  22: [6, 20, 14, 29, 17, 3],
  23: [5, 12, 28, 21, 19, 3],
  24: [11, 27, 4, 23, 17, 5],
  25: [18, 0, 12, 24, 6, 27],
  26: [27, 30, 25, 26, 28, 29],
  27: [16, 24, 29, 13, 2, 5],
  28: [30, 23, 19, 2, 6, 10],
  29: [17, 10, 28, 24, 1, 8],
  30: [9, 20, 11, 28, 18, 2],
};

const symbolDictionary = new Map([
  [0, ["bat"]],
  [1, ["cat"]],
  [2, ["dog", "puppy"]],
  [3, ["eye"]],
  [4, ["tie"]],
  [5, ["tea", "cup"]],
  [6, ["mic"]],
  [7, ["car"]],
  [8, ["box"]],
  [9, ["bra"]],
  [10, ["dab", "bendy"]],
  [11, ["hat"]],
  [12, ["one", "1"]],
  [13, ["two", "2"]],
  [14, ["six", "nine", "6", "9"]],
  [15, ["ten", "10"]],
  [16, ["key"]],
  [17, ["ear", "pear"]],
  [18, ["pie"]],
  [19, ["bee"]],
  [20, ["ice", "cube"]],
  [21, ["sun"]],
  [22, ["map"]],
  [23, ["top"]],
  [24, ["fan"]],
  [25, ["nut", "walnut"]],
  [26, ["gas"]],
  [27, ["web"]],
  [28, ["egg", "eggs"]],
  [29, ["owl"]],
  [30, ["bug"]],
]);

function getMatchingSymbols(cardOne, cardTwo) {
  // given 2 cards, find the answer and return answer back
  // card1 and card2 are strings e.g. '1', '2', etc.
  const card1 = String(cardOne);
  const card2 = String(cardTwo);
  let answer = -1;

  const symbolKey = (() => {
    for (let i = 0; i < deck[card1].length; i++) {
      for (let j = 0; j < deck[card2].length; j++) {
        const symbol1 = deck[card1][i];
        const symbol2 = deck[card2][j];
        if (symbol1 == symbol2) {
          answer = symbol1;
          return answer;
        }
      }
    }

    return answer;
  })();

  console.log("symbolKey", symbolKey);
  console.log("answers", symbolDictionary.get(symbolKey));
  return symbolDictionary.get(symbolKey);
}

const deckSize = 31;
let round = 0;
let scores = {};
let cardOne = 0;
let cardTwo = 0;

function drawTwoNewCards() {
  cardOne = Math.floor(Math.random() * deckSize);
  cardTwo = Math.floor(Math.random() * deckSize);
  while (cardOne === cardTwo) {
    cardTwo = Math.floor(Math.random() * deckSize);
  }

  console.log("inside drawTwoNewCards");
  io.emit("spotItCards", [cardOne, cardTwo]);
}

function messageProcessor(userId, message) {
  console.log("in message processor");
  console.log("userId", userId, "message", message);

  if (message === "start") {
    round = 1;
    console.log("round", round);
    scores = {};

    drawTwoNewCards();
    // cardOne = Math.floor(Math.random() * deckSize);
    // cardTwo = Math.floor(Math.random() * deckSize);
    // while (cardOne === cardTwo) {
    //   cardTwo = Math.floor(Math.random() * deckSize);
    // }
    // io.emit("spotItCards", [cardOne, cardTwo]);

    return;
  }

  const answers = getMatchingSymbols(cardOne, cardTwo);
  if (answers.includes(message)) {
    console.log("original score:", scores[userId]);
    scores[userId] = scores[userId] === undefined ? 1 : scores[userId] + 1;
    console.log("new score:", scores[userId]);

    const playerName = users[userId].playerName;
    console.log("before emit");
    io.emit(
      "chat message",
      `[Spot It Bot] ${playerName} got it! Their score is now ${scores[userId]} `
    );
    console.log("after emit");

    // next card
    drawTwoNewCards();
  }
}
