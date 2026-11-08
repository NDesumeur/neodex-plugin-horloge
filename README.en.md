# Horloge mondiale (World Clock)

The current time in the cities that matter to you, to the second, with a slider to find out what time it will be there in a few hours.

*Version française : [README.md](README.md)*

## The cities

- The first card, **Here**, shows your local time. The next ones show each chosen city: the time with seconds, today's date there, the **offset** from you ("+6 h", "−9 h", "same time", half hours included) and a sun or moon icon depending on whether it is day (7 am to 8 pm) or night.
- To start: New York, Los Angeles, London, Tokyo and Seoul.
- **Add a city**: type its name then **Enter**; its time zone is found by itself, daylight saving changes included.
- A card's **X** removes it.

## Shifting the time

The **Shift by** slider moves every clock forward or back by up to 24 hours, hour by hour, to answer "when it is 6 pm here, what time will it be in Tokyo?". **Now** brings everything back to the current time.

## Data and sync

Your list of cities is stored by NeoDex, backed up and synced between your PCs when sync is on. City search goes through Open-Meteo's geocoding service, the only site contacted.

## Install

In NeoDex: **NeoStore → Discover → Horloge mondiale → Install**.

Building a plugin: see the [NeoDex SDK](https://github.com/NDesumeur/neodex-sdk).
