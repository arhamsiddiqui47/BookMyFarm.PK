import { createContext, useContext, useEffect, useState } from 'react';

// Keeps up to 3 farmhouses picked for comparison, remembered across page reloads.
const CompareContext = createContext(null);
const KEY = 'compare';
export const MAX_COMPARE = 3;

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

export function CompareProvider({ children }) {
  const [picked, setPicked] = useState(load); // [{ _id, name, photo }]
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(picked)); } catch { /* storage unavailable */ }
  }, [picked]);

  const has = (id) => picked.some((p) => p._id === id);
  const toggle = (fh) =>
    setPicked((cur) => {
      if (cur.some((p) => p._id === fh._id)) return cur.filter((p) => p._id !== fh._id);
      if (cur.length >= MAX_COMPARE) return cur;
      return [...cur, { _id: fh._id, name: fh.name, photo: fh.photos?.[0] }];
    });
  const clear = () => setPicked([]);

  return <CompareContext.Provider value={{ picked, has, toggle, clear }}>{children}</CompareContext.Provider>;
}

export const useCompare = () => useContext(CompareContext);
