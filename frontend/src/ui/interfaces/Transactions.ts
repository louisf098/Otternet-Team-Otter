export interface Transaction {
  address: string;
  amount: number;
  status: string;
  timeReceived: Date;
  category: string,
  blockHash: string,
  label: string,
  txid: string,
}