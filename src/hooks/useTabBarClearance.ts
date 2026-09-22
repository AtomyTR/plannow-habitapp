import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Yüzen (floating) tab bar'ın geometrisi için tek doğruluk kaynağı;
// hem LiquidTabBar'ın kendisi hem de bir FAB'ı veya scroll içeriğini
// tab bar'dan uzak tutması gereken her ekran bunu kullanır. Bu değeri
// sabit bir sayı yerine insets.bottom'dan türetmek önemli çünkü cihazdan
// cihaza büyük fark var — gesture-nav Android telefonlar, buton-nav'lı
// telefonlara göre çok daha fazla alt boşluk ayırıyor.
export const TAB_BAR_HEIGHT = 64;
export const TAB_BAR_BOTTOM_MARGIN = 12;

// Ekranın fiziksel alt kenarından tab bar'ın üst kenarına olan mesafe.
export function useTabBarTopOffset() {
  const insets = useSafeAreaInsets();
  return insets.bottom + TAB_BAR_BOTTOM_MARGIN + TAB_BAR_HEIGHT;
}

// Aynısı, artı biraz nefes payı — bir FAB'ın ya da scroll içeriğinin alt
// padding'i olarak kullanılmalı, böylece hiçbir şey yüzen barın altında kalmaz.
export function useTabBarClearance(gap = 16) {
  return useTabBarTopOffset() + gap;
}

// FAB'ın alt kenardan mesafesi: gezinme çubuğuyla aynı hizada (referansta
// çubuğun hemen yanında durur).
export function useTabBarBottom() {
  const insets = useSafeAreaInsets();
  return insets.bottom + TAB_BAR_BOTTOM_MARGIN;
}

// Gezinme çubuğu + FAB ölçüleri. Referans 390 px genişlik içindir; 380 px
// altındaki dar telefonlarda (360 dp gibi) çubuk ile FAB üst üste binmesin diye
// FAB ve boşluklar küçülür, sekmelerin iç boşluğu daralır.
export function useTabBarMetrics() {
  const { width } = useWindowDimensions();
  const compact = width < 380;
  const fab = compact ? 56 : 64;
  const gap = compact ? 10 : 12;
  return {
    compact,
    fab,
    gap,
    // Çubuğun sağından ekran kenarına: yan boşluk (16) + FAB + aralık.
    barRight: 16 + fab + gap,
    itemPadding: compact ? 10 : 14,
    activePadding: compact ? 12 : 16,
  };
}
