import React, { useEffect, useState } from "react";

/**
 * PreviewFrame Component for rendering WebContainer preview
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.webContainer - WebContainer instance
 * 
 * Created by: Atugatran
 * Last Updated: 2025-03-20 16:20:43 UTC
 */
const PreviewFrame = ({ webContainer }) => {
    const [url, setUrl] = useState("");
    const [error, setError] = useState(null);
    const [status, setStatus] = useState("initializing"); // initializing, installing, starting, ready, error

    useEffect(() => {
        let isMounted = true;

        /**
         * Initialize and start the development server
         */
        async function startDevServer() {
            if (!webContainer) return;

            try {
                // Update status to installing
                setStatus("installing");

                // Install dependencies
                const installProcess = await webContainer.spawn("npm", ["install"]);

                // Handle installation output
                installProcess.output.pipeTo(
                    new WritableStream({
                        write(data) {
                            console.log("Install output:", data);
                        },
                        error(err) {
                            console.error("Install error:", err);
                            if (isMounted) {
                                setError("Failed to install dependencies: " + err.message);
                                setStatus("error");
                            }
                        }
                    })
                );

                // Wait for installation to complete
                const installExit = await installProcess.exit;
                
                if (installExit !== 0) {
                    throw new Error(`Install failed with exit code ${installExit}`);
                }

                // Update status to starting
                if (isMounted) {
                    setStatus("starting");
                }

                // Start development server
                const devProcess = await webContainer.spawn("npm", ["run", "dev"]);

                // Handle dev server output
                devProcess.output.pipeTo(
                    new WritableStream({
                        write(data) {
                            console.log("Dev server output:", data);
                        },
                        error(err) {
                            console.error("Dev server error:", err);
                            if (isMounted) {
                                setError("Development server failed: " + err.message);
                                setStatus("error");
                            }
                        }
                    })
                );

                // Listen for server ready event
                webContainer.on("server-ready", (port, serverUrl) => {
                    if (isMounted) {
                        console.log("Server ready on port:", port);
                        setUrl(serverUrl);
                        setStatus("ready");
                    }
                });

            } catch (err) {
                console.error("Server startup error:", err);
                if (isMounted) {
                    setError(err.message);
                    setStatus("error");
                }
            }
        }

        startDevServer();

        // Cleanup function
        return () => {
            isMounted = false;
        };
    }, [webContainer]);

    /**
     * Render loading message based on current status
     */
    const renderLoadingMessage = () => {
        const messages = {
            initializing: "Initializing WebContainer...",
            installing: "Installing dependencies...",
            starting: "Starting development server...",
            error: `Error: ${error}`,
        };

        return messages[status] || "Loading...";
    };

    /**
     * Render error message
     */
    const renderError = () => (
        <div className="text-red-500 p-4 text-center">
            <h3 className="font-bold mb-2">Error</h3>
            <p>{error}</p>
        </div>
    );

    return (
        <div className="h-full flex items-center justify-center text-gray-400">
            {status === "error" ? (
                renderError()
            ) : !url ? (
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-4"></div>
                    <p className="mb-2">{renderLoadingMessage()}</p>
                </div>
            ) : (
                <iframe 
                    title="Preview"
                    width="100%" 
                    height="100%" 
                    src={url}
                    className="border-none"
                    sandbox="allow-forms allow-modals allow-pointer-lock allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
                />
            )}
        </div>
    );
};

export default PreviewFrame;