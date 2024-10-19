const { contextBridge, ipcRenderer } = require('electron');

interface FileMetadata {
    file_name: string;
    file_size: number;
    file_path: string;
    file_hash: string;
    timestamp: string;
}

contextBridge.exposeInMainWorld('electronAPI', {
    selectFile: async (): Promise<{fileMetaData: FileMetadata} | null> => {
        return ipcRenderer.invoke('select-file');
    },
    handleDragDrop: async (filePath: string): Promise<{fileMetaData: FileMetadata} | null> => {
        return ipcRenderer.invoke('handle-drag-drop', filePath);
    },
});
