const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const authService = require("./Services/AuthService");
const bloggerService = require("./Services/BloggerService");
const geminiService = require("./Services/GeminiService");
const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();
const fs = require("fs");
const path = require("path");

// EXPRESS APP (auth routes)

const app = express();
app.use(cors());
app.use(bodyParser.json());



// OAuth Auth Routes
app.get("/auth", (req, res) => {
  const url = authService.getAuthUrl();
  res.redirect(url);
});

app.get("/oauth2callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("No authorization code provided.");

  try {
    const { tokens } = await authService.oauth2Client.getToken(code);
    await authService.setTokens(tokens);
    const successHtml = fs.readFileSync(path.join(__dirname, "views", "succ.html"), "utf8");
    res.send(successHtml);
  } catch (error) {
    console.error("OAuth error:", error.message);
    const errorHtml = fs.readFileSync(path.join(__dirname, "views", "error.html"), "utf8");
    res.status(500).send(successHtml);
  }
});

app.get("/", (req, res) => {
  const indexPath = path.join(__dirname, "views", "index.html");
  const html = fs.readFileSync(indexPath, "utf-8");
  res.send(html);
});

// TELEGRAM BOT LOGIC

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const sessions = {};

if (!TELEGRAM_BOT_TOKEN) {
  console.warn("⚠️ TELEGRAM_BOT_TOKEN not set. Telegram bot won't start.");
} else {
  const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

  // Start command
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    sessions[chatId] = null;
    bot.sendMessage(chatId, "👋 Hello! I'm your AI blogging assistant.\n\nJust send me a topic and I'll help you create and publish a blog post.");
  });

  // Cancel command
  bot.onText(/\/cancel/, (msg) => {
    const chatId = msg.chat.id;
    sessions[chatId] = null;
    bot.sendMessage(chatId, "🚫 Process canceled. You can now send a new topic.");
  });

  // Handle regular messages (topics or edits)
  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text?.trim();

    // Ignore non-text or commands
    if (!text || text.startsWith("/")) return;

    const session = sessions[chatId];

    // If no session yet, it's a new topic
    if (!session) {
      sessions[chatId] = { topic: text, step: "article" };
      bot.sendMessage(chatId, `📝 Generating article for: "${text}"`);

      try {
        const { title, content, tags } = await geminiService.generateBlogPost(text);
        sessions[chatId].title = title;
        sessions[chatId].content = content;
        sessions[chatId].tags = tags;

        const cleanContent = htmlToTelegramMarkdown(content);

        const message = `📄 Here's your generated article:\n\n<b>Title:</b> ${title}\n\n${cleanContent}`;
        const options = {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [{ text: "✅ Confirm & Publish", callback_data: "confirm_article" }],
              [{ text: "🔁 Regenerate Article", callback_data: "regenerate_article" }],
              [{ text: "🖋️ Edit Topic/Content", callback_data: "edit_content" }]
            ],
          },
        };

        await bot.sendMessage(chatId, message, options);
      } catch (err) {
        console.error("Error generating article:", err.message);
        bot.sendMessage(chatId, "⚠️ Failed to generate article. Please try again.");
        delete sessions[chatId];
      }

      return;
    }

    // If editing content manually
    if (session.step === "edit") {
      bot.sendMessage(chatId, "🔄 Regenerating article with your new input...");

      session.topic = text;
      session.step = "article";

      try {
        const { title, content, tags } = await geminiService.generateBlogPost(session.topic);
        session.title = title;
        session.content = content;
        session.tags = tags;

        const cleanContent = htmlToTelegramMarkdown(content);

        const message = `📄 Here's your regenerated article:\n\n<b>Title:</b> ${title}\n\n${cleanContent}`;
        const options = {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [{ text: "✅ Confirm & Publish", callback_data: "confirm_article" }],
              [{ text: "🔁 Regenerate Article", callback_data: "regenerate_article" }],
              [{ text: "🖋️ Edit Topic/Content", callback_data: "edit_content" }]
            ],
          },
        };

        await bot.sendMessage(chatId, message, options);
      } catch (err) {
        bot.sendMessage(chatId, "⚠️ Failed to regenerate article.");
      }
    }
  });

  // Handle button clicks
  bot.on("callback_query", async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;
    const session = sessions[chatId];

    if (!session) return;

    await bot.answerCallbackQuery(query.id);

    // ===== CONFIRM ARTICLE =====
    if (data === "confirm_article") {
      bot.sendMessage(chatId, "🖼️ Generating cover image...");
      try {
        const imgDataUrl = await geminiService.generateImage(session.topic);
        const fullContent = `<img src="${imgDataUrl}" alt="Cover image" style="max-width:100%; border-radius:10px;" /><br><br>${session.content}`;

        bot.sendMessage(chatId, "🚀 Publishing to Blogger...");

        await bloggerService.postToBlogger(session.title, fullContent, session.tags);
        bot.sendMessage(chatId, "✅ Published successfully!");

        delete sessions[chatId]; // Clear session
      } catch (err) {
        bot.sendMessage(chatId, "❌ Failed to generate image or publish post.");
      }
    }

    // ===== REGENERATE ARTICLE =====
    if (data === "regenerate_article") {
      bot.sendMessage(chatId, "🔄 Regenerating article...");
      try {
        const { title, content, tags } = await geminiService.generateBlogPost(session.topic);
        session.title = title;
        session.content = content;
        session.tags = tags;

        const cleanContent = htmlToTelegramMarkdown(content);

        const message = `📄 Here's your regenerated article:\n\n<b>Title:</b> ${title}\n\n${cleanContent}`;
        const options = {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [{ text: "✅ Confirm & Publish", callback_data: "confirm_article" }],
              [{ text: "🔁 Regenerate Article", callback_data: "regenerate_article" }],
              [{ text: "🖋️ Edit Topic/Content", callback_data: "edit_content" }]
            ],
          },
        };

        await bot.editMessageText(message, {
          chat_id: chatId,
          message_id: query.message.message_id,
          ...options,
        });
      } catch (err) {
        bot.sendMessage(chatId, "⚠️ Failed to regenerate article.");
      }
    }

    // ===== EDIT CONTENT =====
    if (data === "edit_content") {
      session.editing = true;
      session.step = "edit";
      bot.sendMessage(chatId, "🖋️ Send the updated topic or article content.");
    }
  });
}

// Helper function to format HTML for Telegram
function htmlToTelegramMarkdown(html) {
  return html
    .replace(/<h[1-6]>/g, '*')
    .replace(/<\/h[1-6]>/g, '*\n')
    .replace(/<ul>/g, '')
    .replace(/<\/ul>/g, '')
    .replace(/<li>/g, '\n• ')
    .replace(/<\/li>/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<b>/g, '*').replace(/<\/b>/g, '*')
    .replace(/<i>/g, '_').replace(/<\/i>/g, '_')
    .replace(/<em>/g, '_').replace(/<\/em>/g, '_')
    .replace(/<strong>/g, '*').replace(/<\/strong>/g, '*')
    .replace(/<a href="([^"]+)">([^<]+)<\/a>/g, '[$2]($1)')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}



// START SERVER

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});