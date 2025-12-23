import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { Fonts } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

export default function TabLayout() {
  const pathname = usePathname();
  const router = useRouter();

  const CustomTabBar = ({ state, descriptors, navigation }: any) => {
    const isHomeActive = pathname.includes('home');
    const isSavedActive = pathname.includes('saved');
    const isSettingsActive = pathname.includes('profile');

    const handleTabPress = (routeName: string, isFocused: boolean) => {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      const event = navigation.emit({
        type: 'tabPress',
        target: routeName,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(routeName);
      }
    };

    return (
      <View style={styles.tabBarContainer}>
        <View style={styles.tabBar}>
          {/* Home Button */}
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => handleTabPress('home', isHomeActive)}>
            <Ionicons
              name="home"
              size={24}
              color={isHomeActive ? '#FF6B35' : '#999999'}
            />
            <Text style={[
              styles.tabLabel,
              isHomeActive && styles.tabLabelActive
            ]}>
              Home
            </Text>
          </TouchableOpacity>

          {/* Saved Button (Center - Large) */}
          <TouchableOpacity
            style={styles.centerTabItem}
            onPress={() => handleTabPress('saved', isSavedActive)}>
            <View style={[
              styles.centerButton,
              isSavedActive && styles.centerButtonActive
            ]}>
              <Ionicons
                name="bookmark"
                size={28}
                color="#FFFFFF"
              />
            </View>
            <Text style={[
              styles.tabLabel,
              isSavedActive && styles.tabLabelActive
            ]}>
              Saved
            </Text>
          </TouchableOpacity>

          {/* Settings Button */}
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => handleTabPress('profile', isSettingsActive)}>
            <Ionicons
              name="settings-outline"
              size={24}
              color={isSettingsActive ? '#FF6B35' : '#999999'}
            />
            <Text style={[
              styles.tabLabel,
              isSettingsActive && styles.tabLabelActive
            ]}>
              Settings
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' }, // Hide default tab bar
      }}
      tabBar={(props) => <CustomTabBar {...props} />}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Discover',
          href: null, // Hide from tab bar, but accessible via navigation
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Saved',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Settings',
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 20,
    paddingTop: 12,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  centerTabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    gap: 4,
  },
  centerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  centerButtonActive: {
    backgroundColor: '#FF6B35',
  },
  tabLabel: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: '#999999',
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#FF6B35',
    fontFamily: Fonts.semiBold,
  },
});
