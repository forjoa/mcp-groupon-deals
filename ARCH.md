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
        T1["🔍 search_deals\n(division, query?, min_discount?, max_price?, limit?)"]
        T2["💎 get_best_value_deals\n(division, min_rating?, max_price?, limit?)"]
        T3["⏰ get_expiring_deals\n(division, hours?, limit?)"]
        T4["📊 get_deal_stats\n(division)"]
        T5["⚖️ compare_deals\n(deal_ids[], division)"]
    end
```

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
        Server->>Cache: set("madrid", deals[], TTL=15min)
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
    end

    subgraph Groupon["src/groupon/"]
        C[client.ts\nHTTP + pagination]
        P[parser.ts\nnormalize prices\nextract metadata]
        TY[types.ts\nTypeScript interfaces]
    end

    subgraph Infra["src/"]
        CA[cache.ts\nMap + TTL]
    end

    S --> T1 & T2 & T3 & T4 & T5
    T1 & T2 & T3 & T4 & T5 --> C
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

## 8. Decisiones de diseño abiertas

| Pregunta | Opciones | Decisión |
|----------|----------|----------|
| ¿Divisions hardcodeadas o dinámicas? | Lista fija de ciudades ES / descubrir en runtime | TBD |
| ¿Cuántos deals por defecto? | 1 página (18) / 5 páginas (90) / más | TBD |
| ¿Transport? | stdio (local) / HTTP+SSE (remoto) | TBD |
| ¿Tool de geolocalización? | `get_nearby_deals(lat, lng)` | TBD |
