import { useEffect, useState } from "react";
import { WebContainer } from '@webcontainer/api';

export function useWebContainer() {
    const [webcontainer, setWebcontainer] = useState();

    useEffect(() => {
        // Only boot the WebContainer if it's not already initialized
        if (!webcontainer) {
            const main = async () => {
                const webcontainerInstance = await WebContainer.boot();
                setWebcontainer(webcontainerInstance);
            };
            main();
        }
    }, [webcontainer]); // Only re-run if webcontainer is not set

    return webcontainer;
}
