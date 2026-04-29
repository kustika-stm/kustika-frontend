# EVENXA - FRONTEND CONTEXT

## Descripción
Evenxa es una plataforma web para la compra de boletos de conciertos y eventos.

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