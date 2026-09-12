const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  db: {
    query: (sql, params) => ipcRenderer.invoke('db:query', sql, params),
    run: (sql, params) => ipcRenderer.invoke('db:run', sql, params),
    transaction: (queries) => ipcRenderer.invoke('db:transaction', queries),
  },
  app: {
    getPath: (name) => ipcRenderer.invoke('app:getPath', name),
  }
});
