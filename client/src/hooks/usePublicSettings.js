import { useEffect, useState } from 'react';
import { getDefaultPublicSettings, getPublicSettings } from '../services/publicSettingsApi';

// Simple: This helps manage the public settings.
export const usePublicSettings = () => {
    const [settings, setSettings] = useState(getDefaultPublicSettings());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let isMounted = true;

        // Simple: This gets the settings.
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

        // Simple: This handles what happens when refresh is triggered.
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
