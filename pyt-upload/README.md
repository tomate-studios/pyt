# P.Y.T. — Plataforma de Teorías del Universo

Primera versión funcional (v1 de prueba) de **P.Y.T.**: una comunidad online donde cualquier
persona puede proponer hipótesis, modelos y teorías sobre el **universo real** (cosmología,
gravedad, agujeros negros, relatividad, mecánica cuántica, materia y energía, galaxias…).

**Ninguna publicación aparece públicamente antes de superar dos detectores independientes:**
un detector de antidesinformación científica y un detector antigroserías.

---

## 1. Cómo ejecutarlo

Requisitos: **Node.js 20+** (desarrollado y probado con Node 24; la base de datos usa el motor
`node:sqlite` integrado, sin dependencias nativas).

```bash
npm install      # una sola vez
npm run dev      # arranca API + frontend en http://localhost:7100
```

Abre <http://localhost:7100> en el navegador.

La primera vez se crea automáticamente la base de datos `server/data/pyt.db` con 4
publicaciones de **contenido editorial de ejemplo** (claramente identificadas con la insignia
«Ejemplo editorial»); los ejemplos del Laboratorio nunca aparecen como publicaciones reales.

### Otros comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo (Vite con recarga en caliente + API). Acepta `-- --port N --host H` |
| `npm run build` | Compila el frontend a `dist/` |
| `npm start` | Modo producción: sirve `dist/` + API en el mismo puerto |

Configuración por entorno (opcional): `PORT` y `HOST`. **No hay claves secretas** en esta
versión: los detectores son 100 % locales y no llaman a ningún servicio externo.

---

## 2. Arquitectura y estructura de archivos

```
├── index.html                  Entrada del frontend
├── package.json                Scripts y dependencias
├── src/                        Frontend (React + TypeScript + Tailwind)
│   ├── api.ts                  Cliente HTTP + token de cliente (localStorage)
│   ├── types.ts                Tipos compartidos (teoría, revisión, detectores)
│   ├── components/             Layout, Starfield, TheoryCard, StatusBadge, ReviewPanel
│   └── pages/                  Home, TheoryDetail, Publish, Mine, Lab
└── server/                     Backend real (Express 5 + SQLite)
    ├── index.js                API REST, validación, rate-limit, seguridad
    ├── db.js                   Esquema SQLite + contenido editorial sembrado
    ├── review.js               Pipeline: detector 1 → detector 2 → veredicto combinado
    ├── detectors/
    │   ├── disinformation.js   Detector de antidesinformación (reglas locales)
    │   └── profanity.js        Detector antigroserías (con contexto y plurales)
    └── data/pyt.db             Base de datos real (se genera sola)
```

- **Backend real**: Express 5 con API REST (`/api/...`), todo procesado en servidor.
- **Base de datos real**: SQLite en disco (`node:sqlite`), tablas `theories`, `likes`,
  `comments`. Nada se guarda «solo en memoria del navegador».
- **Un solo proceso** sirve API y frontend: no hay que levantar dos servidores.

---

## 3. Flujo de publicación (implementado exactamente así)

1. El usuario redacta su teoría (título, categoría, resumen, explicación, fuentes, autor).
2. Pulsa **«Enviar para revisión»** → se muestra el indicador de revisión por pasos.
3. Se ejecuta el **detector de antidesinformación**.
4. Se ejecuta el **detector antigroserías**.
5. El sistema combina los resultados:

| Detector 1 | Detector 2 | Resultado |
|---|---|---|
| rechaza | — | **Rechazada** (no se publica) |
| — | rechaza | **Rechazada** (no se publica) |
| aprueba | limpio | **Publicada** y visible en la portada |
| sin conclusión fiable | cualquiera | **Pendiente de revisión** (no se publica todavía) |

En caso de rechazo se muestra: **motivo**, **fragmento exacto** que lo provocó, **sugerencia
de corrección** y botón **«Editar y volver a enviar»**. El borrador **nunca se elimina**:
queda en «Mis teorías» junto al informe completo de ambos detectores.

---

## 4. Cómo funciona el detector de antidesinformación (v1 — reglas locales)

`server/detectors/disinformation.js`. Sistema heurístico por reglas, **declarado en la propia
interfaz como limitado**. Puntuación de riesgo:

- **+5** por cada afirmación demostrablemente falsa sobre el universo real presentada como
  válida (Tierra plana, «la gravedad no existe», alunizaje falso, universo de 6 000 años,
  «los agujeros negros no existen», «la relatividad está refutada»…). Cada regla incluye la
  corrección y el conocimiento establecido que la respalda. Si la afirmación se menciona para
  **negarla o refutarla** («es falso que…», «algunos creen erróneamente que…»), no puntúa.
- **+2** por señales de fabricación: estadísticas sobre «los científicos» sin fuente,
  descubrimientos atribuidos a «científicos de X» sin referencia, «documentos filtrados»,
  marcos conspirativos («la NASA oculta…»). Con fuentes reales aportadas, baja a +1.
- **+1** (máx. 3) por lenguaje de hecho consumado («está demostrado», «es un hecho»,
  «100 % seguro», «todos los científicos») sin distinción hecho/hipótesis.
- **−1** (máx. −3) por honestidad epistémica: «hipótesis», «propongo», «podría»,
  «sin evidencia suficiente»… → **una hipótesis sin demostrar nunca se castiga** (regla A).
- **−1** si aporta fuentes reales (URL, DOI, arXiv).
- **+1** si el texto es demasiado breve para evaluar: el detector **reconoce no tener pruebas
  suficientes en lugar de inventar una comprobación** (regla D).

Veredicto: riesgo ≥ 5 → **rechazada**; 2–4 → **pendiente de revisión**; ≤ 1 → **aprobada**.
El resultado incluye: veredicto, **clasificación** (hecho respaldado / hipótesis / modelo
teórico / especulación razonada / afirmación dudosa / desinformación — regla B), afirmaciones
señaladas con fragmento y motivo, nivel de confianza, **`sourcesConsulted: []` siempre**
(no se fingen consultas externas) y limitaciones.

**Punto de extensión (regla E)**: la variable exportada `externalVerifier` (hoy `null`) es el
lugar documentado para enchufar una API de IA o un cliente de fuentes científicas verificables
en una v2; la clave se pondría en una variable de entorno del servidor, nunca en el navegador.

## 5. Cómo funciona el detector antigroserías

`server/detectors/profanity.js`.

- Coincidencia por **palabra completa** (límites de palabra sobre texto normalizado, con
  plurales): «artículo», «computadora», «análisis», «sexto», «cálculo» o «penetración»
  **nunca** se bloquean por contener accidentalmente una secuencia parecida a una grosería.
- **Severidad alta** (obscenidades, insultos, acoso, ataques personales; ES + EN) → **rechazo**
  con explicación amable y sugerencia.
- **Severidad media** (vulgarismos o palabras ambiguas) → **revisión adicional**, no rechazo
  automático.
- Formas **ofuscadas** (l33t: `4`→a, `0`→o…; letras separadas: «p u t a») se detectan aparte
  y se tratan como ambiguas para evitar falsos positivos.
- Se aplica a título, resumen, explicación y fuentes al publicar, y también a cada
  **comentario** antes de hacerse visible.

## 6. Laboratorio de pruebas

Ruta `/laboratorio`: ejecuta ambos detectores sobre cualquier texto **sin guardar nada**
(endpoint `POST /api/lab/test`). Incluye 5 ejemplos precargados que demuestran:

1. Hipótesis original identificada como tal → **se aprueba**.
2. Afirmación falsa presentada como hecho → **se rechaza**.
3. Teoría válida con groserías → **se rechaza**.
4. Hipótesis sin pruebas declarada honestamente → **no se confunde con desinformación**.
5. Texto científico legítimo con «falsos amigos» → **se aprueba**.

## 7. Seguridad aplicada

- Validación de longitudes y categorías **en el servidor** (nunca solo en el navegador).
- Consultas SQL **parametrizadas** (sin concatenación).
- El texto se renderiza como texto (React escapa por defecto): **no hay HTML/JS inyectable**.
- Límite de tamaño del body (64 KB) y **rate-limiting** en escrituras (30 req/min por IP).
- Propiedad de borradores por **token de cliente** (UUID en `localStorage`, cabecera
  `x-client-token`): nadie puede editar ni ver borradores ajenos (probado: HTTP 403).
- Las publicaciones pendientes/rechazadas **no son accesibles públicamente** por API.
- Si un detector no concluye, **no se publica** (fallo hacia el lado seguro).
- Los resultados del detector se presentan como heurística limitada, **nunca como garantía
  absoluta de verdad científica**.

## 8. Pruebas realizadas (todas superadas)

| # | Prueba | Resultado |
|---|---|---|
| 1 | Compilación TypeScript + build de producción | ✔ sin errores |
| 2 | Hipótesis honesta vía API | ✔ `published`, clasificada «Hipótesis científica / especulación razonada» |
| 3 | «La Tierra es plana está demostrado…» | ✔ `rejected`; señala 5 fragmentos; **no visible** en portada ni por URL directa |
| 4 | Teoría con «imbécil / gilipollas» | ✔ `rejected` por el detector antigroserías |
| 5 | Hipótesis sin evidencia («universos burbuja») | ✔ `published`; no confundida con desinformación |
| 6 | Texto con «artículo», «computadora», «análisis», «sexto» | ✔ limpio, sin falsos positivos |
| 7 | Groserías en plural («imbéciles», «idiotas») | ✔ detectadas (soporte de plurales añadido tras la prueba) |
| 8 | Palabra ambigua («estúpidos») | ✔ `pending` (revisión), no rechazo automático ni publicación |
| 9 | Editar y reenviar una rechazada corregida | ✔ pasa a `published` con PUT sobre el mismo registro |
| 10 | Editar publicación ajena con otro token | ✔ HTTP 403 |
| 11 | Like / quitar like | ✔ alterna y persiste (1 → 0 → 1) |
| 12 | Comentario limpio / comentario grosero | ✔ 201 / rechazado con motivo |
| 13 | Buscador y filtro por categoría | ✔ resultados correctos |
| 14 | `/api/mine` muestra propias con su estado | ✔ published + rejected listadas |
| 15 | Verificación visual en navegador (portada, detalle, laboratorio) | ✔ diseño espacial, insignias e informes correctos |

## 9. Limitaciones conocidas (v1)

- **Detector de desinformación heurístico**: solo reconoce las afirmaciones falsas
  incorporadas en sus reglas; no verifica afirmaciones novedosas contra literatura real.
  Ante la duda envía a revisión en lugar de rechazar. No es una garantía de verdad.
- **Sin revisión humana real**: el estado «pendiente» queda guardado, pero aún no existe un
  panel de moderador para aprobarlo (siguiente iteración natural).
- **Sin cuentas de usuario**: la identidad es un token por navegador; sirve para proteger
  borradores, pero no sustituye a un sistema de autenticación.
- **Antigroserías basado en listas ES/EN**: no interpreta ironía; los casos ambiguos van a
  revisión por diseño.
- Las publicaciones ya aprobadas no se pueden editar en esta versión.
- Sin paginación (límites de 100–200 registros por consulta), suficiente para la v1.

## 10. Dependencias

- **Runtime**: `express` (API), `react`, `react-dom`, `react-router-dom`, `lucide-react`.
  Base de datos: `node:sqlite` (integrado en Node, sin instalar nada).
- **Desarrollo**: `vite`, `typescript`, `tailwindcss`, `@vitejs/plugin-react`, etc.
- Sin servicios externos ni claves API que configurar.
