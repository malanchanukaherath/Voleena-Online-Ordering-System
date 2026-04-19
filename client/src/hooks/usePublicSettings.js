import { useEffect, useState } from 'react';
import { getDefaultPublicSettings, getPublicSettings } from '../services/publicSettingsApi';

// Code Review: Function usePublicSettings in client\src\hooks\usePublicSettings.js. Used in: client/src/components/layout/Footer.jsx, client/src/components/layout/Header.jsx, client/src/hooks/usePublicSettings.js.
export const usePublicSettings = () => {
    const [settings, setSettings] = useState(getDefaultPublicSettings());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let isMounted = true;

        // Code Review: Function loadSettings in client\src\hooks\usePublicSettings.js. Used in: client/src/hooks/usePublicSettings.js, client/src/pages/Settings.jsx.
        const loadSettings = async (forceRefresh = false) => {
            try {
                setLoading(true);
                const data = await getPublicSettings({ forceRefresh });
                if (isMounted) {
                    setSettings(data);
                    setError('');
                }
            } catch (err) {
                if (isMounted) {
                    setError(err.message || 'Failed to load public settings');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadSettings();

        // Code Review: Function handleRefresh in client\src\hooks\usePublicSettings.js. Used in: client/src/hooks/usePublicSettings.js.
        const handleRefresh = () => {
            loadSettings(true);
        };

        window.addEventListener('publicSettingsUpdated', handleRefresh);

        return () => {
            isMounted = false;
            window.removeEventListener('publicSettingsUpdated', handleRefresh);
        };
    }, []);

    return {
        settings,
        loading,
        error
    };
};

export default usePublicSettings;
