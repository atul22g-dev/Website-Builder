import { GoogleGenerativeAI } from "@google/generative-ai"
import { BASE_PROMPT, getSystemPrompt } from "./helper/promt.js";
import { reactBasePrompt } from "./helper/reactPromt.js";


const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY);

const template = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    // generationConfig: {
    //     responseMimeType: "application/json",
    //     temperature: 0,
    // },
    systemInstruction: 
    `Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra

    if project in reactJs and frontend than ${BASE_PROMPT},
    Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project. if projeject \n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n and uiPrompts is ${reactBasePrompt} `,
})


const chat = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    // generationConfig: {
    //     responseMimeType: "application/json",
    //     temperature: 0,
    // },
    systemInstruction: getSystemPrompt,
})

export const generateTemplate = async (prompt) => {
    const result = await template.generateContent(prompt);
    return result.response.text()
}

export const generateChat = async (prompt) => {
    const result = await chat.generateContent(prompt);
    return result.response.text()
}

