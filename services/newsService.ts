import { collection, getDocs, query, orderBy, limit, startAfter, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { News } from '@/types/news';

export const fetchNews = async (
  lastVisible?: QueryDocumentSnapshot<DocumentData>
): Promise<{ news: News[]; lastVisible: QueryDocumentSnapshot<DocumentData> | null }> => {
  try {
    // Query news collection, ordered by iso_date descending (most recent first)
    let q = query(
      collection(db, 'news'),
      orderBy('iso_date', 'desc'),
      limit(20)
    );

    if (lastVisible) {
      q = query(
        collection(db, 'news'),
        orderBy('iso_date', 'desc'),
        startAfter(lastVisible),
        limit(20)
      );
    }

    const querySnapshot = await getDocs(q);
    const news: News[] = [];
    let newLastVisible: QueryDocumentSnapshot<DocumentData> | null = null;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      news.push({
        id: doc.id,
        title: data.title || '',
        link: data.link || '',
        source: data.source || '',
        date: data.date || '',
        thumbnail: data.thumbnail || '',
        snippet: data.snippet || '',
        iso_date: data.iso_date || '',
        favicon: data.favicon || '',
      });
      newLastVisible = doc;
    });

    return { news, lastVisible: newLastVisible };
  } catch (error: any) {
    console.error('Error fetching news:', error);
    
    // Hide all Firebase error details from users
    const genericError = new Error('Unable to load news at this time. Please try again later.');
    (genericError as any).isFirebaseError = true;
    throw genericError;
  }
};

