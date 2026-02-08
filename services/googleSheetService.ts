import { AppState } from '../types';

export interface SyncResponse {
  success: boolean;
  message?: string;
  data?: AppState;
}

export const syncToSheet = async (url: string, data: AppState): Promise<SyncResponse> => {
  try {
    // Google Apps Script Web App requests require 'no-cors' for simple POSTs or proper CORS handling.
    // Standard fetch with CORS mode usually works if the script returns ContentService.createTextOutput with setMimeType(ContentService.MimeType.JSON)
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // Use text/plain to avoid preflight OPTIONS check issues with GAS
      },
      body: JSON.stringify({
        action: 'save',
        data: data
      })
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Sync error:", error);
    return { success: false, message: 'Lỗi kết nối đến Google Sheet' };
  }
};

export const loadFromSheet = async (url: string): Promise<SyncResponse> => {
  try {
    // Adding a timestamp to prevent caching
    const fetchUrl = `${url}?action=load&t=${Date.now()}`;
    const response = await fetch(fetchUrl);
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Load error:", error);
    return { success: false, message: 'Không thể tải dữ liệu từ Google Sheet' };
  }
};