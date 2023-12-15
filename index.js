const TelegramApi = require("node-telegram-bot-api");
const axios = require("axios");

const token = "6517660147:AAG5KrFSlrBlf1Ws3zzzM6abchj3i4-vWrU";

const bot = new TelegramApi(token, { polling: true });

const userStates = {};

const start = () => {
  bot.setMyCommands([
    {
      command: "/start",
      description: "Початкове привітання",
    },
  ]);

  bot.on("message", async (msg) => {
    const text = msg.text;
    const chatId = msg.chat.id;
    const userName = msg.from.first_name;

    if (text === "/start") {
      userStates[chatId] = "idle"; // Оновити стан користувача на "idle" при команді /start
      const keyboard = {
        inline_keyboard: [
          [
            {
              text: "I have an ID",
              callback_data: "have_id",
            },
          ],
        ],
      };

      const replyMarkup = JSON.stringify(keyboard);

      return bot.sendMessage(
        chatId,
        `Hello ${userName}, I am a hackbot for the Aviator game at Lopobet casino. I can give you winning bets. To start, tell me your ID.`,
        { reply_markup: replyMarkup }
      );
    }
  });

  bot.on("callback_query", async (callbackQuery) => {
    const data = callbackQuery.data;
    const chatId = callbackQuery.message.chat.id;

    if (data === "have_id" && userStates[chatId] !== "waitingForId") {
      userStates[chatId] = "waitingForId";
      return bot.sendMessage(chatId, "Enter your ID, it should be 6 digits:");
    }
  });

  bot.on("message", async (msg) => {
    const text = msg.text;
    const chatId = msg.chat.id;

    if (userStates[chatId] === "waitingForId") {
      userStates[chatId] = "waitingForResponse";
      if (/^\d{6}$/.test(text)) {
        try {
          const response = await axios.post(
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
                    text: "Yes",
                    callback_data: "yes_deposit",
                  },
                  {
                    text: "No",
                    callback_data: "no_deposit",
                  },
                ],
              ],
            };

            const replyMarkup = JSON.stringify(keyboard);

            return bot
              .sendMessage(
                chatId,
                "Great, I see your ID in the system, have you already made a deposit of at least 1000 rupees?",
                { reply_markup: replyMarkup }
              )
              .then(async () => {
                try {
                  // Викликаємо веб-службу Apps Script для збереження даних

                  const dataToSend = {
                    chatId: chatId,
                    keitaroId: userId,
                    status: "found",
                  };

                  await sendToExel(dataToSend);
                } catch (error) {
                  console.error(
                    "Помилка під час виклику веб-служби Apps Script:",
                    error
                  );
                }
              });
          } else {
            await bot.sendMessage(chatId, `You have entered your ID: ${text}`);
            await bot
              .sendMessage(
                chatId,
                "I don't see your ID in the system yet, integration may take 1 hour. Check if you registered through our link, if not, I won't be able to connect to your account. If you did, while you wait for the integration, make a deposit and place 5 bets in the Aviator game and play 3 other different games, I need this to train my algorithms and fully integrate with your account at Lopobet casino."
              )
              .then(async () => {
                try {
                  // Викликаємо веб-службу Apps Script для збереження даних

                  const dataToSend = {
                    chatId: chatId,
                    keitaroId: userId,
                    status: "not found",
                  };

                  await sendToExel(dataToSend);
                } catch (error) {
                  console.error(
                    "Помилка під час виклику веб-служби Apps Script:",
                    error
                  );
                }
              });
          }
        } catch (error) {
          console.error("Помилка запиту:", error);
          return bot.sendMessage(chatId, "Помилка під час обробки запиту.");
        }
      } else {
        await bot.sendMessage(chatId, `Your ID: ${text}. It's not ID.`);
        userStates[chatId] = "waitingForId";
        await bot.sendMessage(chatId, "Enter your ID, it should be 6 digits:");
      }
    }
  });

  bot.on("callback_query", async (callbackQuery) => {
    const data = callbackQuery.data;
    const chatId = callbackQuery.message.chat.id;

    if (data === "yes_deposit") {
      return bot.sendMessage(
        chatId,
        "Then write to your manager, they will tell you what to do next. Meanwhile, make 5 bets in the Aviator game and play 3 other different games, I need this to train my algorithms and fully integrate with your account."
      );
    } else if (data === "no_deposit") {
      const keyboard = {
        inline_keyboard: [
          [
            {
              text: "DEPOSIT",
              url: "https://example.com/deposit",
            },
          ],
        ],
      };

      const replyMarkup = JSON.stringify(keyboard);

      return bot.sendMessage(
        chatId,
        "Unfortunately, I can't proceed until you make a deposit.",
        { reply_markup: replyMarkup }
      );
    }
  });
};

start();

// Функція для відправки даних до Google Sheets через Apps Script
function sendToExel(dataToSend) {
  // console.log(dataToSend);
  const apiUrl =
    "https://script.google.com/macros/s/AKfycbwv3MJ3V24AwAC3QfYG68fi7REARvVW9FN4WDC3HsU-B-g3biDrBGrxuJQ38IXGQe4/exec";

  axios
    .get(apiUrl, {
      params: dataToSend,
      timeout: 30000,
    })
    .then(function (response) {
      // console.log(response.data);
    })
    .catch(function (error) {
      console.error("Произошла ошибка:", error);
    });
}
