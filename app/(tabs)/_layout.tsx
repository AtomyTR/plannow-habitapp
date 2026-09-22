import { Tabs } from "expo-router";
import { LiquidTabBar } from "../../src/components/ui/LiquidTabBar";
import { useI18n } from "../../src/languages";

export default function TabsLayout() {
  const { t } = useI18n();
  return (
    <Tabs
      tabBar={(props) => <LiquidTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: "transparent" },
        // Görünmeyen sekmeler veri değişince arka planda yeniden çizilmez;
        // sekme geçişlerindeki takılmanın ana nedeni buydu.
        freezeOnBlur: true,
      }}
    >
      <Tabs.Screen name="index" options={{ title: t("tabs.today") }} />
      <Tabs.Screen name="feed" options={{ title: t("tabs.feed") }} />
      <Tabs.Screen name="calendar" options={{ title: t("tabs.calendar") }} />
      <Tabs.Screen name="profile" options={{ title: t("tabs.profile") }} />
    </Tabs>
  );
}
