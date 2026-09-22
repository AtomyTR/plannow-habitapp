import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAppTheme } from "../../theme/ThemeProvider";
import { glowTones, withAlpha } from "../../theme/tokens";

// Referans zemin: #F6F7FB üstüne üç yumuşak ışıma — sol üstte açık mavi,
// sağ üstte lavanta, altta soluk mavi (Bugun.html'deki üç radyal gradient).
// expo-linear-gradient radyal gradient desteklemez, bu yüzden:
//   • üst bant: solda mavi → sağda lavanta (yatay), üstüne zemin rengine doğru
//     eriyen dikey bir örtü. Örtünün ucu TAM zemin rengidir, böylece bantın
//     alt kenarında dikiş/çizgi kalmaz;
//   • alt bant: zeminden soluk maviye (dikey).
// Şeffaf uçlar "transparent" (siyah, alfa 0) değil aynı tonun alfa 0 hâlidir;
// aksi hâlde geçişte siyaha doğru kirli bir bant oluşur.
// Sadece görseldir, dokunuşları geçirir.
export function BackgroundGlow() {
  const { isDark, colors } = useAppTheme();
  const tones = isDark ? glowTones.dark : glowTones.light;
  const bg = colors.background;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: bg }]}>
      <View style={styles.top}>
        <LinearGradient
          colors={[tones.topLeft, tones.topRight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={[withAlpha(bg, 0), bg]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
      <LinearGradient
        colors={[withAlpha(tones.bottom, 0), tones.bottom]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.bottom}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  top: { position: "absolute", top: 0, left: 0, right: 0, height: "55%" },
  bottom: { position: "absolute", bottom: 0, left: 0, right: 0, height: "40%" },
});
