import React, { useState } from 'react'
import { parseXml } from '../helper/steps';
import axios from 'axios';
import { BACKEND_URL } from '../utility/config';
import { SendHorizontal } from 'lucide-react';

const Chatbox = ({setLoading, setSteps}) => {
    const [userPrompt, setPrompt] = useState("");
    return (
        <div className="flex w-full relative mt-4 bg-gray-900">
            <div className="w-full">
                <div className="h-[8rem] w-[var(--depec-w)] border border-gray-700 bg-transparent text-gray-300 rounded-lg p-3">
                    <textarea
                        value={userPrompt}
                        onChange={(e) => { setPrompt(e.target.value) }}
                        name="chat"
                        className="flex-grow resize-none scroll-hidden bg-transparent w-[82%] h-full outline-none text-gray-300 placeholder-gray-500"
                        placeholder="How can Bolt help you today?">
                    </textarea>
                </div>
            </div>
            <button
                onClick={async () => {
                    const newMessage = {
                        role: "user",
                        content: userPrompt
                    };

                    setLoading(true);
                    const stepsResponse = await axios.post(`${BACKEND_URL}/ai/chat`, {
                        messages: newMessage
                    });
                    setLoading(false);

                    setSteps(s => [...s, ...parseXml(stepsResponse.data.response).map(x => ({
                        ...x,
                        status: "pending"
                    }))]);
                }}
                className="absolute right-4 top-6 cursor-pointer bg-red"
            >
                <SendHorizontal className='text-white'/>
            </button>
        </div>
    )
}

export default Chatbox