# PRD implementation checklist

This is an implementation-oriented checklist, not a claim that every enterprise NFR has been load-tested.

| PRD area | Baseline status | Evidence in package |
|---|---|---|
| FR-01 six configured sources | Implemented | URLhaus, ThreatFox, Feodo, MalwareBazaar, OTX, CISA KEV |
| FR-02 normalization | Implemented | provider/base + indicator normalization services |
| FR-03 deduplication/provenance | Implemented | indicator/source models and services |
| FR-04 TAXII 2.1 | Enhancement | Add a TAXII client/collection adapter for full Should-level compliance |
| FR-05 feed UI management | Implemented | feeds API + UI |
| FR-06 IOC lifecycle | Implemented | indicator CRUD, TTL and status |
| FR-07 tags/TLP/ATT&CK/notes | Implemented | indicator fields + UI |
| FR-08 TTL expiry | Implemented | maintenance service |
| FR-09 relationships | Implemented | relationship API/UI |
| FR-10/11/12 enrichment | Implemented | IP, DNS/domain, hash/provider services |
| FR-13 scoring | Implemented | scoring service + tests |
| FR-14 geo/ASN | Implemented | enrichment/provider data path |
| FR-16 correlation | Implemented | correlation/security-event services |
| FR-17 alert rules | Implemented | alert-rule API/service/UI |
| FR-18 alert lifecycle | Implemented | alert API/service/UI |
| FR-19 incident timeline | Implemented | incident timeline service/UI |
| FR-20 heatmap | Implemented | dashboard analytics/UI |
| FR-21 trend charts | Implemented | dashboard analytics/UI |
| FR-22 custom dashboards | Implemented | saved dashboard layout |
| FR-23 PDF reports | Implemented | report API/UI |
| FR-24 STIX/CSV export | Implemented | export API/UI |
| FR-25 search | Implemented | Elasticsearch + fallback search |
| FR-26 RBAC | Implemented | AuthMiddleware + authorization rules |
| FR-27 audit | Implemented | audit middleware/service |
| FR-28 authenticated REST/WebSocket | Implemented | JWT middleware + WebSocket token validation |
| FR-29 inbound integrations | Implemented baseline | authenticated webhook security-event endpoint |
| NFR-02 realtime <5s | Architecture implemented; benchmark required | Redis realtime bus + WebSocket |
| NFR-03 50k/hour + 200 users | Architecture target; benchmark required | stateless API + worker + Redis |
| NFR-05 search p95 | Architecture target; benchmark required | Elasticsearch |
| NFR-08 80% coverage | Test foundation added; coverage benchmark required | pytest + CI |
| NFR-11 Docker portability | Implemented baseline | Dockerfiles + full compose |

## Remaining PRD enhancement

TAXII 2.1 ingestion is marked `Should` by the PRD. The baseline already supports multiple public feeds and STIX export; a dedicated TAXII client is the next standards-integration enhancement.
