# Mobile Metin2 — technický plán

## Cieľ
Vybudovať vlastný multiplayerový Metin2-inšpirovaný svet, ktorý sa dá hrať na iPhone. Priorita je overiť reálnu cestu ku klientovi pre iOS skôr, než sa zaplatí hosting.

## Dôležitý stav
Aktuálny `index.html` je samostatný mobilný RPG prototyp. Nie je to Metin2 klient, nemá kompatibilný Metin2 sieťový protokol a nepripája sa na Metin2 server. Nesmie sa vydávať za hotový Metin2.

## Technické vetvy, ktoré treba overiť

### A — kompatibilný existujúci Metin2 server + iOS klient
- Nájsť klienta, ktorého autor výslovne povoľuje pripojenie k vlastnému serveru.
- Overiť, či je iOS build skutočne dostupný (App Store/TestFlight/zdrojový kód), nie iba sľúbený.
- Overiť kompatibilitu klienta s konkrétnou verziou servera a protokolom.
- Zistiť licenciu, cenu, možnosti vlastných rates a spôsob aktualizácií.
- Až po úspešnom teste riešiť VPS.

### B — otvorený serverový engine + vlastný mobilný klient
- Vybrať serverový engine s dostupným zdrojovým kódom a jasnou licenciou.
- Najprv spustiť server a otestovať prihlásenie/charakter cez podporovaného klienta.
- Potom vybudovať iOS klienta v Unity/Godot/Unreal a napojiť ho na serverový protokol.
- Toto je podstatne väčší projekt; pôvodné Metin2 modely, mapy, animácie a dáta nemožno predpokladať ako automaticky dostupné alebo legálne použiteľné.

## Kritériá pred platením
1. Doložený iOS klient, ktorý sa dá reálne nainštalovať.
2. Doložená kompatibilita s vlastným serverom.
3. Funkčný test loginu a vstupu do sveta.
4. Jasná cena a licenčné podmienky.
5. Až potom najlacnejší vhodný VPS a zálohy.

## Prvá skúška funkčnosti
- účet → výber postavy → vstup do mapy
- pohyb a dotykové ovládanie na iPhone
- zabitie príšery → EXP/drop
- uloženie postavy na serveri
- dvaja hráči v rovnakom svete

## Zásada
Žiadny hosting ani platené súbory, kým neprejdú prvé tri kritériá. Nepoužívať cudzie platené/uniknuté serverové súbory bez oprávnenia.
