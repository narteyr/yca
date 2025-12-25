import LoadingScreen from '@/components/loading-screen';
import { colors } from '@/constants/colors';
import { Fonts } from '@/constants/theme';
import { fetchNews } from '@/services/newsService';
import { News } from '@/types/news';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, RefreshControl, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

export default function NewsScreen() {
  const insets = useSafeAreaInsets();
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState<string>('');
  const [webViewLoading, setWebViewLoading] = useState(true);
  
  // Calculate header height for WebView padding (safe area + header content height)
  const HEADER_HEIGHT = insets.top + 64;

  useEffect(() => {
    loadNews();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNews();
    }, [])
  );

  const loadNews = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        setLastVisible(null);
        setHasMore(true);
      } else {
        setLoading(true);
      }
      setError(false);

      const result = await fetchNews();
      setNews(result.news);
      setLastVisible(result.lastVisible);
      setHasMore(result.news.length === 20); // If we got 20 items, there might be more
    } catch (error: any) {
      console.error('Error loading news:', error);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore || !lastVisible) return;

    try {
      setLoadingMore(true);
      const result = await fetchNews(lastVisible);
      setNews(prev => [...prev, ...result.news]);
      setLastVisible(result.lastVisible);
      setHasMore(result.news.length === 20);
    } catch (error) {
      console.error('Error loading more news:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleOpenLink = (url: string) => {
    if (!url || url.trim() === '') {
      Alert.alert(
        'Invalid Link',
        'This article link is not available.',
        [{ text: 'OK' }]
      );
      return;
    }

    setSelectedUrl(url);
    setModalVisible(true);
    setWebViewLoading(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedUrl('');
    setWebViewLoading(true);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      if (diffInSeconds < 60) return 'Just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
      
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
    } catch {
      return dateString;
    }
  };

  const getBase64ImageUri = (base64String: string): string | null => {
    if (!base64String) return null;
    // Handle both data:image and plain base64 strings
    if (base64String.startsWith('data:')) {
      return base64String;
    }
    // Try to detect image format from base64 string
    // Check for common image format signatures in base64
    // For better quality, use the appropriate MIME type
    // Default to jpeg for better compression, but try png if it looks like png
    // Most web images are jpeg, so default to that for better quality
    return `data:image/jpeg;base64,${base64String}`;
  };

  const renderNewsItem = ({ item }: { item: News }) => {
    const thumbnailUri = getBase64ImageUri(item.thumbnail);
    const faviconUri = getBase64ImageUri(item.favicon);

    return (
      <TouchableOpacity
        style={styles.newsCard}
        onPress={() => handleOpenLink(item.link)}
        activeOpacity={0.7}>
        <View style={styles.newsContent}>
          {/* Thumbnail */}
          {thumbnailUri ? (
            <Image
              source={{ uri: thumbnailUri }}
              style={styles.thumbnail}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
              priority="high"
              recyclingKey={item.id}
            />
          ) : (
            <View style={styles.thumbnailPlaceholder}>
              <Ionicons name="newspaper-outline" size={24} color={colors.textTertiary} />
            </View>
          )}

          {/* Content */}
          <View style={styles.newsTextContainer}>
            {/* Source and Date */}
            <View style={styles.sourceRow}>
              {faviconUri ? (
                <Image
                  source={{ uri: faviconUri }}
                  style={styles.favicon}
                  contentFit="contain"
                  cachePolicy="memory-disk"
                  priority="high"
                />
              ) : (
                <Ionicons name="globe-outline" size={14} color={colors.textTertiary} />
              )}
              <Text style={styles.sourceText} numberOfLines={1}>
                {item.source || 'Unknown Source'}
              </Text>
              <Text style={styles.dateText}>• {formatDate(item.iso_date || item.date)}</Text>
            </View>

            {/* Title */}
            <Text style={styles.newsTitle} numberOfLines={2}>
              {item.title}
            </Text>

            {/* Snippet */}
            {item.snippet && (
              <Text style={styles.newsSnippet} numberOfLines={2}>
                {item.snippet}
              </Text>
            )}

            {/* Read More */}
            <View style={styles.readMoreRow}>
              <Text style={styles.readMoreText}>Read article</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.primary} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="newspaper-outline" size={64} color={colors.textTertiary} />
        <Text style={styles.emptyTitle}>No News Available</Text>
        <Text style={styles.emptyText}>Check back later for the latest updates</Text>
      </View>
    );
  };

  const renderError = () => {
    if (!error) return null;
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
        <Text style={styles.errorTitle}>Something Went Wrong</Text>
        <Text style={styles.errorText}>Unable to load news at this time</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => loadNews()}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading && news.length === 0) {
    return <LoadingScreen message="Loading news..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.softpaper} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>News Feed</Text>
      </View>

      {error && news.length === 0 ? (
        renderError()
      ) : (
        <FlatList
          data={news}
          renderItem={renderNewsItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadNews(true)}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
        />
      )}

      {/* WebView Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleCloseModal}>
        <View style={styles.modalContainer}>
          <StatusBar barStyle="dark-content" />
          
          {/* Fixed Modal Header */}
          <View style={[styles.modalSafeArea, { paddingTop: insets.top }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={handleCloseModal}
                style={styles.closeButton}
                activeOpacity={0.6}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
                <Ionicons name="close" size={28} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.modalHeaderTitle}>Article</Text>
              <View style={styles.closeButton} />
            </View>
          </View>

          {/* WebView */}
          {webViewLoading && (
            <View style={styles.webViewLoader}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.webViewLoaderText}>Loading article...</Text>
            </View>
          )}
          <WebView
            source={{ uri: selectedUrl }}
            style={[styles.webView, { marginTop: HEADER_HEIGHT }]}
            onLoadStart={() => setWebViewLoading(true)}
            onLoadEnd={() => setWebViewLoading(false)}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('WebView error: ', nativeEvent);
              setWebViewLoading(false);
              Alert.alert(
                'Error',
                'Unable to load the article. Please try again later.',
                [{ text: 'OK', onPress: handleCloseModal }]
              );
            }}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.webViewLoader}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            )}
            nestedScrollEnabled={true}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.softpaper,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: Fonts.bold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Space for bottom tab bar
  },
  newsCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  newsContent: {
    flexDirection: 'row',
  },
  thumbnail: {
    width: 140,
    height: 140,
    backgroundColor: colors.borderLight,
    // Use higher resolution for better quality
    // The image will be rendered at device pixel ratio
  },
  thumbnailPlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newsTextContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  favicon: {
    width: 14,
    height: 14,
    borderRadius: 2,
  },
  sourceText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: colors.textSecondary,
    flex: 1,
  },
  dateText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: colors.textTertiary,
  },
  newsTitle: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: 8,
  },
  newsSnippet: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  readMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readMoreText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: colors.primary,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: Fonts.semiBold,
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontFamily: Fonts.semiBold,
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: colors.white,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  modalSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    zIndex: 1000,
    elevation: 1000,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.borderLight,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    color: colors.textPrimary,
  },
  webView: {
    flex: 1,
    backgroundColor: colors.white,
    marginTop: 0,
  },
  webViewLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  webViewLoaderText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: colors.textSecondary,
  },
});

