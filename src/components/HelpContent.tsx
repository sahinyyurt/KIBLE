export function HelpContent() {
  return (
    <>
      <span className="eyebrow">KÜÇÜK BİR REHBER</span>
      <h2>Yönünü nasıl bulursun?</h2>
      <ol>
        <li>
          <b>Konum iznini ver.</b> Açılışta konum otomatik istenir. İstersen şehir / koordinat seç.
          Şehir seçimi şehir merkezini esas alır.
        </li>
        <li>
          <b>Pusula otomatik başlar.</b> Tarayıcı dokunma gerektirirse ‘Pusula izni ver’ düğmesini
          kullan. HTTPS ve destekleyen bir telefon gerekir.
        </li>
        <li>
          <b>Rahatça tut.</b> Telefonu önünde dik veya eğik tutup ok yönüne dön. Yere paralel tutman
          gerekmez. Metal kılıflardan ve elektronik eşyalardan uzaklaş.
        </li>
      </ol>
      <p>
        Pusula yoksa kuzey referanslı gösterimi kullan: önce gerçek kuzeyi belirle, sonra gösterilen
        açı kadar saat yönünde dön. Sensörün manyetik/gerçek kuzey referansı tarayıcıya göre
        değişebilir; manyetik sapma otomatik düzeltilmez.
      </p>
    </>
  );
}
