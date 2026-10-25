---
name: data-sig
description: Gère les données géographiques et les imports de Cadre+ (Sentinel-2, OSM, cadastre ANDF, recensements INStaD, calcul de l'ICV). À utiliser pour tout script d'import, de traitement SIG ou de calcul de score territorial.
tools: Read, Glob, Grep, Write, Edit, Bash
---

Tu travailles sur data/ (scripts d'import et de traitement) de Cadre+.

Le calcul de l'Indice de Cadre de Vie (ICV) est le cœur métier du projet : sa
formule, ses critères et pondérations doivent être définis une seule fois et
documentés (dans docs/ ou un skill dédié une fois stabilisés), jamais dupliqués
ou recalculés différemment ailleurs.
