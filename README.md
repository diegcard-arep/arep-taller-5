# CRUD de Propiedades (Spring Boot + React + MySQL)

Aplicación full-stack para administrar propiedades inmobiliarias con API REST en Spring Boot, base de datos MySQL y frontend en React usando Vite. Incluye paginación, filtros de búsqueda, validación del lado del cliente y manejo de errores.

## Arquitectura

- Backend: Spring Boot 3.3.x, Spring Web, Spring Data JPA, Bean Validation (Jakarta), MySQL Connector/J.
- Frontend: React 18 + Vite 5.
- Base de datos: MySQL 8.
- Contenedores: Docker y docker-compose para entorno local.
- Despliegue: EC2 para backend y RDS MySQL para base de datos (servidores separados en AWS).

Estructura del repo:

- `backend/`: API REST, JPA, Dockerfile.
- `frontend/`: SPA React (desarrollo con Vite; build se copia a `backend/src/main/resources/static`).
- `docker-compose.yml`: orquesta MySQL y la app para desarrollo local.

## API (resumen)

Base path: `/api/properties`

- POST `/` crea una propiedad
- GET `/` lista paginada con filtros (address, minPrice, maxPrice, minSize, maxSize, pageable)
- GET `/{id}` obtiene por id
- PUT `/{id}` actualiza por id
- DELETE `/{id}` elimina por id

Respuestas de validación devuelven errores por campo; errores no manejados devuelven 500 con mensaje.

## Modelo de datos (tabla `properties`)

- id (BIGINT, PK, autoincrement)
- address (VARCHAR 255, NOT NULL)
- price (DECIMAL(15,2), NOT NULL)
- size (INT, NOT NULL)
- description (TEXT)

Índices en `address`, `price`, `size` (ver `backend/src/main/resources/schema.sql`).

## Desarrollo local

Requisitos: Java 17, Maven, Node 18+, Docker Desktop.

1. Backend (arranque directo)

- Configurar variables (si no usas docker-compose):
  - `SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/properties?createDatabaseIfNotExist=true&serverTimezone=UTC`
  - `SPRING_DATASOURCE_USERNAME=root`
  - `SPRING_DATASOURCE_PASSWORD=yourpass`
- En la carpeta `backend/`, compilar y arrancar con tu IDE o Maven.

1. Frontend (dev server)

- En `frontend/`:
  - `npm install`
  - `npm run dev`
- El proxy de Vite redirige `/api` a `http://localhost:8080`.

1. Local con Docker Compose (recomendado)

- En la raíz del repo:
  - `docker compose up --build`
- Levanta MySQL y la app en 8080. El frontend en producción se sirve desde Spring en `/`.

## Build de producción del frontend

- En `frontend/` ejecutar `npm run build`.
- Copia los assets a `backend/src/main/resources/static`.
- Empaquetar backend con Maven y ejecutar el JAR resultante.

## Despliegue en AWS (servidores separados)

1. Base de datos (RDS MySQL)

- Crear instancia RDS MySQL 8.
- Habilitar acceso desde el SG del backend (puerto 3306).
- Anotar endpoint, usuario y contraseña.

1. Backend (EC2)

- Crear instancia EC2 (Amazon Linux 2 o Ubuntu) con SG que permita 80/8080 desde Internet.
- Instalar Docker y docker-compose.
- Construir imagen y ejecutar contenedor pasando variables de entorno:
  - `SPRING_DATASOURCE_URL=jdbc:mysql://<rds-endpoint>:3306/properties?createDatabaseIfNotExist=true&serverTimezone=UTC`
  - `SPRING_DATASOURCE_USERNAME=<user>`
  - `SPRING_DATASOURCE_PASSWORD=<pass>`

1. Variables y seguridad

- Asegurar reglas SG: EC2 expone 80/8080 (HTTP); RDS sólo acepta desde SG/privado del backend.
- Considerar TLS con ALB/Cert Manager.

## Notas

- Paginación y filtros implementados en el servicio usando Specifications.
- Validación de formulario en el cliente y manejo de errores con mensajes amigables.
- Sin Lombok para evitar dependencias en annotation processors.

## Próximos pasos (opcionales)

- Añadir pruebas con H2.
- Pipeline CI/CD (GitHub Actions) para build y despliegue.
- Capturas de pantalla y video de la app funcionando y del despliegue.


Video de implementacion: https://youtu.be/6f4BoBsoFVM