# KUSTIKA - FRONTEND CONTEXT
- Por cada feature, es una rama correspondiente o nueva, si ya existe primero se hace un pull de la rama llamada dev, que esta en el repo.

- No hacer commits hasta que se indique con un "sube los cambios" o algo parecido
## Descripción
Kustika es una plataforma web para la compra de boletos de conciertos y eventos.

Este chat está enfocado únicamente en el desarrollo del frontend.

---

## Arquitectura

Se utiliza arquitectura FSD (Feature-Sliced Design):

src/
  app/
  pages/
  widgets/
  features/
  entities/
  shared/

---

## Objetivo del frontend

Construir una interfaz moderna, rápida y clara que permita a los usuarios:

1. Descubrir eventos
2. Ver detalles
3. Comprar boletos fácilmente

---

## Prioridades clave

- UX limpia y sin fricción
- Flujo de compra rápido
- Código escalable y bien estructurado
- Componentes reutilizables

---

## Mobile First (CRÍTICO)

La aplicación debe diseñarse primero para dispositivos móviles.

La mayoría de usuarios compran boletos desde el celular, por lo tanto:

- Todo debe verse perfecto en móvil
- Interacciones simples y rápidas
- Botones accesibles (thumb-friendly)
- Carga rápida

Después se adapta a tablet y desktop.

---

## Notas importantes

- Evitar complejidad innecesaria
- No sobreingeniería
- Mantener consistencia visual
- Priorizar rendimiento

La arquitectura está diseñada para crecer de forma progresiva.

No todas las capas estarán completamente utilizadas desde el inicio.
Se irán expandiendo conforme el producto lo requiera.

Ejemplos:

- `entities/` crecerá con nuevos modelos (events, users, tickets, etc.)
- `features/` se utilizará para lógica específica (auth, filtros, compra de boletos)
- `widgets/` se expandirá con secciones completas reutilizables
- `shared/` centralizará utilidades, hooks y componentes base

El objetivo no es sobreestructurar desde el inicio,
sino mantener una base sólida que permita escalar sin romper la organización.

src/
  app/
    providers/      → Configuración global (contextos, wrappers)
    router/         → Rutas de la aplicación
    styles/         → Estilos globales (design system)
    App.tsx         → Root de la app

  pages/
    home/           → Página principal (Home)

  widgets/
    header/         → Componentes grandes reutilizables (UI compuesta)

  entities/
    event/          → Modelos de negocio (ej: eventos)
      ui/           → Componentes UI (EventCard)
      model/        → Tipos, mocks, lógica de datos

  features/         → Funcionalidades específicas (futuro: auth, filtros, etc.)

  shared/
    assets/
      images/
        hero/       → Imágenes del hero
        logo/       → Logos de la marca
