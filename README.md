# Horloge mondiale

L'heure qu'il est en ce moment dans les villes qui comptent pour toi, à la seconde près, avec un curseur pour savoir quelle heure il sera là-bas dans quelques heures.

*English version: [README.en.md](README.en.md)*

## Planificateur de réunion (nouveau en 1.5.0)

Une ligne par ville, 24 heures de ta journée : les heures qui vont à tout le monde en vert, la réunion à copier.

## Les villes

- La première carte, **Ici**, montre ton heure locale. Les suivantes montrent chaque ville choisie : l'heure avec les secondes, la date du jour là-bas, le **décalage** avec toi (« +6 h », « −9 h », « même heure », demi-heures comprises) et une icône soleil ou lune selon qu'il fait jour (de 7 h à 20 h) ou nuit.
- Au départ : New York, Los Angeles, Londres, Tokyo et Séoul.
- **Ajouter une ville** : tape son nom puis **Entrée** ; son fuseau horaire est trouvé tout seul, changements d'heure été/hiver compris.
- Le **X** d'une carte la retire.

## Décaler l'heure

Le curseur **Décaler de** avance ou recule toutes les horloges de 24 heures au plus, heure par heure, pour répondre à « quand il sera 18 h ici, quelle heure sera-t-il à Tokyo ? ». **Maintenant** remet tout à l'heure actuelle.

## Planifier une réunion (1.5.0)

Sous les horloges, choisis un jour : chaque ligne est une ville, chaque colonne une heure de ta journée. **Vert** : heures de bureau (9 h - 18 h). **Jaune** : encore possible (7 h - 22 h). **Sombre** : la nuit. Les heures soulignées vont à tout le monde, et sont écrites en haut (par exemple « 15:00 – 18:00 »). Les villes à la demi-heure (Inde…) sont justes. Un clic sur une heure écrit la réunion dans chaque ville : **COPIER** la met dans le presse-papiers, **VOIR SUR LES HORLOGES** décale les horloges à cette heure.

## Données et synchronisation

Ta liste de villes est enregistrée par NeoDex, sauvegardée et synchronisée entre tes PC si la synchro est activée. La recherche de ville passe par le service de géocodage d'Open-Meteo, seul site contacté.

## Installer

Dans NeoDex : **NeoStore → À découvrir → Horloge mondiale → Installer**.

Développer un plugin : voir le [SDK NeoDex](https://github.com/NDesumeur/neodex-sdk).

## Horloges pixel art

Chaque carte montre une petite scène en pixel art : le ciel de la ville à son heure (jour, aube, crépuscule, nuit étoilée), le soleil ou la lune sur leur arc, et une horloge à aiguilles devant. Le curseur « Décaler de » fait tourner le ciel et les aiguilles avec l'heure.
