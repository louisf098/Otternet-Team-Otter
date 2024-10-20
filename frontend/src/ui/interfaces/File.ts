export interface FileMetadata {
    file_name: string;
    file_size: number;
    file_path: string;
    file_type: string;
    file_hash: string;
    timestamp: string;
}

export interface FormData {
    userID: string,
    price: number,
    fileName: string,
    filePath: string,
    fileSize: number,
    fileType: string,
    timestamp: string,
    fileHash: string,
    bundleMode: boolean
  }