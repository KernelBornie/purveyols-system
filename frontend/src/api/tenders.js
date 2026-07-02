import axios from 'axios';

export const uploadTenderDocument = async (tenderId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await axios.post(`/api/tenders/upload/${tenderId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
};

export const downloadTenderDocument = async (fileId, originalName) => {
  const response = await axios.get(`/api/tenders/download/${fileId}`, {
    responseType: 'blob'
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', originalName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
