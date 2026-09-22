import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useAppTheme } from "../../theme/ThemeProvider";
import { useI18n } from "../../languages";
import { fonts, radius } from "../../theme/tokens";

// "Yeni kayıt" üstündeki segment kontrol (YeniAliskanlik.html). Referansta
// Görev / Alışkanlık / Toplantı var; uygulamada "Görev" diye ayrı bir kayıt
// türü olmadığı için yalnızca Alışkanlık ve Toplantı gösterilir. Diğer sekmeye
// basmak ilgili ekleme formuna geçer (mevcut iki ekran arasında).
export function EntryTypeSwitch({ current }: { current: "habit" | "meeting" }) {
  const { colors } = useAppTheme();
  const { t } = useI18n();
  const router = useRouter();

  const items: { key: "habit" | "meeting"; label: string; href: "/habit/add" | "/meeting/add" }[] = [
    { key: "habit", label: t("habitForm.type.habit"), href: "/habit/add" },
    { key: "meeting", label: t("habitForm.type.meeting"), href: "/meeting/add" },
  ];

  return (
    <View style={[styles.wrap, { backgroundColor: colors.segmented }]}>
      {items.map((item) => {
        const active = item.key === current;
        return (
          <Pressable
            key={item.key}
            onPress={() => {
              if (!active) router.replace(item.href);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[styles.item, active && [styles.itemActive, { backgroundColor: colors.surface }]]}
          >
            <Text
              style={[
                styles.label,
                { color: active ? colors.text : colors.textSecondary },
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", gap: 6, padding: 4, borderRadius: radius.md },
  item: { flex: 1, height: 40, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  itemActive: {
    shadowColor: "#282C5A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  label: { fontSize: 13, fontFamily: fonts.bold },
});
