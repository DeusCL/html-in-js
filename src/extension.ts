import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('Extensión HTML-in-JS activada');

    // Configurar Emmet solo para archivos JavaScript
    configureEmmet();

    // Listener para cuando se abre un editor
    const activeEditorChange = vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor && editor.document.languageId === 'javascript') {
            configureEmmetForJavaScript(editor);
        }
    });

    // Listener para cambios en el documento
    const documentChangeListener = vscode.workspace.onDidChangeTextDocument(event => {
        if (event.document.languageId === 'javascript') {
            // Reconfigurar Emmet cuando el documento JavaScript cambia
            setTimeout(() => {
                if (vscode.window.activeTextEditor?.document.languageId === 'javascript') {
                    configureEmmetForJavaScript(vscode.window.activeTextEditor);
                }
            }, 100);
        }
    });

    // Configurar para el editor actual si es JavaScript
    if (vscode.window.activeTextEditor?.document.languageId === 'javascript') {
        configureEmmetForJavaScript(vscode.window.activeTextEditor);
    }

    context.subscriptions.push(activeEditorChange, documentChangeListener);

    // Provider de completado para archivos JavaScript únicamente
    const emmetCompletionProvider = vscode.languages.registerCompletionItemProvider(
        ['javascript'],
        {
            async provideCompletionItems(document, position, token, context) {
                // Solo actuar si estamos en un contexto HTML válido dentro de JavaScript
                if (!isInHtmlContext(document, position)) {
                    return undefined;
                }

                const lineText = document.lineAt(position.line).text;
                const beforeCursor = lineText.substring(0, position.character);

                // Obtener la palabra actual
                const wordRange = document.getWordRangeAtPosition(position);
                const currentWord = wordRange ? document.getText(wordRange) : '';

                // Si la palabra parece una abreviación Emmet, dar prioridad a Emmet
                if (isLikelyEmmetAbbreviation(currentWord, beforeCursor)) {
                    try {
                        // Intentar obtener sugerencias de Emmet
                        const emmetCompletions = await vscode.commands.executeCommand<vscode.CompletionList>(
                            'vscode.executeCompletionItemProvider',
                            document.uri,
                            position,
                            undefined // trigger character
                        );

                        if (emmetCompletions && emmetCompletions.items.length > 0) {
                            // Filtrar y priorizar elementos de Emmet
                            const emmetItems = emmetCompletions.items.filter(item =>
                                item.kind === vscode.CompletionItemKind.Snippet ||
                                item.detail?.includes('Emmet') ||
                                item.label.toString().includes('>')
                            );

                            // Aumentar la prioridad de elementos Emmet
                            emmetItems.forEach(item => {
                                item.sortText = '0' + (item.sortText || item.label.toString());
                                item.preselect = true;
                            });

                            return new vscode.CompletionList(emmetItems, false);
                        }
                    } catch (error) {
                        // Si falla, continuar con el comportamiento normal
                    }
                }

                return undefined;
            }
        },
        // Triggers importantes para Emmet
        '.', '#', '>', '+', '^', '*', ':', '(', ')', '[', ']'
    );

    context.subscriptions.push(emmetCompletionProvider);
}

function configureEmmet() {
    const config = vscode.workspace.getConfiguration();

    // Configurar Emmet para incluir JavaScript como HTML
    const emmetIncludeLanguages = config.get('emmet.includeLanguages') as { [key: string]: string } || {};
    emmetIncludeLanguages['javascript'] = 'html';

    // Configurar opciones de Emmet para archivos JavaScript
    const updates = [
        { key: 'emmet.includeLanguages', value: emmetIncludeLanguages },
        { key: 'emmet.showExpandedAbbreviation', value: 'always' },
        { key: 'emmet.triggerExpansionOnTab', value: true },
        { key: 'emmet.showSuggestionsAsSnippets', value: true },
        { key: 'emmet.showAbbreviationSuggestions', value: true },
        { key: 'emmet.syntaxProfiles', value: {
            "javascript": {
                "filters": "html",
                "self_closing_tag": false
            }
        }},
        { key: 'editor.suggest.snippetsPreventQuickSuggestions', value: false },
        { key: 'editor.suggest.showSnippets', value: true }
    ];

    updates.forEach(update => {
        config.update(update.key, update.value, vscode.ConfigurationTarget.Global);
    });
}

function configureEmmetForJavaScript(editor: vscode.TextEditor) {
    const config = vscode.workspace.getConfiguration('emmet', editor.document.uri);

    // Configuraciones específicas para JavaScript
    const workspaceUpdates = [
        { key: 'showExpandedAbbreviation', value: 'always' },
        { key: 'triggerExpansionOnTab', value: true },
        { key: 'showSuggestionsAsSnippets', value: true },
        { key: 'showAbbreviationSuggestions', value: true },
        { key: 'preferences', value: {
            "html.tag_case": "lower",
            "html.attr_case": "lower",
            "html.attr_quotes": "double",
            "html.self_closing_tag": false
        }}
    ];

    workspaceUpdates.forEach(update => {
        config.update(update.key, update.value, vscode.ConfigurationTarget.WorkspaceFolder);
    });
}

function isInHtmlContext(document: vscode.TextDocument, position: vscode.Position): boolean {
    // Solo aplicar en archivos JavaScript
    if (document.languageId !== 'javascript') {
        return false;
    }

    // Obtener el texto desde el inicio del documento hasta la posición actual
    const textBeforePosition = document.getText(new vscode.Range(0, 0, position.line, position.character));

    // Buscar el patrón /*html*/` más cercano hacia atrás
    const htmlCommentRegex = /\/\*html\*\/\s*`/g;
    const backticksRegex = /`/g;

    let lastHtmlCommentIndex = -1;
    let match;

    // Encontrar la última ocurrencia del comentario /*html*/`
    while ((match = htmlCommentRegex.exec(textBeforePosition)) !== null) {
        lastHtmlCommentIndex = match.index;
    }

    if (lastHtmlCommentIndex === -1) {
        return false;
    }

    // Contar backticks después del último comentario /*html*/
    const textAfterHtmlComment = textBeforePosition.substring(lastHtmlCommentIndex);
    const backticks = textAfterHtmlComment.match(backticksRegex);

    // Si hay un número impar de backticks, estamos dentro del template literal
    return backticks !== null && backticks.length % 2 === 1;
}

function isLikelyEmmetAbbreviation(word: string, lineContext: string): boolean {
    if (!word) return false;

    // Elementos HTML comunes
    const commonHtmlElements = [
        'p', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'a', 'img', 'ul', 'ol', 'li', 'nav', 'header', 'footer',
        'section', 'article', 'main', 'aside', 'form', 'input',
        'button', 'label', 'select', 'option', 'textarea'
    ];

    // Si la palabra es un elemento HTML común
    if (commonHtmlElements.includes(word.toLowerCase())) {
        return true;
    }

    // Si contiene caracteres típicos de Emmet
    if (/[.#>+^*:\[\]()]/.test(word)) {
        return true;
    }

    // Si el contexto de la línea sugiere HTML (espacios de indentación típicos de HTML)
    if (/^\s{2,}/.test(lineContext) && word.length <= 10) {
        return true;
    }

    return false;
}

export function deactivate() {
    console.log('Extensión HTML-in-JS desactivada');
}