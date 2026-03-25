# 📐 Arquitectura del Sistema - Invitación de Boda

## 📋 Resumen Ejecutivo

Este documento detalla la arquitectura del sistema de invitaciones de boda, diseñado y refactorizado con un enfoque en **Clean Architecture** y los principios **SOLID**. El objetivo es garantizar un sistema mantenible, escalable y fácil de probar.

## 🏗️ Arquitectura General

### Principios Clave

- **Clean Architecture**: Separación estricta de responsabilidades en capas (Dominio, Aplicación, Infraestructura, Presentación).
- **SOLID**: Diseño de software robusto y flexible.
- **Inyección de Dependencias (DI)**: Desacoplamiento de componentes para facilitar las pruebas y la mantenibilidad.
- **Domain-Driven Design (DDD)**: El diseño se centra en el modelo de negocio.
- **Monorepo**: El código del `frontend` y `backend` reside en un solo repositorio para simplificar la gestión.

### Estructura del Proyecto

```
invitacion-boda/
├── backend/                # Servidor Node.js/Express con Clean Architecture
│   ├── src/
│   │   ├── application/    # Casos de uso y lógica de aplicación
│   │   ├── core/           # Entidades y reglas de negocio
│   │   ├── infrastructure/ # Implementaciones externas (DB, APIs)
│   │   ├── presentation/   # Controladores, rutas y middleware
│   │   ├── shared/         # Utilidades y servicios compartidos
│   │   └── tests/          # Pruebas unitarias y de integración
│   ├── .env.example        # Archivo de ejemplo para variables de entorno
│   └── ...
├── frontend/               # Aplicaciones cliente
│   ├── invitation/         # SPA para invitados
│   ├── dashboard/          # Panel de administración
│   └── public/             # Archivos de configuración compartidos
│       └── config.js       # Configuración global del frontend
├── data/                   # Almacenamiento de datos (archivos CSV)
├── docs/                   # Documentación técnica
└── package.json            # Dependencias y scripts del proyecto
```

## 🎯 Backend - Clean Architecture

### Capa de Dominio (Core)

- **Responsabilidad**: Contiene la lógica de negocio más pura. No depende de ninguna otra capa.
- **Componentes**:
    - `entities`: Objetos de negocio (ej. `Invitation`, `Confirmation`).
    - `repositories`: Interfaces que definen cómo se accede a los datos (ej. `IInvitationRepository`).
    - `services`: Lógica de dominio que no pertenece a una entidad específica.

### Capa de Aplicación

- **Responsabilidad**: Orquesta los flujos de datos y ejecuta los casos de uso.
- **Componentes**:
    - `usecases`: Clases que encapsulan una funcionalidad específica (ej. `CreateInvitationUseCase`).
    - `dto`: Objetos de Transferencia de Datos para la comunicación entre capas.

### Capa de Infraestructura

- **Responsabilidad**: Implementa las interfaces definidas en el dominio utilizando tecnologías concretas.
- **Componentes**:
    - `repositories`: Implementaciones de los repositorios (ej. `CsvInvitationRepository`).
    - `services`: Servicios externos (ej. `CsvStorage`, `SseService`).
    - `middleware`: Middleware de seguridad y otros.

### Capa de Presentación

- **Responsabilidad**: Maneja las interacciones con el cliente (HTTP, WebSockets, etc.).
- **Componentes**:
    - `controllers`: Reciben las peticiones HTTP y llaman a los casos de uso.
    - `routes`: Definen las rutas de la API.
    - `serializers`: Formatean los datos de salida.

## 🎨 Frontend - Arquitectura Modular

El frontend también sigue una estructura organizada para separar responsabilidades:

```
frontend/invitation/js/
├── core/                   # Lógica de negocio del frontend
├── infrastructure/         # Comunicación con el backend y almacenamiento local
├── presentation/           # Componentes de UI y controladores de vista
├── shared/                 # Utilidades y código compartido
└── config/                 # Configuración e inyección de dependencias
```

## 🔧 Patrones de Diseño Implementados

- **Repositorio**: Abstrae el acceso a los datos.
- **Caso de Uso**: Encapsula la lógica de la aplicación.
- **Inyección de Dependencias**: Invierte el control para desacoplar componentes.
- **Fábrica**: Centraliza la creación de objetos complejos.
- **Observador**: Permite la comunicación desacoplada entre componentes.

## 🛡️ Seguridad

Se han implementado múltiples capas de seguridad:

1.  **Autenticación y Autorización**: JWT para sesiones seguras en el dashboard.
2.  **Validación de Entradas**: Validación y sanitización de todos los datos de entrada para prevenir XSS y otros ataques.
3.  **Protección CSRF**: Tokens anti-falsificación en todas las rutas que modifican datos.
4.  **Headers de Seguridad**: Uso de `helmet` para configurar headers HTTP seguros.
5.  **Limitación de Tasa**: Protección contra ataques de fuerza bruta.

## 🧪 Estrategia de Pruebas

- **Pruebas Unitarias**: Cobertura de las reglas de negocio y la lógica de la aplicación.
- **Pruebas de Integración**: Verificación de la correcta interacción entre las diferentes capas del sistema.
- **Pruebas E2E**: (Pendiente) Simulación de flujos de usuario completos.

## 🔮 Roadmap Técnico

### Mejoras Realizadas

- **Refactorización a Clean Architecture**: Completada.
- **Implementación de Seguridad Avanzada**: Completada (JWT, CSRF, Helmet).
- **Separación de Frontend y Backend**: Completada.

### Próximas Mejoras

1.  **Migración de Base de Datos**: Reemplazar el almacenamiento en CSV por una base de datos relacional (ej. PostgreSQL o SQLite).
2.  **Gestión de Configuración Dinámica**: Crear una sección en el dashboard para modificar `frontend/public/config.js` de forma visual.
3.  **Mejoras en el Dashboard**:
    - Refinar el filtrado y los popups.
    - Corregir el flujo de importación de CSV.
    - Mejorar los modales de creación y detalles de invitaciones.
4.  **Containerización**: Crear archivos `Dockerfile` para facilitar el despliegue.
5.  **CI/CD**: Implementar un pipeline de integración y despliegue continuo.

---

**Última actualización**: Marzo 2026
