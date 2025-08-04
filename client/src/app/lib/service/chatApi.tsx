import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const chatApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface ChatMessage {
  id?: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  pdf_id?: string;
  sources?: string[];
}

export const chatService = {
  askQuestion: async (
    question: string,
    pdf_id: string,
    token: string,
    llmModel: string,
    promptStyle: string
  ): Promise<{ answer: string }> => {
    const response = await chatApi.post(
      '/qa/ask',
      { question, pdf_id, llm_model: llmModel, prompt_style: promptStyle },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // For chat history (to be implemented in backend)
  getHistory: async (token: string): Promise<ChatMessage[]> => {
    const response = await chatApi.get('/qa/history', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.history;
  },

  saveHistory: async (messages: ChatMessage[], token: string) => {
    await chatApi.post(
      '/qa/history',
      { messages },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  },

  deleteHistory: async (token: string) => {
    await chatApi.delete('/qa/history', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  

};

interface DocumentApiResponse{
  document:any
  id: any;
    title: any;
    filename: any;
}

export const DocumentService = {
  getDocuments: async (token: string): Promise<DocumentApiResponse> => {
    const response = await chatApi.get('/pdf/documents', {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("data",response.data);
    return response.data;
  },
};

export const TranscribeService = {
  transcribeAudio: async (audioFile: File, token: string): Promise<string> => {
        const formData = new FormData();
        formData.append('audio', audioFile);
    
        const response = await chatApi.post('/voice/transcribe', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
        },
        });
    
        return response.data.transcription;
    }
};


export const SummaryService = {
  pdfsummary: async (pdf_id: number, token: string, force = false): Promise<string> => {
  const response = await chatApi.post(
    '/pdf/summarize',
    { pdf_id, force },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data.summary;
},

  Graphhandle: async (pdf_id: number, token: string): Promise<string> => {
    const response = await chatApi.post(
      '/pdf/entities',
      { pdf_id },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data.graph;
  }
}


