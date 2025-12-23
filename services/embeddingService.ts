import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// For production, you would use OpenAI API or another embedding service
// This is a placeholder that can be replaced with actual API calls

interface EmbeddingCache {
  [key: string]: number[];
}

// Cache embeddings locally to avoid repeated API calls
const embeddingCache: EmbeddingCache = {};

/**
 * Generate embedding for text using OpenAI API or local model
 * In production, replace this with actual API call
 */
export const generateEmbedding = async (text: string): Promise<number[]> => {
  // Check cache first
  if (embeddingCache[text]) {
    return embeddingCache[text];
  }

  try {
    // Option 1: Use OpenAI API (requires API key)
    if (process.env.EXPO_PUBLIC_OPENAI_API_KEY) {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small', // or 'text-embedding-ada-002'
          input: text,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const embedding = data.data[0].embedding;
      
      // Cache the embedding
      embeddingCache[text] = embedding;
      return embedding;
    }

    // Option 2: Use a local/simple embedding (fallback)
    // This is a very basic implementation - in production, use a proper model
    return generateSimpleEmbedding(text);
  } catch (error) {
    console.error('Error generating embedding:', error);
    // Fallback to simple embedding
    return generateSimpleEmbedding(text);
  }
};

/**
 * Simple embedding generator (fallback)
 * This is a basic TF-IDF-like approach - not as good as real embeddings
 */
const generateSimpleEmbedding = (text: string): number[] => {
  // Simple word frequency-based embedding
  const words = text.toLowerCase().split(/\s+/);
  const wordFreq: { [key: string]: number } = {};
  
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });

  // Create a 384-dimensional vector (common embedding size)
  const embedding = new Array(384).fill(0);
  const wordsArray = Object.keys(wordFreq);
  
  wordsArray.forEach((word, index) => {
    const hash = simpleHash(word);
    const position = hash % 384;
    embedding[position] += wordFreq[word] / words.length;
  });

  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => magnitude > 0 ? val / magnitude : 0);
};

const simpleHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

/**
 * Calculate cosine similarity between two embeddings
 */
export const cosineSimilarity = (embedding1: number[], embedding2: number[]): number => {
  if (embedding1.length !== embedding2.length) {
    throw new Error('Embeddings must have the same dimension');
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }

  const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
};

// Resume parsing and embedding functionality removed
// Match scores are now calculated based on user survey/preferences only

/**
 * Get resume embedding for user
 */
export const getResumeEmbedding = async (userId: string): Promise<number[] | null> => {
  try {
    // Try local cache first
    const cached = await AsyncStorage.getItem(`resume_embedding_${userId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // Get from Firestore
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const data = userSnap.data();
      const embedding = data.preferences?.resumeEmbedding;
      if (embedding && Array.isArray(embedding)) {
        // Cache locally
        await AsyncStorage.setItem(`resume_embedding_${userId}`, JSON.stringify(embedding));
        return embedding;
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting resume embedding:', error);
    return null;
  }
};

/**
 * Generate embedding for job description
 */
export const getJobEmbedding = async (job: any): Promise<number[]> => {
  // Create a comprehensive job text from title, description, requirements, etc.
  const jobText = [
    job.title || '',
    job.description || '',
    job.requirements || '',
    (job.responsibilities || []).join(' '),
    (job.benefits || []).join(' '),
    job.company || '',
    job.location || '',
  ].join(' ').trim();

  // Check cache
  if (embeddingCache[jobText]) {
    return embeddingCache[jobText];
  }

  // Generate embedding
  const embedding = await generateEmbedding(jobText);
  
  // Cache it
  embeddingCache[jobText] = embedding;
  
  return embedding;
};

/**
 * Calculate match score based on resume-job similarity
 */
export const calculateEmbeddingMatchScore = async (
  job: any,
  resumeEmbedding: number[]
): Promise<number> => {
  try {
    // Get job embedding
    const jobEmbedding = await getJobEmbedding(job);
    
    // Calculate cosine similarity (returns value between -1 and 1, typically 0 to 1)
    const similarity = cosineSimilarity(resumeEmbedding, jobEmbedding);
    
    // Convert similarity (0-1) to match score (80-100)
    // Similarity of 0 = 80%, similarity of 1 = 100%
    const matchScore = 80 + (similarity * 20);
    
    // Ensure it's between 80 and 100
    return Math.min(Math.max(Math.round(matchScore), 80), 100);
  } catch (error) {
    console.error('Error calculating embedding match score:', error);
    // Fallback to base score
    return 80;
  }
};

