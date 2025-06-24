# HTML in JS - VS Code Extension

This extension enables HTML syntax highlighting inside JavaScript template literals when using the `/*html*/` comment and enables Emmet abbreviations.

## Features

- HTML syntax highlighting in template literals
- Support for Emmet abbreviations
- Works in `.js` and `.html` files
- Support for JavaScript interpolation inside HTML (`${variable}`)

## Usage

### In JavaScript files (.js)
```javascript
const element = /*html*/ `
  <div class="container">
    <h1>Hello World</h1>
    <p>This text is highlighted as HTML</p>
  </div>
`;
```

### In HTML files with script tags
```html
<script type="module">
  const element = /*html*/ `
    <div class="container">
      <h1>Hello World</h1>
      <p>This text is highlighted as HTML</p>
    </div>
  `;
</script>
```

In order to see emmet abbreviation suggestions you must have to setup the `<script>` tag as `<script type="module">`.


### Using `${variables}` inside the `/*html*/` template literal
```html
<script type="module">
  const Component = (title, text, class="container") = /*html*/ `
    <div class="${class}">
      <h1>${title}</h1>
      <p>${text}</p>
    </div>
  `;

  document.body.innerHTML += Component("Hello World", "This text is highlighted as HTML");
</script>
```


## Notes

- The extension automatically detects the `/*html*/` comment before template literals
- Highlighting works in both `.js` files and inside `<script>` tags in `.html` files
- Emmet is automatically activated when you're typing inside these template literals