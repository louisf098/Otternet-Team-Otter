import { contextBridge, ipcRenderer } from 'electron';

interface FileMetadata {
    file_name: string;
    file_size: number;
    file_path: string;
    file_hash: string;
    timestamp: string;
}

interface ElectronAPI {
    selectFile: () => Promise<{fileMetaData: FileMetadata | null}>;
    handleDragDrop: (file: File) => Promise<{ fileMetaData: FileMetadata | null}>;
}

contextBridge.exposeInMainWorld('electronAPI', {
    selectFile: async (): Promise<{ fileMetaData: FileMetadata | null }> => {
        return ipcRenderer.invoke('select-file');
    },
    handleDragDrop: async (file: File): Promise<{ fileMetaData: FileMetadata | null }> => {
        return ipcRenderer.invoke('handle-drag-drop', file);
    },
});

