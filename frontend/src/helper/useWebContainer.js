import { useEffect, useState } from "react";
import { WebContainer } from '@webcontainer/api';

/**
 * Singleton WebContainer Manager
 * Created by: Atugatran
 * Last Updated: 2025-03-20 16:22:21 UTC
 */
class WebContainerManager {
    static instance = null;
    static isBooting = false;
    static subscribers = new Set();

    static async getInstance() {
        if (this.instance) {
            return this.instance;
        }

        if (this.isBooting) {
            return new Promise((resolve) => {
                const checkInstance = () => {
                    if (this.instance) {
                        resolve(this.instance);
                    } else {
                        setTimeout(checkInstance, 100);
                    }
                };
                checkInstance();
            });
        }

        try {
            this.isBooting = true;
            this.instance = await WebContainer.boot();
            return this.instance;
        } catch (error) {
            console.error('WebContainer boot error:', error);
            throw error;
        } finally {
            this.isBooting = false;
        }
    }

    static subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    static notifySubscribers(instance) {
        this.subscribers.forEach(callback => callback(instance));
    }

    static cleanup() {
        this.instance = null;
        this.isBooting = false;
        this.subscribers.clear();
    }
}

/**
 * Custom React hook to manage WebContainer instance
 * @returns {Object} Object containing WebContainer instance and error state
 */
export function useWebContainer() {
    const [webcontainer, setWebcontainer] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;

        async function initializeWebContainer() {
            try {
                const instance = await WebContainerManager.getInstance();
                if (mounted) {
                    setWebcontainer(instance);
                    setError(null);
                }
            } catch (err) {
                if (mounted) {
                    setError(err);
                    console.error('WebContainer initialization error:', err);
                }
            }
        }

        // Subscribe to WebContainer updates
        const unsubscribe = WebContainerManager.subscribe((instance) => {
            if (mounted) {
                setWebcontainer(instance);
            }
        });

        initializeWebContainer();

        // Cleanup function
        return () => {
            mounted = false;
            unsubscribe();
        };
    }, []);

    return { webcontainer, error };
}

// Export the manager for direct access if needed
export const webContainerManager = WebContainerManager;