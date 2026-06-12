// File handling utilities for uploads and downloads

export const FileHandler = {
  /**
   * Download file from blob
   */
  downloadFile: (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Download JSON as file
   */
  downloadJSON: (data: unknown, filename: string) => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    FileHandler.downloadFile(blob, filename);
  },

  /**
   * Download CSV file
   */
  downloadCSV: (data: unknown[], filename: string) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0] as Record<string, unknown>);
    const csv = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = (row as Record<string, unknown>)[header];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    FileHandler.downloadFile(blob, filename);
  },

  /**
   * Handle file upload
   */
  handleFileUpload: (
    accept: string,
    onFile: (file: File, content: string) => void
  ) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const content = await file.text();
        onFile(file, content);
      }
    };
    input.click();
  },

  /**
   * Save to localStorage
   */
  saveToLocalStorage: (key: string, data: unknown) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('[v0] Error saving to localStorage:', error);
      return false;
    }
  },

  /**
   * Load from localStorage
   */
  loadFromLocalStorage: <T = unknown,>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('[v0] Error loading from localStorage:', error);
      return defaultValue;
    }
  },

  /**
   * Clear localStorage
   */
  clearLocalStorage: (key?: string) => {
    try {
      if (key) {
        localStorage.removeItem(key);
      } else {
        localStorage.clear();
      }
      return true;
    } catch (error) {
      console.error('[v0] Error clearing localStorage:', error);
      return false;
    }
  }
};
