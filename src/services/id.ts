// Bu dosya: yeni kayıtlara kimlik numarası (id) veren tek satırlık yardımcı.
// Her alışkanlık, toplantı ve etiket kaydedilirken kendine ait,
// bir daha tekrarlanmayan bir "id" alır. Uygulama daha sonra bir kaydı
// bulmak, güncellemek veya silmek için hep bu id'yi kullanır.
//
// Neden hem zaman hem rastgele sayı? Zaman damgası kayıtları doğal olarak
// sıraya sokar; sonuna eklenen rastgele parça ise aynı milisaniyede iki kayıt
// oluşturulursa ikisinin aynı id'yi almasını engeller.

export function generateId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
