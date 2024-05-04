export interface IQuotation {
  checkin: string;
  checkout: string;
  kids?: number[];
  adults?: number;
  rooms?: number;
  promocode?: string;
}

interface IReturnQuotation {
  name: string | null | undefined;
  description: string | null | undefined;
  price: string | null | undefined;
  image: string | null | undefined;
}

export type TQuotationResponse = IReturnQuotation[];
