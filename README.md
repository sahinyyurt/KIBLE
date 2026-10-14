# Kıble Yönüm

React + TypeScript ile yazılmış, mobil tarayıcıda çalışan açık kaynak kıble pusulası. Sunucu, API anahtarı veya kullanıcı hesabı gerektirmez.

## Özellikler

- Açılışta konum isteği ve destekleyen tarayıcılarda otomatik pusula.
- Tarayıcı gerektirdiğinde dokunarak sensör izni verme.
- GPS, şehir merkezi veya elle koordinat seçimi.
- Büyük daire başlangıç açısıyla Kâbe yönü ve kuş uçuşu mesafe.
- Android mutlak yön sensöründe eğimi hesaba katan hesaplama; Safari için `webkitCompassHeading`.
- Türkçe, mobil uyumlu arayüz.

## Geliştirme

Node.js 22.13 veya üzeri gerekir.

```sh
npm install --global pnpm@11.25.0
pnpm install --frozen-lockfile
pnpm dev
```

```sh
pnpm test
pnpm build
pnpm preview
```

Kod kalitesi kontrolleri:

```sh
pnpm format       # Dosyaları Prettier ile biçimlendir
pnpm typecheck    # TypeScript tip kontrolü
pnpm lint         # TypeScript ve React hook kuralları
pnpm check        # Biçim, lint, test ve üretim derlemesi
```

### Kod yapısı

- `src/App.tsx`: sayfa düzeni ve kullanıcı eylemlerini bağlama.
- `src/components/`: pusula, konum, sensör ve diyalog arayüzleri; form durumu form bileşeninde tutulur.
- `src/hooks/`: konum istekleri ve pusulanın izin, olay dinleyicisi ve zaman aşımı yaşam döngüsü.
- `src/lib/`: React bağımlılığı olmayan açı, kıble ve koordinat hesaplamaları.
- `src/data/` ve `src/types/`: şehir verileri ve ortak konum tipleri.
- `tests/`: yön hesaplama, sensör verisi ve koordinat doğrulama testleri.

Konum koordinatları derece, mesafe `distanceKm` alanında kilometre cinsindendir. Pusula açısı
bulunamadığında `null` kullanılır. Hook'lar eski istek sonuçlarını yok sayar ve sensör
dinleyicilerini temizler. Biçimlendirme, lint, test ve tip kontrolü GitHub Actions üzerinde de çalışır.

Üretim çıktısı `dist/` dizinindedir. Telefonda konum ve yön sensörünü denemek için HTTPS kullanın; yerel ağdaki düz HTTP adresi yeterli değildir.

## GitHub Pages

1. Bu kaynakları herkese açık GitHub deponuzun `main` dalına yükleyin.
2. **Settings → Pages → Source → GitHub Actions** seçin.
3. **Actions → Deploy Qibla to GitHub Pages → Run workflow** ile ilk yayını başlatın.

Sonraki `main` güncellemelerinde test, derleme ve yayın otomatik çalışır. `base: './'` ayarı depo alt yolunu destekler. Canlı adres başarılı dağıtımın çıktısında görünür.

## Doğruluk ve cihaz sınırları

Kıble açısı gerçek kuzeyden saat yönünde hesaplanır. Sensörün manyetik/gerçek kuzey referansı cihaza ve tarayıcıya göre değişebilir; uygulama manyetik sapmayı otomatik düzeltmez. Metal nesneler, kılıflar ve kalibrasyon sonucu etkileyebilir. Şehir seçimi şehir merkezini esas alır. Kâbe'ye çok yakınken GPS hatası yönü önemli ölçüde etkileyebilir.

Dik veya eğik tutuş desteklenir; bazı uç tutuşlarda yön izdüşümü belirsizleştiğinde canlı gösterim durdurulur. Telefonu hafifçe döndürün. Otomatik izin istemeyi engelleyen tarayıcılarda düğmeye dokunmak gerekir. Daha önce reddedilen izinleri tarayıcı/site ayarlarından açın.

Matematik kontrolleri ve üretim derlemesi doğrulanmıştır. Gerçek cihazda sensör/izin davranışı ayrıca test edilmelidir.

## Gizlilik

Konum yalnızca cihazda hesaplanır, uygulama tarafından sunucuya gönderilmez veya kalıcı saklanmaz. Analitik ve izleme kodu yoktur. Yazı tipleri Google Fonts üzerinden yüklenir; bu istekler konum koordinatlarını içermez. GitHub Pages kendi standart erişim kayıtlarını tutabilir.

## Katkı ve lisans

Hata bildirirken cihaz, tarayıcı, işletim sistemi, verilen izinler ve yeniden üretme adımlarını ekleyin. Hassas konum bilgilerini paylaşmanız gerekmez.

MIT lisansı; ayrıntılar [LICENSE](LICENSE) dosyasında.
