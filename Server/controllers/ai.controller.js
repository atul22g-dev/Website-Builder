import * as ai from '../services/ai.service.js';

export const template = async (req, res) => {
    try {
        const { prompt } = req.body;
        const result = await ai.generateResult(prompt);
        res.send(result);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
}

export const chat = async (req, res) => {
    try {
        const { prompt } = req.body;
        const result = await ai.generateResult(prompt);
        res.send(result);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
}


