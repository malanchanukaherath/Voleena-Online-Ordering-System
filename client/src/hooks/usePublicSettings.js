import { useEffect, useState } from 'react';
import { getDefaultPublicSettings, getPublicSettings } from '../services/publicSettingsApi';

export const usePublicSettings = () => {
    const [settings, setSettings] = useState(getDefaultPublicSettings());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let isMounted = true;

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
