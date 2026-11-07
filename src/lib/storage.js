// Optional local saving. Nothing is stored unless the user ticks "Save on this device".
const KEY = 'rbx:data';
export const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch { return null; } };
export const save = (d) => { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { /* storage unavailable */ } };
export const clear = () => { try { localStorage.removeItem(KEY); } catch { /* ignore */ } };
