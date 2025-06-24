# HTML in JS - Extensión para VS Code

Esta extensión permite resaltar sintaxis HTML dentro de template literals de JavaScript cuando se usa el comentario `/*html*/` y habilita las abreviaciones Emmet.

## Características

- ✅ Resaltado de sintaxis HTML en template literals
- ✅ Soporte para Emmet abbreviations
- ✅ Funciona en archivos `.js` y `.html`
- ✅ Soporte para interpolación JavaScript dentro del HTML (`${variable}`)

## Uso

### En archivos JavaScript (.js)
```javascript
const element = /*html*/`
  <div class="container">
    <h1>Hola Mundo</h1>
    <p>Este texto está resaltado como HTML</p>
  </div>
`;
```

### En archivos HTML con script tags
```html
<script>
  const element = /*html*/`
    <div class="container">
      <h1>Hola Mundo</h1>
      <p>Este texto está resaltado como HTML</p>
    </div>
  `;
</script>
```

### Usando Emmet
Dentro de un template literal con `/*html*/`, puedes usar abreviaciones de Emmet:

```javascript
const element = /*html*/`
  div.container>h1+p.description
`;
```

Presiona `Tab` para expandir la abreviación a:

```javascript
const element = /*html*/`
  <div class="container">
    <h1></h1>
    <p class="description"></p>
  </div>
`;
```

## Instalación

1. Copia todos los archivos a una carpeta de proyecto
2. Abre la terminal en esa carpeta
3. Ejecuta: `npm install`
4. Compila el proyecto: `npm run compile`
5. Presiona `F5` para abrir una nueva ventana de VS Code con la extensión cargada

## Desarrollo

Para modificar la extensión:

1. Edita los archivos según necesites
2. Ejecuta `npm run compile` para compilar
3. Presiona `Ctrl+R` en la ventana de desarrollo para recargar la extensión

## Archivos principales

- `package.json`: Configuración de la extensión
- `src/extension.ts`: Lógica principal de la extensión
- `syntaxes/html-in-js.tmLanguage.json`: Gramática para el resaltado de sintaxis
- `language-configuration.json`: Configuración del lenguaje

## Requisitos

- VS Code 1.74.0 o superior
- Node.js para desarrollo

## Notas

- La extensión detecta automáticamente el comentario `/*html*/` antes de template literals
- El resaltado funciona tanto en archivos `.js` como dentro de tags `<script>` en archivos `.html`
- Emmet se activa automáticamente cuando estás escribiendo dentro de estos template literals
