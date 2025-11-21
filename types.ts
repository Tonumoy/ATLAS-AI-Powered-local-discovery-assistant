
export interface GroundingChunk {
  maps?: {
    uri?: string;
    title?: string;
    placeId?: string;
    placeAnswerSources?: {
        reviewSnippets?: {
            content?: string;
            author?: string;
        }[]
    }
  };
  web?: {
    uri?: string;
    title?: string;
  };
  extractedMetadata?: {
    rating?: string;
    reviews?: string;
    distance?: string;
  };
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  groundingChunks?: GroundingChunk[];
  isError?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}
