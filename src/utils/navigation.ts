import type { useRouter } from "expo-router";

type Router = ReturnType<typeof useRouter>;

// Geri gidilecek bir ekran yoksa (ekran doğrudan/derin bağlantıyla açıldıysa)
// router.back() "GO_BACK was not handled" hatası verir. Bu durumda ana
// sayfaya düşer.
export function goBack(router: Router) {
  if (router.canGoBack()) router.back();
  else router.replace("/");
}
