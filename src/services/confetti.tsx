import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { ConfettiBurst } from "../components/ui/ConfettiBurst";

type ConfettiContextValue = {
  fire: () => void;
};

const ConfettiContext = createContext<ConfettiContextValue | undefined>(undefined);

// Kök seviyede, Tabs navigator'ın (ve dolayısıyla yüzen tab bar'ının) ÜSTÜNDE
// bir kez mount edilir; böylece konfeti hangi ekrandan tetiklenirse
// tetiklensin her zaman en üstte çizilir. Ekrana özel (screen-local) bir
// overlay, tab bar'ın kendi katmanının önüne değil ARKASINA düşerdi.
export function ConfettiProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);

  const fire = useCallback(() => setVisible(true), []);
  // Sabit değer: konfeti açılıp kapanınca useConfetti kullanan ekranlar
  // boşuna yeniden render olmasın.
  const value = useMemo(() => ({ fire }), [fire]);
  const onDone = useCallback(() => setVisible(false), []);

  return (
    <ConfettiContext.Provider value={value}>
      {children}
      {visible && (
        <View pointerEvents="none" style={styles.overlay}>
          <ConfettiBurst onDone={onDone} />
        </View>
      )}
    </ConfettiContext.Provider>
  );
}

export function useConfetti() {
  const ctx = useContext(ConfettiContext);
  if (!ctx) throw new Error("useConfetti must be used within ConfettiProvider");
  return ctx;
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 1000,
    elevation: 1000,
  },
});
