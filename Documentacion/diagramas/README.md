# Diagramas — TEA Link

Diagramas de arquitectura y base de datos. Fuente: **PlantUML** (`.puml`); exportar a PNG para informes.

| Archivo | Descripción |
|---------|-------------|
| `flujo-datos-arquitectura.puml` / `.png` | Flujo 3 capas al **crear una observación** (React → Express → PostgreSQL) |
| `modelo-er-base-datos.puml` / `.png` | **Modelo entidad-relación** (11 tablas, 3FN) — alineado a `schema.prisma` |

## Regenerar PNG

Opción A — descargar PlantUML una vez y generar (requiere Java):

```bash
cd Documentacion/diagramas
# Descargar plantuml.jar desde https://plantuml.com/download (solo la primera vez)
java -jar plantuml.jar -tpng flujo-datos-arquitectura.puml modelo-er-base-datos.puml
```

Opción B — extensión **PlantUML** en VS Code/Cursor (vista previa y export).

> **Nota (Jun 2026):** el `.puml` incluye **11 tablas** (RUT, consentimiento, colaboración, `auditoria_observacion`). El PNG se regenera con `plantuml.jar` en esta carpeta.

## Referencias

- Esquema Prisma: `Producto/backend/prisma/schema.prisma`
- Informe técnico BD: `Documentacion/INFORME-TECNICO-BASE-DATOS.md`
- Informe final: `Documentacion/INFORME-FINAL-TEA-LINK.md`
