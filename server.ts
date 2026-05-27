import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase JSON payload limit to accept base64 image data
app.use(express.json({ limit: "25mb" }));

// Initialize Gemini AI with recommended user-agent for telemetry
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    }
  }
});

// API Route for Damage Analysis
app.post("/api/analyze-damage", async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "Nenhuma imagem recebida." });
    }

    // Parse base64 data or fetch remote URL correctly
    let base64Data: string;
    let mimeType = "image/jpeg";

    if (imageBase64.startsWith("http://") || imageBase64.startsWith("https://")) {
      const fetchResponse = await fetch(imageBase64);
      if (!fetchResponse.ok) {
        throw new Error(`Falha ao carregar a imagem de exemplo: ${fetchResponse.statusText}`);
      }
      const arrayBuffer = await fetchResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      base64Data = buffer.toString("base64");
      const contentType = fetchResponse.headers.get("content-type");
      if (contentType) {
        mimeType = contentType;
      }
    } else {
      base64Data = imageBase64.includes(",") 
        ? imageBase64.split(",")[1] 
        : imageBase64;
      
      const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z+.-]+);base64,/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
      }
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash", // Use the robust recommended gemini-3.5-flash model
      contents: [
        {
          parts: [
            {
              text: `Analise esta imagem de um veículo e identifique danos visuais (arranhões, amassados, quebras). 
              Retorne um JSON seguindo este esquema:
              {
                "vehicleModel": "Modelo provável do carro",
                "damages": [
                  {
                    "type": "Tipo do dano (ex: Arranhão Profundo)",
                    "severity": "Baixa" | "Média" | "Alta",
                    "estimatedCost": "Valor em R$ (ex: R$ 500 - R$ 800)",
                    "explanation": "Breve explicação técnica do dano",
                    "location": "Onde no carro o dano está (ex: Porta dianteira direita)"
                  }
                ],
                "totalEstimatedCost": "Soma total estimada em R$",
                "overallSeverity": "Baixa" | "Média" | "Alta",
                "recommendation": "Recomendação geral de reparo"
              }
              Considere valores médios do mercado brasileiro de funilaria e pintura em 2026.`,
            },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Resposta da IA vazia.");
    }

    const parsedResult = JSON.parse(text);
    res.json(parsedResult);
  } catch (err: any) {
    console.error("Erro na análise da imagem:", err);
    res.status(500).json({ 
      error: "Ocorreu um erro ao processar a análise do veículo. Detalhes: " + (err.message || err) 
    });
  }
});

async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

start();
