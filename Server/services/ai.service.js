import { GoogleGenerativeAI } from "@google/generative-ai"
import { getSystemPrompt } from "./helper/promt.js";


const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY);

// Template AI

const template = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: 
    `Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra`
})


export const generateTemplate = async (prompt) => {
    const result = await template.generateContent(prompt);
    return result.response.text()
}

// Chat AI

const chat = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: getSystemPrompt,
})

export const generateChat = async (prompt) => {
    const result = await chat.generateContent(prompt);
    return result.response.text()
}

