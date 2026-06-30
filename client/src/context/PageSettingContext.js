import React, { createContext, useContext, useState, useEffect } from 'react';
import { pageSettingAPI } from '../utils/api';
import { initPublicSocket } from '../utils/socket';

const PageSettingContext = createContext({ settings: {}, meta: {}, loaded: false });

export function PageSettingProvider({ children }) {
  const [pages, setPages]   = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    pageSettingAPI.getAll()
      .then(({ data }) => { setPages(data); setLoaded(true); })
      .catch(() => setLoaded(true));

    const socket = initPublicSocket();
    const onUpdate = (updated) => {
      setPages(prev => prev.map(p => p.key === updated.key ? { ...p, ...updated } : p));
    };
    socket.on('page_settings_updated', onUpdate);
    return () => socket.off('page_settings_updated', onUpdate);
  }, []);

  // { key: isActive } — backward-compatible shape used by GuardedPage
  const settings = Object.fromEntries(pages.map(p => [p.key, p.isActive]));

  // { key: { metaTitle, metaDescription } }
  const meta = Object.fromEntries(pages.map(p => [p.key, { metaTitle: p.metaTitle || '', metaDescription: p.metaDescription || '' }]));

  return (
    <PageSettingContext.Provider value={{ settings, meta, pages, loaded }}>
      {children}
    </PageSettingContext.Provider>
  );
}

export function usePageSettings() {
  return useContext(PageSettingContext);
}
