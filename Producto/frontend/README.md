# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

---

## 🟢 Estado actual y pruebas de login (Abril 2026)

### ✅ Login funcional y validaciones
- Formulario de login completamente funcional con validación de email y contraseña.
- Mensajes de error claros y accesibles.
- Indicador visual de éxito y redirección automática al dashboard tras login correcto.
- Solo permite acceso a usuarios realmente registrados en la base de datos.

### 🎨 Diseño moderno y accesible
- Fondo con gradiente azul, rojo y verde (colores representativos del espectro autista).
- Glassmorphism en el formulario (fondo semitransparente, blur, sombra y esquinas redondeadas).
- Botón principal azul, tipografía amigable, iconos y feedback visual.
- Adaptado para desktop y notebook.

### 👤 Usuarios de prueba
Puedes iniciar sesión con cualquiera de estos usuarios (si existen en la base de datos):

- **Administrador Colegio**
  - Email: admin.colegio@tealink.com
  - Contraseña: AdminColegio123!
- **Familia**
  - Email: familia@tealink.com
  - Contraseña: Familia123!
- **Educador**
  - Email: educador2@tealink.com
  - Contraseña: Educador123!
- **Profesional**
  - Email: profesional@tealink.com
  - Contraseña: Profesional123!
- **Médico**
  - Email: medico@tealink.com
  - Contraseña: Medico123!

> Si algún usuario no existe, crear en la base de datos con contraseña hasheada (bcrypt).

### ⏭️ Próximos pasos
- Proteger rutas privadas del frontend (dashboard, etc.)
- Dashboard personalizado según rol
- Cierre de sesión (logout)
- Registro y recuperación de contraseña (si aplica)
- Mejoras visuales y accesibilidad

---
