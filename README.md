# Smart Air Box Card

Eine Dashboard-Karte für die drei Messwerte der Smart Air Box: Kohlendioxid (CO₂), Formaldehyd und VOCs. Sie zeigt die aktuellen Werte samt den von Home Assistant gelieferten Einheiten und für jeden Sensor einen eigenen Zeitverlauf. Die Verläufe nutzen Home Assistants eingebaute Historienkarte und damit getrennte Skalen. Für fehlende oder derzeit nicht verfügbare Sensorwerte erscheint eine klare Meldung.

Die Karte zeigt Messdaten. Sie bewertet keine Gesundheits- oder Sicherheitsgrenzwerte und ist keine CO-Warnung. CO₂ bezeichnet Kohlendioxid, nicht Kohlenmonoxid (CO).

## Installation über HACS

Dieses Projekt ist als eigenständiges [GitHub-Repository `JeanBarth/smart-air-box-card`](https://github.com/JeanBarth/smart-air-box-card) für HACS verfügbar. Der übergeordnete lokale Ordner `Home Assistant` gehört nicht zu diesem Repository.

1. In Home Assistant **HACS → Drei-Punkte-Menü → Benutzerdefinierte Repositories** öffnen, `https://github.com/JeanBarth/smart-air-box-card` eintragen und den Typ **Dashboard** auswählen.
2. Das Repository in HACS herunterladen. Die Dashboard-Ressource sollte unter `/hacsfiles/smart-air-box-card/smart-air-box-card.js` als JavaScript-Modul geladen werden. Falls HACS sie nicht automatisch einträgt: **Einstellungen → Dashboards → Drei-Punkte-Menü → Ressourcen** öffnen und diese URL mit Typ **JavaScript-Modul** hinzufügen.
3. Die Karte im Dashboard hinzufügen (Beispiel unten) und den Browser bei Bedarf neu laden.

Für einen lokalen Test ohne GitHub kann `dist/smart-air-box-card.js` nach `/config/www/smart-air-box-card.js` kopiert und als JavaScript-Modul unter `/local/smart-air-box-card.js` als Dashboard-Ressource eingetragen werden. Das ist eine manuelle Installation, keine HACS-Installation.

## Dashboard-Beispiel

```yaml
type: custom:smart-air-box-card
title: Smart Air Box
hours_to_show: 24
```

Standardmäßig verwendet die Karte diese Entitäten:

| Messwert | Entität |
| --- | --- |
| Kohlendioxid (CO₂) | `sensor.smart_air_box_kohlendioxid` |
| Formaldehyd | `sensor.smart_air_box_formaldehyd` |
| VOCs | `sensor.smart_air_box_vocs` |

Bei abweichenden Entitätsnamen können `co2_entity`, `formaldehyde_entity` und `vocs_entity` im YAML gesetzt werden. `hours_to_show` akzeptiert ganze Werte von 1 bis 168 und ist standardmäßig 24.

```yaml
type: custom:smart-air-box-card
co2_entity: sensor.smart_air_box_kohlendioxid
formaldehyde_entity: sensor.smart_air_box_formaldehyd
vocs_entity: sensor.smart_air_box_vocs
hours_to_show: 48
```

Für Zeitverläufe müssen die Sensorwerte in Home Assistants Recorder-Historie vorhanden sein. Die aktuellen Werte stammen direkt aus den Entitäten. Ihre Einheiten werden nicht fest vorgegeben.

## Entwicklung

Node.js genügt; es gibt keine externen Laufzeit-Abhängigkeiten. `npm run build` kopiert die Quelle nach `dist/`, `npm test` prüft die Konfiguration und den Umgang mit Sensorzuständen. `dist/smart-air-box-card.js` gehört zum Repository, damit HACS die Datei direkt herunterladen kann.
