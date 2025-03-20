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
import {  AnimatePresence, motion } from 'framer-motion';

/**
 * Builder Component for Website Creation
 * This component serves as the main interface for the website builder application.
 * It manages file system operations, WebContainer integration, and UI state.
 * 
 * @component
 * @author Atugatran
 * @lastUpdated 2025-03-20 16:18:57
 */
const Builder = () => {
    // Router location hook to access navigation state
    const location = useLocation();
    const { prompt } = location.state;

    // State management for various component features
    const [loading, setLoading] = useState(false);
    const [templateSet, setTemplateSet] = useState(false);
    
    // WebContainer hook for managing the web development environment
    const { webcontainer, error } = useWebContainer();
    
    // State for managing build steps, file system, and UI
    const [steps, setSteps] = useState([]);
    const [files, setFiles] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [activeButton, setActiveButton] = useState('code');

    /**
     * Effect hook to handle file system updates based on build steps
     * Updates the file system when new steps are added or modified
     */
    useEffect(() => {
        let originalFiles = [...files];
        let updateHappened = false;

        // Process pending steps that create files
        steps.filter(({ status }) => status === "pending").forEach(step => {
            if (step?.type === StepType.CreateFile) {
                updateHappened = true;
                let parsedPath = step.path?.split("/") ?? [];
                let currentFileStructure = [...originalFiles];
                let finalAnswerRef = currentFileStructure;

                // Process each part of the file path
                let currentFolder = "";
                while (parsedPath.length) {
                    currentFolder = `${currentFolder}/${parsedPath[0]}`;
                    let currentFolderName = parsedPath[0];
                    parsedPath = parsedPath.slice(1);

                    if (!parsedPath.length) {
                        // Create or update file at the path
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
                        // Create folder structure if it doesn't exist
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

        // Update state if changes occurred
        if (updateHappened) {
            setFiles(originalFiles);
            setSteps(steps => steps.map(s => ({
                ...s,
                status: "completed"
            })));
        }
    }, [steps, files]);

    /**
     * Effect hook to mount files to WebContainer
     * Initializes the development environment with the current file system
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
     * Creates the file system structure for WebContainer mounting
     * @param {Array} files - Array of file and folder objects
     * @returns {Object} Mount structure compatible with WebContainer
     */
    const createMountStructure = (files) => {
        const mountStructure = {};

        // Recursive function to process files and folders
        const processFile = (file, isRootFolder) => {
            if (file.type === 'folder') {
                // Handle folder creation
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
                // Handle file creation
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
     * Initializes the builder with template and steps
     * Makes API calls to get initial template and build steps
     */
    async function init() {
        try {
            // Get initial template
            const response = await axios.post(`${BACKEND_URL}/ai/template`, {
                prompt: prompt.trim()
            });
            setTemplateSet(true);

            // Parse and set initial steps
            const { uiPrompts } = response.data;
            setSteps(parseXml(uiPrompts[0]).map(x => ({
                ...x,
                status: "pending"
            })));

            // Get additional build steps
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

    // Initialize component on mount
    useEffect(() => {
        init();
    }, []);

    // Error handling for WebContainer
    if (error) {
        return (
            <div className="error-container bg-red-100 p-4 rounded-lg">
                <h2 className="text-red-700">WebContainer Error</h2>
                <p>{error.message}</p>
            </div>
        );
    }

    // Loading state
    if (loading || !templateSet) {
        return <Loader />;
    }

    // Main component render
    return (
        <section className='bg-gradient-to-br from-gray-900 to-gray-800 h-full w-full overflow-hidden'>
            {/* Header Section */}
            <header className='bg-gray-900 h-[var(--header-height)] border-b-2 border-b-gray-700 flex items-center'>
                <h1 className='text-gray-100 text-2xl font-bold ml-2'>Website Builder</h1>
            </header>
            
            {/* Main Content Section */}
            <div className='flex gap-20 p-3 h-full'>
                {/* Steps List and Chat Section */}
                <div className='border-2 border-gray-700 h-[var(--depec-h)] w-[var(--depec-w)] min-w-[var(--depec-w)] rounded-lg'>
                    <StepsList steps={steps} />
                    <Chatbox setLoading={setLoading} setSteps={setSteps} />
                </div>
                
                {/* Code Editor and Preview Section */}
                <div className='border-2 border-gray-700 h-[var(--codeEditor-h)] w-[var(--codeEditor-w)] min-w-[var(--codeEditor-w)] rounded-lg'>
                    <TabView activeButton={activeButton} setActiveButton={setActiveButton} />
                    
                    {/* Animated Content Container */}
                    <div className="flex w-full h-[34.9rem] overflow-hidden">
                        <AnimatePresence mode="wait">
                            {activeButton === 'code' ? (
                                // Code Editor View with Animation
                                <motion.div
                                    key="explorer"
                                    className="flex w-full"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                >
                                    <FileExplorer
                                        files={files}
                                        onFileSelect={setSelectedFile}
                                    />
                                    <CodeEditor file={selectedFile} />
                                </motion.div>
                            ) : (
                                // Preview View with Animation
                                <motion.div
                                    key="preview"
                                    className="w-full"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                >
                                    <PreviewFrame webContainer={webcontainer} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Builder;