export interface Currency {
  code: string;
  name: string;
  flag: string;
}

export interface ConversionSuccess {
  converted_amount: number;
  from_currency: string;
  to_currency: string;
  exchange_rate: number;
  isCached?: boolean;
  timestamp?: number;
}

export interface ConversionErrorDetail {
  code: string;
  message: string;
}

export interface ConversionError {
  error: ConversionErrorDetail;
}

export type ConversionResult = ConversionSuccess | ConversionError;

export interface ConversionHistoryItem extends ConversionSuccess {
  id: string;
  timestamp: number;
}