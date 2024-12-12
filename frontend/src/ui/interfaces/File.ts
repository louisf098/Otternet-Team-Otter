export interface FileMetadata {
  file_name: string;
  file_size: number;
  file_path: string;
  file_type: string;
  file_hash: string;
  timestamp: string;
}

export interface FormData {
  walletID: string;
  srcID: string;
  price: number;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  timestamp: string;
  fileHash: string;
  bundleMode: boolean;
}

export interface ProxyData {
  walletID: string;
  srcID: string;
  ipAddr: string;
  price: number;
  timestamp: string;
}

export interface ProxyHistory {
  ConnectTime: string;
  DisconnectTime: string;
  IPAddr: string;
  Price: number;
  ProxyWalletID: string;
}
