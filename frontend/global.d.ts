interface FileMetadata {
    file_name: string;
    file_size: number;
    file_path: string;
    file_hash: string;
    timestamp: string;
}
  
  interface ElectronAPI {
    selectFile: () => Promise<{fileMetadata: FileMetadata} | null>;
    handleDragDrop: (filePath: string) => Promise<{ fileMetadata: FileMetadata } | null>;
  }
  
  interface FileWithPath extends File {
    path: string;
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
  