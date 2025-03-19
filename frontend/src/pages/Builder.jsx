import React, { useEffect, useState } from 'react'
import StepsList from '../components/StepsList'
import { parseXml, StepType } from '../helper/steps';
import { BACKEND_URL } from '../utility/config';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { useWebContainer } from '../helper/useWebContainer';
import Chatbox from '../components/Chatbox';
import Loader from '../components/Loader';
import TabView from '../components/TabView';

const Builder = () => {
    const location = useLocation();
    const { prompt } = location.state;
    // const [llmMessages, setLlmMessages] = useState([{ role: "user", content: "" }]);
    const [loading, setLoading] = useState(false);
    const [templateSet, setTemplateSet] = useState(false);
    const webcontainer = useWebContainer();

    // const [activeTab, setActiveTab] = useState('code');
    // const [selectedFile, setSelectedFile] = useState(null);

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

            files.forEach(file => processFile(file, true));

            return mountStructure;
        };

        const mountStructure = createMountStructure(files);

        webcontainer?.mount(mountStructure);
    }, [files, webcontainer]);

    async function init() {
        const response = await axios.post(`${BACKEND_URL}/ai/template`, {
            prompt: prompt.trim()
        });
        setTemplateSet(true);

        const { uiPrompts } = response.data;

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
        }
    }

    useEffect(() => {
        init();
    }, []);

    if (loading || !templateSet) {
        return (
            <Loader />
        )
    }
    return (


        <section className='bg-gradient-to-br from-gray-900 to-gray-800 h-full w-full overflow-hidden'>
            {/* Header */}
            <header className='bg-gray-900 h-[var(--header-height)] border-b-2 border-b-gray-700 flex items-center '>
                <h1 className='text-gray-100 text-2xl font-bold ml-2'>Webite Builder</h1>
            </header>
            {/* Body */}
            <div className='flex gap-20 p-3 h-full'>
                {/* StepsList  Container */}
                <div className='border-2 border-gray-700 h-[var(--depec-h)] w-[var(--depec-w)] min-w-[var(--depec-w)]  rounded-lg'>
                    <StepsList steps={steps} />
                    {/* Chat Box */}
                    <Chatbox setLoading={setLoading} setSteps={setSteps} />
                </div>
                {/* Code Editor */}
                <div className='border-2 border-gray-700 h-[var(--codeEditor-h)] w-[var(--codeEditor-w)] min-w-[var(--codeEditor-w)] rounded-lg'>
                    {/*  */}
                <TabView />
                </div>
            </div>
        </section>
    )
}

export default Builder