# Mobile Metin2 — technický plán

## Cieľ
Vlastný multiplayerový Metin2 server s vyšším EXP/dropom, ktorý sa dá hrať na iPhone. Priorita: preukázať kompatibilný iOS klient ešte pred zaplatením hostingu.

## Stav existujúceho repozitára
- `index.html` je samostatný mobilný RPG prototyp, nie Metin2 klient.
- Nemá Metin2 sieťový protokol a nepripája sa na Metin2 server.
- Prototyp ponechávame ako oddelenú ukážku; nebudeme ho označovať za hotový Metin2.

## Prieskum serverových základov (25. 10. 2026)

### Quantum Core X
- Repo: https://github.com/MeikelLP/quantum-core-x
- Otvorený serverový emulátor v C#, licencia MPL-2.0.
- Je označený ako work in progress a výslovne nie je spätne kompatibilný s pôvodným QuantumCore.
- Potrebuje zodpovedajúce dáta/klienta; samotný repozitár neobsahuje iOS klienta ani kompletné herné dáta.
- Záver: vhodný na štúdium a experimenty, ale zatiaľ ho nevyberáme ako produkčný server pre verejný server.

### go-metin2-server
- Repo: https://github.com/MikelCalvo/go-metin2-server
- Clean-room emulátor servera v Go, pre-alpha; autor výslovne uvádza, že nie je pripravený na hostovanie a plná kompatibilita klienta a obsah ešte chýbajú.
- Záver: sledovať, ale nie je to skratka k spustiteľnému serveru.

### Mobilný klient
- Verejné informácie o mobilných portoch ukazujú hlavne rozpracované Unity/Unreal projekty a Android buildy; oznámenie iOS verzie samo osebe nie je dôkazom, že si ju vieme nainštalovať a pripojiť k vlastnému serveru.
- Zatiaľ nemáme overený iOS klient s potvrdenou kompatibilitou s konkrétnym serverovým jadrom.
- To je aktuálna kritická blokácia. Neobjednávať VPS ani nekupovať drahý klient, kým nie je odstránená.

## Odporúčané poradie práce

### Brána 1 — dôkaz iOS klienta
Pred pokračovaním musí byť k dispozícii:
1. Skutočne inštalovateľná iOS aplikácia (App Store, TestFlight alebo dôveryhodný podpísaný build).
2. Dôkaz, že klient umožňuje pripojiť vlastný server.
3. Potvrdenie konkrétneho protokolu/verzie servera, s ktorou klient funguje.
4. Jasná cena a licencia.

### Brána 2 — server
Po splnení brány 1 vybrať kompatibilné jadro, najprv spustiť lokálny/testovací server a overiť prihlásenie. Až potom nastavovať:
- EXP rate,
- drop rate,
- Yang rate,
- ukladanie postáv a inventára,
- zálohy a zabezpečenie.

### Brána 3 — MVP test
- registrácia/prihlásenie,
- vytvorenie a výber postavy,
- vstup do mapy,
- dotykové ovládanie na iPhone,
- zabitie príšery → EXP a drop,
- uloženie postavy,
- dvaja hráči v jednom svete.

## Rozhodnutie k rozpočtu
Zatiaľ 0 € na VPS a komerčné klienty. Najprv musí byť dokázaná cesta ku klientovi. Nepoužívať uniknuté/platené súbory bez oprávnenia; pôvodné Metin2 art assets a lore sú chránené právami Webzen.

## Zdroje
- Quantum Core X README: https://github.com/MeikelLP/quantum-core-x
- Quantum Core X client setup (ukazuje požiadavku na TMP4 klienta): https://github.com/MeikelLP/quantum-core-x/blob/main/docs/docs/Getting%20Started/client.md
- go-metin2-server README: https://github.com/MikelCalvo/go-metin2-server
- Mobilné klienty – aktuálny prieskum a odkazy na vývojárske diskusie: https://metin2.gg/en/blog/metin2-mobile-clients-native-unity-unreal

## Zásada
Nepredstierať, že prototyp je Metin2. Neplatiť hosting, kým nie je potvrdený klient. Každý ďalší krok musí priniesť overiteľný výsledok.
