import React, { useEffect, useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { usePreferencesStore } from './src/stores/usePreferencesStore';
import { colors } from './src/theme';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const loadPreferences = usePreferencesStore((s) => s.loadPreferences);
  const onboardingComplete = usePreferencesStore((s) => s.onboardingComplete);

  useEffect(() => {
    async function init() {
      try {
        await loadPreferences();
      } catch (err) {
        console.error('Failed to load preferences on start:', err);
      } finally {
        setIsReady(true);
      }
    }
    init();
  }, [loadPreferences]);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <NavigationContainer>
        <RootNavigator initialRoute={onboardingComplete ? 'Main' : 'Onboarding'} />
      </NavigationContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
