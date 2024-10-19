/// <reference types="vite/client" />
interface FileMetadata {
    file_name: string;
    file_size: number;
    file_path: string;
    file_type: string;
    file_hash: string;
    timestamp: string;
}
  
  interface ElectronAPI {
    selectFile: () => Promise<{fileMetadata: FileMetadata | null}>;
    handleDragDrop: (file: File) => Promise<{ fileMetadata: FileMetadata  | null}>;
  }
  
  declare global {
    interface Window {
      electronAPI: ElectronAPI;
    }
  
    interface File {
      path: string;
    }
  }
  
  export {};
  