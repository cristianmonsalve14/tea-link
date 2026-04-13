# DISEÑO UI/UX - TEA LINK
## Sistema de Comunicación y Seguimiento para Personas con TEA

---

**Fecha de Creación:** 13 de abril de 2026  
**Versión:** 1.0  
**Estado:** Definido - Pendiente de implementación

---

## 🎨 PALETA DE COLORES

### Principios de Diseño para TEA
- ✅ Colores suaves y calmados (no estridentes)
- ✅ Alto contraste para facilitar lectura
- ✅ Evitar rojos/naranjas brillantes (pueden causar ansiedad)
- ✅ Preferir azules, verdes, grises suaves

### Paleta Definida

#### Colores Primarios
```
Primario (Acciones principales, botones, enlaces):
#4A90E2 (Azul calmado)
RGB: 74, 144, 226
```

#### Colores Secundarios
```
Secundario (Confirmaciones, éxitos):
#7ED321 (Verde suave)
RGB: 126, 211, 33
```

#### Colores Neutros
```
Blanco (Fondo principal):
#FFFFFF
RGB: 255, 255, 255

Gris Oscuro (Textos):
#333333
RGB: 51, 51, 51

Gris Claro (Fondos alternos, tarjetas):
#F5F7FA
RGB: 245, 247, 250
```

#### Colores de Estado
```
Advertencia:
#F5A623 (Naranja suave)
RGB: 245, 166, 35

Error:
#D0021B (Rojo suave)
RGB: 208, 2, 27
```

---

## 📐 WIREFRAMES

### 1. Pantalla de Login

**Objetivo:** Permitir acceso seguro al sistema

**Elementos:**
- Logo centrado y visible
- Campo de email (input tipo email)
- Campo de contraseña (input tipo password)
- Botón "Iniciar Sesión" (primario, destacado)
- Enlace "¿No tienes cuenta? Regístrate"
- Espaciado generoso entre elementos

**Diseño:**
```
┌─────────────────────────────────────────────┐
│                                             │
│              [LOGO TEA LINK]                │
│                                             │
│    Sistema de Comunicación para TEA         │
│                                             │
│         ┌─────────────────────┐            │
│         │ Email               │            │
│         └─────────────────────┘            │
│                                             │
│         ┌─────────────────────┐            │
│         │ Contraseña          │            │
│         └─────────────────────┘            │
│                                             │
│         [  Iniciar Sesión  ]               │
│                                             │
│         ¿No tienes cuenta? Regístrate      │
│                                             │
└─────────────────────────────────────────────┘
```

---

### 2. Dashboard Principal

**Objetivo:** Vista general de actividad y acceso rápido a funciones

**Elementos:**
- Barra de navegación superior con menú hamburguesa
- Saludo personalizado al usuario
- 3 tarjetas con métricas (Total Observaciones, Nuevas, Perfiles)
- Lista de observaciones recientes (últimas 5)
- Botón flotante/destacado "Nueva Observación"

**Diseño:**
```
┌──────────────────────────────────────────────────────────┐
│  [☰ Menú]  TEA LINK         [👤 Usuario]  [🔔] [Salir]  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Bienvenido, [Nombre Usuario]                            │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ 📊 Total     │  │ 📝 Nuevas    │  │ 👥 Perfiles  │  │
│  │              │  │              │  │              │  │
│  │     45       │  │      8       │  │      12      │  │
│  │ Observaciones│  │  Esta Semana │  │  Activos     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
│  Observaciones Recientes                                 │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 12 Abr - Juan Pérez - Conducta                     │ │
│  │ "Mostró mejora en interacción social..."          │ │
│  │ [Ver detalles]                                     │ │
│  ├────────────────────────────────────────────────────┤ │
│  │ 11 Abr - María González - Comunicación            │ │
│  │ "Usó 3 palabras nuevas hoy..."                    │ │
│  │ [Ver detalles]                                     │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  [+ Nueva Observación]                                   │
└──────────────────────────────────────────────────────────┘
```

---

### 3. Lista de Observaciones

**Objetivo:** Visualizar, filtrar y gestionar observaciones

**Elementos:**
- Filtros accesibles (Categoría, Fecha, Autor)
- Buscador de texto libre
- Tarjetas de observación con información resumida
- Acciones rápidas por tarjeta (Ver/Editar/Agregar a Reporte)
- Paginación

**Diseño:**
```
┌──────────────────────────────────────────────────────────┐
│  [☰]  Observaciones                        [👤] [🔔]     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Filtrar por:                                            │
│  [Todas ▼] [Categoría ▼] [Fecha ▼] [Autor ▼]  [🔍]     │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 📅 13 Abr 2026 | 👤 Cristian | 🏷️ Conducta        │ │
│  │                                                    │ │
│  │ Perfil: Juan Pérez (8 años)                       │ │
│  │                                                    │ │
│  │ "Hoy Juan mostró gran avance en su capacidad      │ │
│  │  de compartir juguetes con compañeros..."         │ │
│  │                                                    │ │
│  │ [👁️ Ver] [✏️ Editar] [📊 Agregar a Reporte]       │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  [← Anterior]  Página 1 de 5  [Siguiente →]            │
└──────────────────────────────────────────────────────────┘
```

---

### 4. Formulario Nueva Observación

**Objetivo:** Registrar nueva observación de forma clara y validada

**Elementos:**
- Campos obligatorios marcados con asterisco (*)
- Selector de perfil (dropdown)
- Categorías en radio buttons
- Date picker para fecha
- Textarea con contador de caracteres (min 50, max 500)
- Radio buttons para formato (Texto/Audio/Video)
- Botones Cancelar y Guardar

**Diseño:**
```
┌──────────────────────────────────────────────────────────┐
│  [←]  Nueva Observación                                  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Perfil del Estudiante *                                 │
│  [Seleccionar perfil ▼]                                  │
│                                                          │
│  Categoría *                                             │
│  [○ Conducta  ○ Comunicación  ○ Social  ○ Académico]    │
│                                                          │
│  Fecha del Evento *                                      │
│  [13/04/2026] [📅]                                       │
│                                                          │
│  Descripción de la Observación *                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │                                                  │   │
│  │  (Mínimo 50 caracteres)                         │   │
│  │                                                  │   │
│  │                                                  │   │
│  └──────────────────────────────────────────────────┘   │
│  0/500 caracteres                                        │
│                                                          │
│  Formato                                                 │
│  [○ Texto  ○ Audio  ○ Video]                            │
│                                                          │
│  [ Cancelar ]              [ Guardar Observación ]      │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

### 5. Perfil de Usuario

**Objetivo:** Visualizar información personal y estadísticas

**Elementos:**
- Avatar/foto (placeholder)
- Información personal (nombre, email, rol, fecha registro)
- Estadísticas personales (observaciones, reportes, perfiles)
- Botones de acción (Editar Perfil, Cambiar Contraseña)

**Diseño:**
```
┌──────────────────────────────────────────────────────────┐
│  [←]  Mi Perfil                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│            [👤]                                          │
│         [Nombre Usuario]                                 │
│         [Rol]                                            │
│                                                          │
│  Información Personal                                    │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Nombre Completo: [Nombre completo]                │ │
│  │ Email: [email@ejemplo.cl]                         │ │
│  │ Rol: [Familia/Educador/Profesional]              │ │
│  │ Fecha de Registro: [DD/MM/YYYY]                   │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  Estadísticas                                            │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Observaciones registradas: [N]                    │ │
│  │ Reportes generados: [N]                           │ │
│  │ Perfiles bajo mi seguimiento: [N]                 │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  [ Editar Perfil ]  [ Cambiar Contraseña ]              │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

### 6. Generación de Reportes

**Objetivo:** Crear reportes personalizados con observaciones seleccionadas

**Elementos:**
- Selector de perfil
- Selección de rango de fechas (desde/hasta)
- Checkboxes para filtrar por categorías
- Lista de observaciones con checkboxes de selección
- Radio buttons para formato (PDF/Excel)
- Botones Cancelar y Generar

**Diseño:**
```
┌──────────────────────────────────────────────────────────┐
│  [←]  Generar Reporte                                    │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Paso 1: Seleccionar Perfil                              │
│  [Seleccionar perfil ▼]                                  │
│                                                          │
│  Paso 2: Rango de Fechas                                 │
│  Desde: [DD/MM/YYYY 📅]  Hasta: [DD/MM/YYYY 📅]         │
│                                                          │
│  Paso 3: Filtrar por Categorías (opcional)               │
│  [✓ Conducta] [✓ Comunicación] [✓ Social] [ ] Académico │
│                                                          │
│  Observaciones encontradas: [N]                          │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ ☑ 13 Abr - "Mostró mejora en interacción..."     │ │
│  │ ☑ 12 Abr - "Utilizó 3 palabras nuevas..."        │ │
│  │ ☑ 10 Abr - "Compartió juguetes con..."           │ │
│  │ ... (lista continúa)                              │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  Formato de exportación:                                 │
│  [○ PDF  ○ Excel]                                        │
│                                                          │
│  [ Cancelar ]              [ 📥 Generar Reporte ]       │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 🎯 TIPOGRAFÍA

### Familia de fuentes
**Principal:** Inter (sans-serif)  
**Alternativa:** Roboto (sans-serif)

### Tamaños
```
H1 (Títulos principales): 32px / 2rem
H2 (Subtítulos): 24px / 1.5rem
H3 (Secciones): 20px / 1.25rem
Body (Texto normal): 16px / 1rem
Small (Texto secundario): 14px / 0.875rem
```

### Pesos
```
Regular: 400 (textos normales)
Medium: 500 (énfasis moderado)
Semibold: 600 (botones, labels)
Bold: 700 (títulos importantes)
```

---

## 📱 DISEÑO RESPONSIVE

### Breakpoints
```
Mobile: < 768px
Tablet: 768px - 1024px
Desktop: > 1024px
```

### Principios
- Mobile-first approach
- Menú hamburguesa en mobile
- Tarjetas apiladas verticalmente en mobile
- Layouts en grid/flexbox para adaptabilidad

---

## ♿ ACCESIBILIDAD (WCAG 2.1)

### Principios Aplicados
- ✅ Contraste mínimo 4.5:1 para textos
- ✅ Tamaños de fuente escalables (rem, no px fijos)
- ✅ Navegación por teclado completa
- ✅ Labels descriptivos en formularios
- ✅ Mensajes de error claros y visibles
- ✅ Iconos acompañados de texto
- ✅ Espaciado generoso (min 44px para botones táctiles)

### Consideraciones Específicas para TEA
- Colores calmados (azul, verde suave)
- Interfaces predecibles y consistentes
- Sin animaciones agresivas o distractoras
- Feedback visual claro en todas las acciones
- Simplicidad en la navegación

---

## 📊 PRÓXIMOS PASOS

- [ ] Crear mockups de alta fidelidad en Figma
- [ ] Validar colores con herramienta de contraste (WebAIM)
- [ ] Implementar componentes en React con Tailwind CSS
- [ ] Testing de accesibilidad con usuarios reales
- [ ] Iteraciones basadas en feedback

---

**Documento creado:** 13 de abril de 2026  
**Autor:** Cristian Monsalve Budrovich  
**Proyecto:** TEA LINK - DuocUC TPY1101
