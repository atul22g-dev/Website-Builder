import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import StepsList from '../components/StepsList.jsx';
import FileExplorer from '../components/FileExplorer';
import TabView from '../components/TabView';
import CodeEditor from '../components/CodeEditor';
import PreviewFrame from '../components/PreviewFrame';
// import { Step, FileItem, StepType } from '../types';
import axios from 'axios';
import { BACKEND_URL } from '../utility/config';
import { parseXml, StepType } from '../helper/steps.js';
import { useWebContainer } from '../helper/useWebContainer.js';
// import { FileNode } from '@webcontainer/api';
import Loader from '../components/Loader';

const Builder = () => {
    const location = useLocation();
    const { prompt } = location.state;
    const [userPrompt, setPrompt] = useState("");
    const [llmMessages, setLlmMessages] = useState([{ role: "user", content: "" }]);
    const [loading, setLoading] = useState(false);
    const [templateSet, setTemplateSet] = useState(false);
    const webcontainer = useWebContainer();

    const [currentStep, setCurrentStep] = useState(1);
    const [activeTab, setActiveTab] = useState('code');
    const [selectedFile, setSelectedFile] = useState(null);

    const [steps, setSteps] = useState([]);
    const [files, setFiles] = useState([]);

    useEffect(() => {
        let originalFiles = [...files];
        let updateHappened = false;
        steps.filter(({ status }) => status === "pending").map(step => {
            updateHappened = true;
            if (step?.type === StepType.CreateFile) {
                let parsedPath = step.path?.split("/") ?? []; // ["src", "components", "App.tsx"]
                let currentFileStructure = [...originalFiles]; // {}
                let finalAnswerRef = currentFileStructure;

                let currentFolder = "";
                while (parsedPath.length) {
                    currentFolder = `${currentFolder}/${parsedPath[0]}`;
                    let currentFolderName = parsedPath[0];
                    parsedPath = parsedPath.slice(1);

                    if (!parsedPath.length) {
                        // final file
                        let file = currentFileStructure.find(x => x.path === currentFolder);
                        if (!file) {
                            currentFileStructure.push({
                                name: currentFolderName,
                                type: 'file',
                                path: currentFolder,
                                content: step.code
                            });
                        } else {
                            file.content = step.code;
                        }
                    } else {
                        // in a folder
                        let folder = currentFileStructure.find(x => x.path === currentFolder);
                        if (!folder) {
                            // create the folder
                            currentFileStructure.push({
                                name: currentFolderName,
                                type: 'folder',
                                path: currentFolder,
                                children: []
                            });
                        }

                        currentFileStructure = currentFileStructure.find(x => x.path === currentFolder).children;
                    }
                }
                originalFiles = finalAnswerRef;
            }
        });

        if (updateHappened) {
            setFiles(originalFiles);
            setSteps(steps => steps.map(s => ({
                ...s,
                status: "completed"
            })));
        }
        // console.log(files);
    }, [steps, files]);

    useEffect(() => {
        const createMountStructure = (files) => {
            const mountStructure = {};

            const processFile = (file, isRootFolder) => {
                if (file.type === 'folder') {
                    // For folders, create a directory entry
                    mountStructure[file.name] = {
                        directory: file.children ?
                            Object.fromEntries(
                                file.children.map(child => [child.name, processFile(child, false)])
                            )
                            : {}
                    };
                } else if (file.type === 'file') {
                    if (isRootFolder) {
                        mountStructure[file.name] = {
                            file: {
                                contents: file.content || ''
                            }
                        };
                    } else {
                        // For files, create a file entry with contents
                        return {
                            file: {
                                contents: file.content || ''
                            }
                        };
                    }
                }

                return mountStructure[file.name];
            };

            // Process each top-level file/folder
            files.forEach(file => processFile(file, true));

            return mountStructure;
        };

        const mountStructure = createMountStructure(files);

        // Mount the structure if WebContainer is available
        // console.log(mountStructure);
        webcontainer?.mount(mountStructure);
    }, [files, webcontainer]);

    async function init() {
        const response = await axios.post(`${BACKEND_URL}/ai/template`, {
            prompt: prompt.trim()
        });
        setTemplateSet(true);

        const { prompts, uiPrompts } = response.data;


        setSteps(parseXml(uiPrompts[0]).map(x => ({
            ...x,
            status: "pending"
        })));

        setLoading(true);
        const stepsResponse = await axios.post(`${BACKEND_URL}/ai/chat`, {
            prompt: prompt
        });


        setLoading(false);

        const responseContent = stepsResponse.data;
        if (responseContent) {
            setSteps(s => [...s, ...parseXml(responseContent).map(x => ({
                ...x,
                status: "pending"
            }))]);
        } else {
            console.error("Response is undefined or null.");
            // Handle the error as needed, perhaps notify the user or log the issue
        }

        setLlmMessages([...prompts, prompt].map(content => ({
            role: "user",
            content
        })));

        setLlmMessages(x => [...x, { role: "assistant", content: stepsResponse.data.response }]);
    }

    useEffect(() => {
        init();
    }, []);

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col">
            <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
                <h1 className="text-xl font-semibold text-gray-100">Website Builder</h1>
                <p className="text-sm text-gray-400 mt-1">Prompt: {prompt}</p>
            </header>

            <div className="flex-1 overflow-hidden">
                <div className="h-full grid grid-cols-4 gap-6 p-2">
                    <div className="col-span-1 h-full space-y-6 overflow-scroll scroll-hidden border-2 rounded-3xl border-gray-800">
                        <div>
                            <div className="max-h-[65vh] overflow-scroll scroll-hidden">
                                <StepsList
                                    steps={steps}
                                    currentStep={currentStep}
                                    onStepClick={setCurrentStep}
                                />
                            </div>
                            <div className='relative'>
                                <div className="flex">
                                    <br />
                                    {(loading || !templateSet) && <Loader />}
                                    {!(loading || !templateSet) &&
                                        (
                                            <div className="flex w-full">
                                                <div className="w-full max-w-md p-2">
                                                    <div className="h-[6rem] border border-gray-700 bg-transparent text-gray-300 rounded-lg p-3">
                                                        <textarea
                                                            value={userPrompt}
                                                            onChange={(e) => { setPrompt(e.target.value) }}
                                                            name="chat"
                                                            className="flex-grow resize-none scroll-hidden bg-transparent h-full outline-none text-gray-300 placeholder-gray-500 w-[80%]"
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
                                                            messages: [...llmMessages, newMessage]
                                                        });
                                                        setLoading(false);

                                                        setLlmMessages(x => [...x, newMessage]);
                                                        setLlmMessages(x => [...x, {
                                                            role: "assistant",
                                                            content: stepsResponse.data.response
                                                        }]);

                                                        setSteps(s => [...s, ...parseXml(stepsResponse.data.response).map(x => ({
                                                            ...x,
                                                            status: "pending"
                                                        }))]);
                                                    }}
                                                    className="absolute right-4 top-6 cursor-pointer"
                                                >
                                                    <i className="fa-solid fa-paper-plane-top text-white"></i>
                                                </button>
                                            </div>
                                        )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-span-1">
                        <FileExplorer
                            files={files}
                            onFileSelect={setSelectedFile}
                        />
                    </div>
                    <div className="col-span-2 bg-gray-900 rounded-lg shadow-lg p-4 h-[calc(100vh-8rem)]">
                        <TabView activeTab={activeTab} onTabChange={setActiveTab} />
                        <div className="h-[calc(100%-4rem)]">
                            {activeTab === 'code' ? (
                                <CodeEditor file={selectedFile} />

                            ) : (
                                <PreviewFrame webContainer={webcontainer} files={files} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


export default Builder