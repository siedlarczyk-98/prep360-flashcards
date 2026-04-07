export interface TokenInfoResponse {
  userId: number;
  user: {
    email: string;
    nome?: string;
  };
}