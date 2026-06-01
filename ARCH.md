# Architecture — MCP Server for Groupon.es Deal Intelligence

## 1. Vista general del sistema

```mermaid
graph TB
    subgraph Clients["MCP Clients"]
        CC[Claude Desktop]
        CU[Cursor]
        ANY[Any MCP Client]
    end

    subgraph MCP["MCP Server (stdio)"]
        TL[Tool Layer]
        SL[Service Layer]
        CL[Cache Layer]
    end

    subgraph External["External"]
        GQL[groupon.es/mobilenextapi/graphql]
    end

    Clients -->|"MCP Protocol (stdio)"| TL
    TL --> SL
    SL --> CL
    CL -->|"Cache miss"| GQL
    GQL -->|"JSON response"| CL
```

---

## 2. Tool Layer — qué expone el servidor

```mermaid
graph LR
    subgraph Tools["MCP Tools"]
        T1["🔍 search_deals\n(division, query?, category_guid?, min_discount?, max_price?, limit?)"]
        T2["💎 get_best_value_deals\n(division, min_rating?, max_price?, limit?)"]
        T3["⏰ get_expiring_deals\n(division, hours?, limit?)"]
        T4["📊 get_deal_stats\n(division)"]
        T5["⚖️ compare_deals\n(deal_ids[], division)"]
        T6["🔗 get_deal_by_url\n(url)"]
    end
```

> **Limitación conocida de `search_deals`**: el filtrado por `query` opera sobre título y nombre de comerciante post-fetch. Búsquedas semánticas abiertas ("restaurantes románticos") pueden tener baja cobertura. Para mayor precisión usar `category_guid`.

---

## 3. Flujo de datos completo

```mermaid
sequenceDiagram
    participant Client as MCP Client
    participant Server as MCP Server
    participant Cache as TTL Cache (15min)
    participant API as groupon.es GraphQL

    Client->>Server: search_deals({division: "madrid", query: "spa"})
    Server->>Cache: get("madrid")
    
    alt Cache miss
        Cache-->>Server: null
        Server->>API: POST /mobilenextapi/graphql\n{getHomepageV2DealFeed, offset:0}
        API-->>Server: {cards: [...18 deals], pagination: {nextOffset: 18, feedToken: "..."}}
        Server->>API: POST /mobilenextapi/graphql\n{offset:18, feedToken: "..."}
        API-->>Server: {cards: [...18 deals], pagination: {nextOffset: 36}}
        Note over Server,API: Repite hasta tener suficientes deals
        Server->>Cache: set("madrid", deals[], TTL=30min*)\n*10min si hay flash sales activos
    else Cache hit
        Cache-->>Server: deals[]
    end
    
    Server->>Server: filter by "spa" in title/merchant
    Server->>Server: format as readable text
    Server-->>Client: "Found 8 spa deals in Madrid:\n1. Bienestar Chic - Masaje relajante..."
```

---

## 4. Estructura interna del servidor

```mermaid
graph TB
    subgraph Entry["src/index.ts"]
        S[MCP Server\nstdio transport]
    end

    subgraph Tools["src/tools/"]
        T1[search.ts]
        T2[bestValue.ts]
        T3[expiring.ts]
        T4[stats.ts]
        T5[compare.ts]
        T6[dealByUrl.ts]
    end

    subgraph Groupon["src/groupon/"]
        C[client.ts\nHTTP + pagination]
        P[parser.ts\nnormalize prices\nextract metadata]
        TY[types.ts\nTypeScript interfaces]
    end

    subgraph Infra["src/"]
        CA[cache.ts\nMap + TTL]
    end

    S --> T1 & T2 & T3 & T4 & T5 & T6
    T1 & T2 & T3 & T4 & T5 & T6 --> C
    C --> CA
    C --> P
    P --> TY
```

---

## 5. Modelo de datos normalizado

```mermaid
erDiagram
    Deal {
        string id
        string uuid
        string title
        string url
        string merchantName
        float  priceEuros
        float  originalPriceEuros
        int    discountPct
        float  ratingValue
        int    ratingCount
        string categoryGuid
        string locationAddress
        string locationName
        float  locationLat
        float  locationLng
    }

    Deal ||--o| Promotion : has
    Deal ||--o| FlashSale : has
    Deal ||--o{ Badge : has

    Promotion {
        string promoCode
        string expiresAt
        float  promoPrice
    }

    FlashSale {
        string startsAt
        string endsAt
        float  salePrice
        bool   isActive
    }

    Badge {
        string type
        string displayText
    }
```

---

## 6. Estrategia de paginación

```mermaid
flowchart TD
    A[Request: search_deals\ndivision='madrid'] --> B{Cache hit?}
    B -->|Yes| G[Filter & return]
    B -->|No| C[Fetch page 1\noffset=0, limit=18]
    C --> D{¿Tenemos suficientes deals\no llegamos al final?}
    D -->|No| E[Fetch next page\noffset=nextOffset\nfeedToken=token]
    E --> D
    D -->|Sí| F[Store in cache\nTTL=15min]
    F --> G
```

> **Nota sobre paginación**: Para `search_deals` con keyword se fetchan hasta 5 páginas (90 deals) para tener cobertura suficiente antes de filtrar. Para `get_deal_stats` se puede ir a más. Cada tool controla su propio límite de páginas.

---

## 7. Headers de la API

```mermaid
graph LR
    subgraph Required["Headers requeridos"]
        H1["content-type: application/json"]
        H2["apollographql-client-name: MBNXT Web: Pages Router"]
        H3["x-mbnxt-gql-source: client"]
        H4["cookie: division=CITY; user_locale=es_ES"]
    end
    subgraph Optional["Headers opcionales (para no ser bloqueados)"]
        H5["user-agent: Chrome/148..."]
        H6["origin: https://www.groupon.es"]
        H7["referer: https://www.groupon.es/"]
    end
```

---

## 8. Decisiones de diseño

| Pregunta | Decisión | Razón |
|----------|----------|-------|
| ¿Transport? | `stdio` | Estándar MCP para servidores locales; HTTP+SSE sería over-engineering para este scope |
| ¿Divisions hardcodeadas o dinámicas? | Lista fija de ~12 ciudades ES como enum validado | Evita llamadas de discovery; el conjunto de ciudades de Groupon.es es estable |
| ¿Cuántos deals por defecto? | 3 páginas (54 deals) | Balance entre cobertura y latencia; configurable por tool |
| ¿Tool de geolocalización? | Fuera de scope v1 | Extensión natural: `get_nearby_deals(lat, lng)` una vez se tenga el endpoint correcto |
| ¿TTL de cache? | 30min base; 10min si hay flash sales activos en el lote | Flash sales cambian estado en horas, pero re-fetchear cada 15min es innecesario sin sales activos |

### Divisions soportadas (v1)

```typescript
const DIVISIONS = [
  "madrid", "barcelona", "valencia", "sevilla", "bilbao",
  "malaga", "zaragoza", "murcia", "palma", "alicante",
  "valladolid", "granada"
] as const;

type Division = typeof DIVISIONS[number];
```

### Extensiones naturales (post-v1)
- `get_nearby_deals(lat, lng, radius_km)` — geolocalización real
- Transport HTTP+SSE para uso remoto / multi-cliente
- Búsqueda semántica con embeddings sobre el corpus de deals cacheado
