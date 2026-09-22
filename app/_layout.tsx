import React, { useCallback, useEffect, useMemo } from "react";
import { View } from "react-native";
import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DefaultTheme, Stack, ThemeProvider as NavigationThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { ThemeProvider, useAppTheme } from "../src/theme/ThemeProvider";
import { HabitStoreProvider, useHabitStore } from "../src/services/habitStore";
import { I18nProvider, resolveLanguage } from "../src/languages";
import { configureNotificationHandler, ensureAndroidChannel } from "../src/services/notifications";
import { ConfettiProvider } from "../src/services/confetti";
import { BackgroundGlow } from "../src/components/ui/BackgroundGlow";

function RootStack() {
  // Referans tipografisi: Plus Jakarta Sans. Fontlar app.json'daki expo-font
  // eklentisiyle native pakete gömülür; yine de yüklenene kadar hiçbir şey
  // çizilmez — aksi halde metin sistem fontuyla ölçülüp sonradan font değişince
  // (özellikle Android release'te) kırpılır.
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular: require("../assets/fonts/PlusJakartaSans_400Regular.ttf"),
    PlusJakartaSans_500Medium: require("../assets/fonts/PlusJakartaSans_500Medium.ttf"),
    PlusJakartaSans_600SemiBold: require("../assets/fonts/PlusJakartaSans_600SemiBold.ttf"),
    PlusJakartaSans_700Bold: require("../assets/fonts/PlusJakartaSans_700Bold.ttf"),
    PlusJakartaSans_800ExtraBold: require("../assets/fonts/PlusJakartaSans_800ExtraBold.ttf"),
  });

  const { colors, isDark } = useAppTheme();
  // Navigasyon kütüphanesi her sahneye kendi düz arka plan rengini boyar; bu,
  // BackgroundGlow degradesini örter. Şeffaf yapınca degrade görünür.
  // Sabit nesne: her render'da yenisi oluşsa tüm navigasyon ağacı yeniden
  // render olurdu.
  const navTheme = useMemo(
    () => ({ ...DefaultTheme, colors: { ...DefaultTheme.colors, background: "transparent" } }),
    []
  );

  const screenLayout = useCallback(
    ({ children }: { children: React.ReactNode }) => (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <BackgroundGlow />
        {children}
      </View>
    ),
    [colors.background]
  );

  useEffect(() => {
    configureNotificationHandler();
    ensureAndroidChannel();
  }, []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ConfettiProvider>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View style={{ flex: 1, backgroundColor: colors.background }}>
      <NavigationThemeProvider value={navTheme}>
      <Stack
        // Degrade zemin her ekranın KENDİ içinde çizilir; böylece her ekran
        // opaktır. Tek ortak zemin + şeffaf ekranlar, geçişlerde alttaki ekranın
        // ve degradenin her karede yeniden boyanmasına (Android'de takılma) yol
        // açıyordu.
        screenLayout={screenLayout}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "transparent" },
          // Altta kalan ekranlar, üstte bir ekran açıkken yeniden çizilmez.
          freezeOnBlur: true,
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="habit/add" options={{ presentation: "modal" }} />
        <Stack.Screen name="meeting/add" options={{ presentation: "modal" }} />
        <Stack.Screen name="subscription/add" options={{ presentation: "modal" }} />
        <Stack.Screen name="settings/index" />
        <Stack.Screen name="settings/appearance" />
        <Stack.Screen name="settings/order" />
        <Stack.Screen name="settings/tags" />
        <Stack.Screen name="settings/archive" />
        <Stack.Screen name="settings/trash" />
      </Stack>
      </NavigationThemeProvider>
      </View>
    </ConfettiProvider>
  );
}

// Seçili dil veri deposundaki ayarlardan okunur ve tüm ekranlara dağıtılır.
function LanguageRoot() {
  const { settings } = useHabitStore();
  return (
    <I18nProvider language={resolveLanguage(settings.language)}>
      <RootStack />
    </I18nProvider>
  );
}

// Provider sırası önemli: GestureHandler ve SafeArea en dışta (native
// kurulum gerektirirler), sonra tema (ekranlar renk okuyabilsin), sonra
// veri deposu (ekranlar alışkanlıkları okuyabilsin), en son da ekranların
// kendisi (RootStack).
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <HabitStoreProvider>
            <LanguageRoot />
          </HabitStoreProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
