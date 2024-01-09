const TelegramApi = require("node-telegram-bot-api");
const axios = require("axios");

const token = "6517660147:AAG5KrFSlrBlf1Ws3zzzM6abchj3i4-vWrU";
const bot = new TelegramApi(token, { polling: true });

const userStates = {};

let response = null;
let text = null;
let userName = null;

const start = () => {
  bot.setMyCommands([
    {
      command: "/start",
      description: "From the beginning",
    },
  ]);

  bot.on("message", async (msg) => {
    text = msg.text;
    const chatId = msg.chat.id;
    userName = msg.from.first_name;

    if (text === "/start" && userStates[chatId] !== "waitingForId") {
      userStates[chatId] = "idle";
      const keyboard = {
        inline_keyboard: [
          [
            {
              text: "I have an ID ✅",
              callback_data: "have_id",
            },
            {
              text: "Link to create ID 🔗",
              url: "https://cwx.internetzone.space/?b=hackbot&s15=eug",
            },
          ],
        ],
      };

      const replyMarkup = JSON.stringify(keyboard);
      const imgPath = "images/img_1.jpg";

      await bot.sendMessage(
        chatId,
        `👋 Hello ${userName}, I am a 𝗛𝗔𝗖𝗞𝗕𝗢𝗧🚀 for the Aviator game at Lopobet casino 💰. I can give you winning bets. To start, tell me your 𝗜𝗗.`
      );

      await bot.sendPhoto(chatId, imgPath, {
        reply_markup: replyMarkup,
      });
    } else if (userStates[chatId] === "waitingForId") {
      userStates[chatId] = "waitingForResponse";
      if (text === "/start") {
        userStates[chatId] = "idle";
        start();
      } else if (/^\d{6}$/.test(text)) {
        try {
          response = await axios.post(
            "https://g-tracker.space/admin_api/v1/conversions/log",
            {
              limit: 0,
              offset: 0,
              columns: [
                "status",
                "campaign",
                "campaign_group",
                "sub_id_10",
                "sub_id_11",
              ],
              sort: [
                {
                  name: "sub_id",
                  order: "ASC",
                },
              ],
              range: {
                interval: "all_time",
                timezone: "Europe/Kyiv",
              },
            },
            {
              headers: {
                "Api-Key": "e48e6ecc28356b34343c57167d32ad14",
              },
            }
          );

          // console.log("====================================");
          // console.log(response.data);
          // console.log("====================================");

          const userId = text.split("_")[0];
          const filteredData = response.data.rows.filter((row) => {
            const subId10 = row.sub_id_10.split("_")[0];
            return subId10 === userId;
          });

          if (filteredData.length > 0) {
            const keyboard = {
              inline_keyboard: [
                [
                  {
                    text: "Yes ✅",
                    callback_data: "yes_deposit",
                  },
                  {
                    text: "No ❌",
                    callback_data: "no_deposit",
                  },
                ],
              ],
            };

            const replyMarkup = JSON.stringify(keyboard);

            return bot
              .sendMessage(
                chatId,
                "👍 Great, I see your ID in the system!🔥 Have you already made a deposit of at least 500 rupees? 💰",
                { reply_markup: replyMarkup }
              )
              .then(async () => {
                try {
                  const dataToSend = {
                    chatId: chatId,
                    keitaroId: userId,
                    status: "found",
                    userName: userName,
                  };

                  await sendToExel(dataToSend);
                } catch (error) {
                  console.error(
                    "Error calling the Apps Script web service:",
                    error
                  );
                }
              });
          } else {
            await bot.sendMessage(
              chatId,
              `You have entered your 𝗜𝗗: ${text} ⚠️`
            );
            // handleNoDeposit(chatId);
            await bot
              .sendMessage(
                chatId,
                "🔄 I don't see your 𝗜𝗗 in the system yet 🤔, integration may take 1 hour. Check if you registered through our link, if not, I won't be able to connect to your account. If you did, while you wait for the integration, make a deposit and place 5 bets in the 𝗔𝘃𝗶𝗮𝘁𝗼𝗿 𝗴𝗮𝗺𝗲🚀 and play 3 other different games, I need this to train my algorithms and fully integrate with your account at Lopobet casino."
              )
              .then(async () => {
                try {
                  // Викликаємо веб-службу Apps Script для збереження даних

                  const dataToSend = {
                    chatId: chatId,
                    keitaroId: userId,
                    status: "not found",
                    userName: userName,
                  };
                  // console.log("====================================");
                  // console.log(dataToSend);
                  // console.log("====================================");
                  await sendToExel(dataToSend);
                } catch (error) {
                  console.error(
                    "Error calling the Apps Script web service:",
                    error
                  );
                }
              });
          }
        } catch (error) {
          console.error("Request error:", error);
          return bot.sendMessage(
            chatId,
            "Error while processing a request." + error
          );
        }
      } else {
        await bot.sendMessage(chatId, `Your ID: ${text}. It's not 𝗜𝗗 ❌.`);
        userStates[chatId] = "waitingForId";
        await bot.sendMessage(
          chatId,
          "👉 Enter your 𝗜𝗗, it should be 6 digits 🔢: "
        );
      }
    } else {
      const userTelegramAddress = "https://t.me/akashipredictorbot";

      // Send a message with the "Write Manager" button and a link to the user's address
      const keyboard = {
        inline_keyboard: [
          [
            {
              text: "Write Manager",
              url: userTelegramAddress,
            },
          ],
        ],
      };
      const replyMarkup = JSON.stringify(keyboard);

      await bot.sendMessage(
        chatId,
        "🤖 I am a bot that provides betting services and cannot respond to questions\\. Please follow the instructions\\.\n If you have any questions, write to  [𝘼𝙠𝙖𝙨𝙝𝙞](t.me/akashipredictorbot)\\. He will help you 🆘 \\!",
        {
          parse_mode: "MarkdownV2",
          disable_web_page_preview: true,
          reply_markup: replyMarkup,
        }
      );
    }
  });

  // ...
  bot.on("callback_query", async (callbackQuery) => {
    const data = callbackQuery.data;
    const chatId = callbackQuery.message.chat.id;

    if (data === "have_id" && userStates[chatId] !== "waitingForId") {
      userStates[chatId] = "waitingForId";
      return bot.sendMessage(
        chatId,
        "👉 Enter your 𝗜𝗗, it should be 6 digits 🔢: "
      );
    } else if (
      data === "no_deposit" &&
      userStates[chatId] === "waitingForResponse"
    ) {
      handleNoDeposit(chatId);
    } else if (
      data === "yes_deposit" &&
      userStates[chatId] === "waitingForResponse"
    ) {
      const userId = text.split("_")[0];
      try {
        const filteredData = response.data.rows.filter((row) => {
          const subId10 = row.sub_id_10.split("_")[0];
          const status = row.status;
          return (
            subId10 === userId && (status === "sale" || status === "rebill")
          );
        });

        console.log("====================================");
        console.log(filteredData);
        console.log("====================================");

        if (filteredData.length > 0) {
          const saleOrRebill = true;

          if (saleOrRebill) {
            await bot.sendMessage(
              chatId,
              "👍 Great, I see your deposit in the system!🔥"
            );

            const userTelegramAddress = "https://t.me/geroldvip";
            const keyboard = {
              inline_keyboard: [
                [
                  {
                    text: "Write Manager",
                    url: userTelegramAddress,
                  },
                ],
              ],
            };
            const replyMarkup = JSON.stringify(keyboard);
            await bot.sendMessage(
              chatId,
              "Then write to our 𝗩𝗜𝗣 manager  [𝙂𝙚𝙧𝙤𝙡𝙙 𝙎𝙖𝙣𝙩𝙞](t.me/geroldvip), they will tell you what to do next.",
              {
                disable_web_page_preview: true,
                reply_markup: replyMarkup,
              }
            );

            setTimeout(() => {
              bot.sendMessage(
                chatId,
                "Meanwhile, make 5 bets in the 𝗔𝘃𝗶𝗮𝘁𝗼𝗿 𝗴𝗮𝗺𝗲🚀 and play 3 other different games, I need this to train my algorithms and fully integrate with your account."
              );
            }, 5000);

            // Відправити дані на обробку
            const dataToSend = {
              chatId: chatId,
              keitaroId: userId,
              status: "found",
              userName: userName,
            };
            await sendToExel_page2(dataToSend);
          } else {
            // Якщо статус "sale" або "rebill" не знайдено
            await bot.sendMessage(
              chatId,
              "I don't see your deposit in the system yet, it may take 1 hour to integrate.  If you have made a deposit, then while you are waiting for the integration, place 5 bets in the Aviator game and play 3 other different games, I need this to train my algorithms and fully integrate with your Lopobet casino account."
            );

            // Відправити дані на обробку
            const dataToSend = {
              chatId: chatId,
              keitaroId: userId,
              status: "not found",
              userName: userName,
            };
            await sendToExel_page2(dataToSend);
          }
        } else {
          // Якщо ID не знайдено
          await bot.sendMessage(
            chatId,
            `You have entered your 𝗜𝗗: ${userId} ⚠️`
          );

          // Відправити повідомлення про очікування інтеграції
          await bot.sendMessage(
            chatId,
            "🔄 I don't see your 𝗜𝗗 in the system yet 🤔, integration may take 1 hour. Check if you registered through our link, if not, I won't be able to connect to your account. If you did, while you wait for the integration, make a deposit and place 5 bets in the 𝗔𝘃𝗶𝗮𝘁𝗼𝗿 𝗴𝗮𝗺𝗲🚀 and play 3 other different games, I need this to train my algorithms and fully integrate with your account at Lopobet casino."
          );

          // Відправити дані на обробку
          const dataToSend = {
            chatId: chatId,
            keitaroId: userId,
            status: "not found",
            userName: userName,
          };
          await sendToExel_page2(dataToSend);
        }
      } catch (error) {
        console.error("Request error:", error);
        return bot.sendMessage(
          chatId,
          "Error while processing a request." + error
        );
      }
    }
  });
  // ...
};

start();

async function handleNoDeposit(chatId) {
  const keyboard = {
    inline_keyboard: [
      [
        {
          text: "DEPOSIT",
          url: "https://cwx.internetzone.space/?b=hackbot&s15=eug",
        },
      ],
    ],
  };

  const replyMarkup = JSON.stringify(keyboard);

  await bot.sendMessage(
    chatId,
    "😔 Unfortunately, I can't proceed until you make a deposit.",
    { reply_markup: replyMarkup }
  );

  setTimeout(() => {
    clearUserState(chatId);
  }, 5000);
}

function clearUserState(chatId) {
  if (userStates[chatId]) {
    delete userStates[chatId];
  }

  const keyboard = {
    inline_keyboard: [
      [
        {
          text: "I have an 𝗜𝗗",
          callback_data: "have_id",
        },
      ],
    ],
  };

  const replyMarkup = JSON.stringify(keyboard);

  bot.sendMessage(chatId, "Do you have an 𝗜𝗗 ?", {
    reply_markup: replyMarkup,
  });
}

function sendToExel(dataToSend) {
  console.log(dataToSend);
  const apiUrl =
    "https://script.google.com/macros/s/AKfycbyhx5eE25N1miCZYSCDeUOisJb2HM0P7Ft5rVHH1OFADjsM0js5kUmbA1DeQlRXU502/exec";

  axios
    .get(apiUrl, {
      params: dataToSend,
      timeout: 30000,
    })
    .then(function (response) {
      console.log(response.data);
    })
    .catch(function (error) {
      console.error("There's been a mistake:", error);
    });
}

function sendToExel_page2(dataToSend) {
  console.log(dataToSend);
  const apiUrl =
    "https://script.google.com/macros/s/AKfycbxyZjodQ1x64kvHVUSMlzV0hNxOiO9Mj_DAXk9G8xSD7IwyGLqEuV-cu9NwIU3j2FssoQ/exec";

  axios
    .get(apiUrl, {
      params: dataToSend,
      timeout: 30000,
    })
    .then(function (response) {
      console.log(response.data);
    })
    .catch(function (error) {
      console.error("There's been a mistake:", error);
    });
}
