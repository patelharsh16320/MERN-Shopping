import React, { createContext, useContext, useState, useEffect } from 'react';
import { pageSettingAPI } from '../utils/api';
import { initPublicSocket } from '../utils/socket';

const PageSettingContext = createContext({ settings: {}, loaded: false });

export function PageSettingProvider({ children }) {
  const [settings, setSettings] = useState({});  // { key: isActive }
  const [loaded, setLoaded]     = useState(false);

  useEffect(() => {
    pageSettingAPI.getAll()
      .then(({ data }) => {
        const map = {};
        data.forEach(s => { map[s.key] = s.isActive; });
        setSettings(map);
        setLoaded(true);
      })
      .catch(() => setLoaded(true)); // on error, treat everything as active

    // Live updates when admin toggles a page
    const socket = initPublicSocket();
    const onUpdate = ({ key, isActive }) => {
      setSettings(prev => ({ ...prev, [key]: isActive }));
    };
    socket.on('page_settings_updated', onUpdate);
    return () => socket.off('page_settings_updated', onUpdate);
  }, []);

  return (
    <PageSettingContext.Provider value={{ settings, loaded }}>
      {children}
    </PageSettingContext.Provider>
  );
}

export function usePageSettings() {
  return useContext(PageSettingContext);
}
