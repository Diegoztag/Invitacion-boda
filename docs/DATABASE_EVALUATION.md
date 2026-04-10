# Evaluación de Migración de Base de Datos

Este documento presenta un análisis de las opciones disponibles para migrar el almacenamiento actual basado en archivos CSV a un sistema de base de datos más robusto, como parte de las mejoras de rendimiento y escalabilidad (Ciclo 32).

## Estado Actual

Actualmente, la aplicación utiliza archivos CSV (`invitations.csv` y `confirmations.csv`) para almacenar los datos.

**Limitaciones del enfoque actual:**

- **Concurrencia:** Problemas potenciales al escribir simultáneamente desde múltiples peticiones.
- **Rendimiento:** Las búsquedas, filtrados y paginación requieren cargar todo el archivo en memoria o leerlo secuencialmente.
- **Integridad de Datos:** Falta de restricciones a nivel de base de datos (claves foráneas, unicidad estricta).
- **Escalabilidad:** No es viable para un gran volumen de datos o alto tráfico.

## Opciones Evaluadas

### 1. Bases de Datos Relacionales (SQL)

Dado que la estructura de datos de invitaciones y confirmaciones es altamente estructurada y relacional (una invitación tiene múltiples confirmaciones asociadas), las bases de datos SQL son una opción natural.

#### A. SQLite

- **Pros:**
    - No requiere servidor (serverless), los datos se guardan en un archivo local (`.sqlite`).
    - Configuración casi nula, ideal para proyectos pequeños o medianos.
    - Soporta transacciones ACID completas.
    - Excelente rendimiento para lecturas.
- **Contras:**
    - Concurrencia de escritura limitada (bloquea la base de datos entera durante las escrituras).
    - No es ideal si la aplicación se despliega en múltiples instancias (escalado horizontal).

#### B. PostgreSQL

- **Pros:**
    - Extremadamente robusto, escalable y con excelente soporte para concurrencia.
    - Soporte avanzado para tipos de datos (JSONB, arrays).
    - Ideal para escalado horizontal y despliegues en la nube.
- **Contras:**
    - Requiere infraestructura adicional (servidor de base de datos).
    - Mayor complejidad de configuración y mantenimiento.

### 2. Bases de Datos NoSQL

#### A. MongoDB

- **Pros:**
    - Esquema flexible, permite guardar la invitación y sus confirmaciones en un solo documento.
    - Fácil escalado horizontal.
- **Contras:**
    - Puede ser excesivo para la estructura de datos actual, que es bastante relacional y predecible.
    - Requiere infraestructura adicional.

## Recomendación

Para el contexto de una aplicación de invitaciones de boda, donde el volumen de datos es predecible y relativamente pequeño (cientos de invitaciones, no millones), y la carga de escritura no es masivamente concurrente, la recomendación se divide en dos fases:

### Fase 1: Migración a SQLite (Corto Plazo)

**Recomendado.** SQLite resolverá inmediatamente los problemas de concurrencia de archivos, mejorará drásticamente el rendimiento de las consultas (paginación, filtrado) y proporcionará integridad de datos mediante claves foráneas, sin añadir la complejidad de gestionar un servidor de base de datos separado. Es el paso evolutivo más lógico desde CSV.

### Fase 2: Migración a PostgreSQL (Largo Plazo / Si es necesario)

Si la aplicación evoluciona hacia un modelo SaaS (Software as a Service) multi-inquilino (múltiples bodas en la misma plataforma) o requiere despliegue en múltiples instancias (ej. Kubernetes, AWS ECS), se debería migrar a PostgreSQL. El uso de un ORM (como Prisma o Sequelize) o un Query Builder (como Knex.js) durante la Fase 1 facilitaría enormemente esta transición futura.

## Próximos Pasos (Fase 1 del Roadmap Técnico)

1. **Seleccionar un ORM/Query Builder:** Se recomienda evaluar Prisma o Knex.js para abstraer las consultas SQL.
2. **Diseñar el Esquema:** Crear las tablas `invitations` y `confirmations` con sus respectivas relaciones.
3. **Implementar Repositorios:** Crear `SqlInvitationRepository` y `SqlConfirmationRepository` que implementen las interfaces existentes.
4. **Script de Migración:** Desarrollar un script Node.js que lea los CSV actuales y los inserte en la nueva base de datos SQLite.
