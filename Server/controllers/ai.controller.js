import * as ai from '../services/ai.service.js';
import { BASE_PROMPT, nodeBasePrompt } from "../services/helper/promt.js";
import { reactBasePrompt } from "../services/helper/reactPromt.js";

export const template = async (req, res) => {
    try {
        const { prompt } = req.body;
        const answer = (await ai.generateTemplate(prompt)).trim().toLowerCase();

        // React
        if (answer === "react") {
            res.json({
                prompts: [BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
                uiPrompts: [reactBasePrompt]
            });
            return;
        }

        // Node
        if (answer === "node") {
            res.json({
                prompts: [`Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
                uiPrompts: [nodeBasePrompt]
            });
            return;
        }

        // Default case if neither "react" nor "node" matches
        res.status(400).json({ message: "Invalid response from ai.generateTemplate" });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
}


export const chat = async (req, res) => {
    try {
        const prompt = req.body.prompt;
        const result = await ai.generateChat(prompt);
        res.send(result);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
}