export interface IChatState {
  checkin: string | null;
  checkout: string | null;
  rooms: number;
  adults: number;
  kids?: number[] | null;
  promocode?: string | null;
}

interface IReturnChat {
  name: string | null | undefined;
  description: string | null | undefined;
  price: string | null | undefined;
  image: string | null | undefined;
}

export interface IChatResponse {
  data?: IReturnChat[];
  error: number;
  message: string;
}
