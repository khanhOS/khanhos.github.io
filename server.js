require("dotenv").config();

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const app = express();

app.use(
  express.json({
    limit: "1mb"
  })
);

app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"]
  })
);


/* =========================================================
   RATE LIMIT
========================================================= */

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,

  max: 30,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    error:
      "Bạn gửi quá nhiều yêu cầu. Hãy thử lại sau."
  }
});


/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/", (req, res) => {
  res.json({
    name: "KhanhOS AI",
    status: "online"
  });
});


/* =========================================================
   CHAT API
========================================================= */

app.post(
  "/api/chat",
  aiLimiter,
  async (req, res) => {
    try {
      const {
        provider,
        model,
        messages
      } = req.body;


      if (
        !Array.isArray(messages) ||
        messages.length === 0
      ) {
        return res.status(400).json({
          error:
            "Messages không hợp lệ."
        });
      }


      if (messages.length > 50) {
        return res.status(400).json({
          error:
            "Cuộc trò chuyện quá dài."
        });
      }


      if (
        provider !== "openai" &&
        provider !== "claude"
      ) {
        return res.status(400).json({
          error:
            "Provider không hợp lệ."
        });
      }


      if (provider === "openai") {
        return await callOpenAI(
          model,
          messages,
          res
        );
      }


      return await callClaude(
        model,
        messages,
        res
      );

    } catch (error) {

      console.error(
        "KhanhOS server error:",
        error
      );

      return res.status(500).json({
        error:
          "KhanhOS AI gặp lỗi khi xử lý yêu cầu."
      });
    }
  }
);


/* =========================================================
   OPENAI
========================================================= */

async function callOpenAI(
  model,
  messages,
  res
) {

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      error:
        "Chưa cấu hình OPENAI_API_KEY trên Vercel."
    });
  }


  const allowedModels = [
    "gpt-5",
    "gpt-5-mini"
  ];


  const selectedModel =
    allowedModels.includes(model)
      ? model
      : "gpt-5-mini";


  const response =
    await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${process.env.OPENAI_API_KEY}`
        },

        body: JSON.stringify({
          model: selectedModel,

          input:
            messages.map(message => ({
              role:
                message.role === "assistant"
                  ? "assistant"
                  : "user",

              content:
                String(message.content || "")
            }))
        })
      }
    );


  const data =
    await response.json();


  if (!response.ok) {

    console.error(
      "OpenAI:",
      data
    );

    return res.status(
      response.status
    ).json({
      error:
        data?.error?.message ||
        "OpenAI API lỗi."
    });
  }


  const text =
    data.output_text ||
    data.output
      ?.flatMap(
        item =>
          item.content || []
      )
      ?.map(
        item =>
          item.text || ""
      )
      ?.join("") ||
    "";


  return res.json({
    provider: "openai",
    model: selectedModel,
    reply: text
  });
}


/* =========================================================
   CLAUDE
========================================================= */

async function callClaude(
  model,
  messages,
  res
) {

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({
      error:
        "Chưa cấu hình ANTHROPIC_API_KEY trên Vercel."
    });
  }


  const allowedModels = [
    "claude-sonnet-4-5",
    "claude-haiku-4-5"
  ];


  const selectedModel =
    allowedModels.includes(model)
      ? model
      : "claude-sonnet-4-5";


  const response =
    await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          "x-api-key":
            process.env.ANTHROPIC_API_KEY,

          "anthropic-version":
            "2023-06-01"
        },

        body: JSON.stringify({
          model: selectedModel,

          max_tokens: 4096,

          messages:
            messages.map(message => ({
              role:
                message.role === "assistant"
                  ? "assistant"
                  : "user",

              content:
                String(message.content || "")
            }))
        })
      }
    );


  const data =
    await response.json();


  if (!response.ok) {

    console.error(
      "Claude:",
      data
    );

    return res.status(
      response.status
    ).json({
      error:
        data?.error?.message ||
        "Claude API lỗi."
    });
  }


  const text =
    data.content
      ?.filter(
        item =>
          item.type === "text"
      )
      ?.map(
        item =>
          item.text
      )
      ?.join("") ||
    "";


  return res.json({
    provider: "claude",
    model: selectedModel,
    reply: text
  });
}


module.exports = app;
