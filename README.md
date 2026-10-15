# Rodalia · control de asistencia

Aplicación multiplataforma para registrar la asistencia del personal administrativo de una empresa de transporte suburbano. El cliente está hecho con React Native y Expo; Expo Web publica la experiencia adaptable para navegador. La API usa Node.js en funciones de Vercel y PostgreSQL.

## Funciones

- Resumen diario de personal, asistencias a tiempo, retardos y registros pendientes.
- Búsqueda y filtros por estado; registro de entrada y salida.
- Alta de colaboradores y exportación CSV.
- API con autenticación administrativa JWT y base de datos PostgreSQL.
- Datos de demostración visibles en el cliente hasta conectar la base de datos.

## Desarrollo

Requisitos: Node.js 20 o posterior y una base PostgreSQL.

```bash
npm install
npm run dev       # Expo Web
npm start         # Metro para iOS/Android
```

Configura las variables de `.env.example` en `.env.local` y ejecuta `npm run db:migrate` para crear las tablas y cargar seis colaboradores de ejemplo. Cambia la contraseña de administrador por una clave privada y genera `JWT_SECRET` con al menos 32 caracteres aleatorios. La hora límite para marcar retardo está configurada a las 08:15 (zona America/Mexico_City). Para un cliente nativo publicado fuera del dominio web, define `EXPO_PUBLIC_API_URL` como el origen de la API, sin la ruta `/api`.

## API

- `GET /api/health`
- `POST /api/auth/login` — obtiene un token JWT de 12 horas.
- `GET /api/attendance?date=AAAA-MM-DD` — lista personal activo y asistencia diaria.
- `POST /api/attendance/check-in` y `/api/attendance/check-out` — registra entrada o salida.
- `GET /api/employees` y `POST /api/employees` — consulta y alta de colaboradores.

Todas las rutas de datos requieren `Authorization: Bearer <token>`. Configura `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` y `JWT_SECRET` tanto en Vercel como en el entorno local. Para desplegar, importa el repositorio en Vercel, define esas variables y ejecuta la migración en PostgreSQL antes de iniciar sesión. El paquete web se genera con `npm run build` en `dist`; Expo/EAS puede generar los clientes nativos con `npx expo run:android` o `npx expo run:ios`.

El proyecto **no incluye datos personales reales**. La información de demostración es ficticia y se muestra solo en el cliente desconectado.
