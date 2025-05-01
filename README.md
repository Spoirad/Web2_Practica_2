# 📦 Digitalización de Albaranes

Aplicación backend RESTful para la gestión de usuarios, clientes, proyectos y albaranes, con autenticación JWT, almacenamiento de firma en IPFS y generación de PDFs.

## 🚀 Tecnologías utilizadas

- Node.js + Express
- MongoDB (Mongoose)
- JWT (JsonWebToken)
- Multer (para uploads)
- Pinata + IPFS (almacenamiento de imágenes/firma/logo)
- Jest + Supertest (testing)
- Swagger UI (documentación)
- Slack Webhook (registro de errores 5XX)

## 📁 Estructura del proyecto

```
├── config/
├── controllers/
├── docs/           # Swagger YAMLs
├── middleware/
├── models/
├── routes/
├── tests/
├── utils/
├── validators/
├── .env
├── .gitignore
├── app.js
├── index.http     # Testing
├── package-lock.json
├── package.json
├── swagger.js

```

## 🔐 Autenticación

- Registro y login con JWT
- Validación de email con código aleatorio
- Protección de rutas con middleware `authMiddleware`

## ✏️ Endpoints principales

### 👤 User

- `POST /user/register` – Registro
- `POST /user/login` – Login
- `PUT /user/validation` – Validación de email con código
- `PUT /user/register` – Datos personales (nombre, apellidos, NIF)
- `PATCH /user/company` – Información de empresa
- `PATCH /user/logo` – Subida de logo a IPFS
- `GET /user` – Perfil del usuario
- `DELETE /user?soft=true|false` – Borrado soft/hard

### 🧾 Client

- `POST /client` – Crear cliente
- `GET /client` – Listado de clientes (usuario/empresa)
- `GET /client/:id` – Obtener cliente
- `PATCH /client/:id` – Actualizar cliente
- `DELETE /client/:id?soft=true|false` – Soft/hard delete
- `GET /client/archived` – Listado archivados
- `PATCH /client/:id/restore` – Restaurar cliente

### 🏗 Project

- `POST /project` – Crear proyecto
- `GET /project` – Obtener proyectos activos
- `GET /project/:id` – Obtener proyecto específico
- `PATCH /project/:id` – Actualizar
- `DELETE /project/:id` – Borrar soft/hard
- `PATCH /project/:id/restore` – Restaurar
- `GET /project/archived` – Proyectos archivados

### 📄 DeliveryNote

- `POST /deliverynote` – Crear albarán
- `GET /deliverynote` – Obtener albaranes
- `GET /deliverynote/:id` – Albarán por ID
- `DELETE /deliverynote/:id` – Borrar albarán (solo si no firmado)
- `PATCH /deliverynote/:id/signature` – Firmar y subir a IPFS
- `GET /deliverynote/pdf/:id` – Generar PDF del albarán

## ✅ Testing

Los tests están implementados con Jest + Supertest y cubren:

- Flujo completo de cada endpoint
- Casos de error: validaciones, permisos, IDs inválidos, etc.
- Generación de PDFs, subida de imágenes, borrado soft/hard
- Uso de base de datos `test_practica`

```bash
npm test
```

## 🔒 Manejo de errores

- Todos los errores 4XX/5XX son gestionados por `handleHttpError`
- Los errores 5XX se notifican por webhook en un canal de Slack

## 📄 Documentación Swagger

Disponible en `/api-docs` (configurada con Swagger UI + YAMLs en `docs/`)

## ⚙️ Configuración `.env`

```env
PORT=3000
DB_URI=
DB_URI_TEST=
PUBLIC_URL=http://localhost:3000/
PINATA_GATEWAY_URL=
PINATA_KEY=
PINATA_SECRET=
API_KEY=
JWT_SECRET=
SLACK_WEBHOOK_URL=
```

## ✨ Autor

Ángel López Paparella
