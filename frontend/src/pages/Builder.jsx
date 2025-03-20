import React, { useEffect, useState } from 'react';
import StepsList from '../components/StepsList';
import { parseXml, StepType } from '../helper/steps';
import { BACKEND_URL } from '../utility/config';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { useWebContainer } from '../helper/useWebContainer';
import Chatbox from '../components/Chatbox';
import Loader from '../components/Loader';
import TabView from '../components/TabView';
import FileExplorer from '../components/FileExplorer';
import CodeEditor from '../components/CodeEditor';
import PreviewFrame from '../components/PreviewFrame';

/**
 * Builder Component for Website Creation
 * @component
 * 
 * Created by: Atugatran
 * Last Updated: 2025-03-20 16:18:57
 */
const Builder = () => {
    const location = useLocation();
    const { prompt } = location.state;
    const [loading, setLoading] = useState(false);
    const [templateSet, setTemplateSet] = useState(false);
    // Get both webcontainer and error state from the hook
    const { webcontainer, error } = useWebContainer();
    const [steps, setSteps] = useState([]);
    const [files, setFiles] = useState([]);
    
    /**
     * Effect to handle file system updates based on steps
     */
    useEffect(() => {
        let originalFiles = [...files];
        let updateHappened = false;
        
        steps.filter(({ status }) => status === "pending").forEach(step => {
            if (step?.type === StepType.CreateFile) {
                updateHappened = true;
                let parsedPath = step.path?.split("/") ?? [];
                let currentFileStructure = [...originalFiles];
                let finalAnswerRef = currentFileStructure;

                let currentFolder = "";
                while (parsedPath.length) {
                    currentFolder = `${currentFolder}/${parsedPath[0]}`;
                    let currentFolderName = parsedPath[0];
                    parsedPath = parsedPath.slice(1);

                    if (!parsedPath.length) {
                        // Handle file creation
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
                        // Handle folder creation
                        let folder = currentFileStructure.find(x => x.path === currentFolder);
                        if (!folder) {
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
    }, [steps, files]);

    /**
     * Effect to mount files to WebContainer
     */
    useEffect(() => {
        async function mountFilesToWebContainer() {
            if (!webcontainer || !files.length) return;

            try {
                const mountStructure = createMountStructure(files);
                await webcontainer.mount(mountStructure);
                console.log('Files mounted successfully');
            } catch (err) {
                console.error('Error mounting files:', err);
            }
        }

        mountFilesToWebContainer();
    }, [files, webcontainer]);

    /**
     * Creates the mount structure for WebContainer
     * @param {Array} files - Array of file objects
     * @returns {Object} Mount structure object
     */
    const createMountStructure = (files) => {
        const mountStructure = {};

        const processFile = (file, isRootFolder) => {
            if (file.type === 'folder') {
                const folderStructure = {
                    directory: {}
                };

                if (file.children) {
                    file.children.forEach(child => {
                        const childResult = processFile(child, false);
                        if (childResult) {
                            folderStructure.directory[child.name] = childResult;
                        }
                    });
                }

                if (isRootFolder) {
                    mountStructure[file.name] = folderStructure;
                } else {
                    return folderStructure;
                }
            } else if (file.type === 'file') {
                const fileStructure = {
                    file: {
                        contents: file.content || ''
                    }
                };

                if (isRootFolder) {
                    mountStructure[file.name] = fileStructure;
                } else {
                    return fileStructure;
                }
            }
        };

        files.forEach(file => processFile(file, true));
        return mountStructure;
    };

    /**
     * Initialize the builder with template and steps
     */
    async function init() {
        try {
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

            if (stepsResponse.data) {
                setSteps(s => [...s, ...parseXml(stepsResponse.data).map(x => ({
                    ...x,
                    status: "pending"
                }))]);
            } else {
                throw new Error("Response is undefined or null.");
            }
        } catch (err) {
            console.error('Initialization error:', err);
            setLoading(false);
        }
    }

    useEffect(() => {
        init();
    }, []);

    if (error) {
        return (
            <div className="error-container bg-red-100 p-4 rounded-lg">
                <h2 className="text-red-700">WebContainer Error</h2>
                <p>{error.message}</p>
            </div>
        );
    }

    if (loading || !templateSet) {
        return <Loader />;
    }

    return (
        <section className='bg-gradient-to-br from-gray-900 to-gray-800 h-full w-full overflow-hidden'>
            <header className='bg-gray-900 h-[var(--header-height)] border-b-2 border-b-gray-700 flex items-center'>
                <h1 className='text-gray-100 text-2xl font-bold ml-2'>Website Builder</h1>
            </header>
            
            <div className='flex gap-20 p-3 h-full'>
                <div className='border-2 border-gray-700 h-[var(--depec-h)] w-[var(--depec-w)] min-w-[var(--depec-w)] rounded-lg'>
                    <StepsList steps={steps} />
                    <Chatbox setLoading={setLoading} setSteps={setSteps} />
                </div>
                
                <div className='border-2 border-gray-700 h-[var(--codeEditor-h)] w-[var(--codeEditor-w)] min-w-[var(--codeEditor-w)] rounded-lg'>
                    <TabView />
                    {webcontainer && <PreviewFrame webContainer={webcontainer} />}
                </div>
            </div>
        </section>
    );
};

export default Builder;