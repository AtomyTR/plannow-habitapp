import { Image, StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "../../theme/ThemeProvider";
import { radius, typography } from "../../theme/tokens";
import { subscriptionIcon } from "../../data/subscriptions";

// Bir aboneliğin simgesi: yumuşak zeminli kare bir kutu içinde, aboneliğin
// rengine boyanmış marka glifi.
//
// Simge dosyaları tek renkli alfa maskeleridir, bu yüzden `tintColor` ile
// istenen renge boyanırlar — her marka için ayrı renkli görsel tutmaya gerek
// kalmaz ve liste tek bir görsel dilde kalır.
//
// Simgesi olmayan abonelikler (kullanıcının kendi yazdıkları, ya da sette
// bulunmayan servisler) adın ilk harfine düşer. Boş bir kutu göstermek yerine
// harf göstermek, listede her satırın aynı ağırlıkta görünmesini sağlar.

type SubscriptionIconProps = {
  name: string;
  color: string;
  iconKey?: string;
  size?: number;
  /**
   * Zemin kutusunu kaldırır, sadece glifi çizer. Zaten kendi zemini olan dar
   * alanlarda (örn. bir çipin içinde) kutu üstüne kutu koymamak için.
   */
  plain?: boolean;
};

export function SubscriptionIcon({
  name,
  color,
  iconKey,
  size = 40,
  plain = false,
}: SubscriptionIconProps) {
  const { colors } = useAppTheme();
  const source = subscriptionIcon(iconKey);

  return (
    <View
      style={[
        styles.box,
        {
          width: size,
          height: size,
          borderRadius: radius.md,
          backgroundColor: plain ? "transparent" : colors.surfaceMuted,
        },
      ]}
    >
      {source ? (
        <Image
          source={source}
          // `contain`, geniş logoların (Amazon, YouTube) kutuyu taşırmadan
          // sığmasını sağlar; kare olanlar zaten tam oturur.
          resizeMode="contain"
          tintColor={color}
          style={{ width: size * (plain ? 1 : 0.55), height: size * (plain ? 1 : 0.55) }}
        />
      ) : (
        <Text style={[typography.bodyStrong, { color, fontSize: size * (plain ? 0.75 : 0.4) }]}>
          {name.trim().charAt(0).toUpperCase() || "?"}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: "center",
    justifyContent: "center",
  },
});
