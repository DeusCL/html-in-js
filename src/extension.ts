import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('Extensión HTML-in-JS activada');

    configureEmmet();

    const activeEditorChange = vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor && editor.document.languageId === 'javascript') {
            configureEmmetForJavaScript(editor);
        }
    });

    const documentChangeListener = vscode.workspace.onDidChangeTextDocument(event => {
        if (event.document.languageId === 'javascript') {
            setTimeout(() => {
                if (vscode.window.activeTextEditor?.document.languageId === 'javascript') {
                    configureEmmetForJavaScript(vscode.window.activeTextEditor);
                }
            }, 100);
        }
    });

    if (vscode.window.activeTextEditor?.document.languageId === 'javascript') {
        configureEmmetForJavaScript(vscode.window.activeTextEditor);
    }

    context.subscriptions.push(activeEditorChange, documentChangeListener);

    const emmetCompletionProvider = vscode.languages.registerCompletionItemProvider(
        ['javascript'],
        {
            async provideCompletionItems(document, position, token, context) {
                if (!isInHtmlContext(document, position)) {
                    return undefined;
                }

                const lineText = document.lineAt(position.line).text;
                const beforeCursor = lineText.substring(0, position.character);

                const wordRange = document.getWordRangeAtPosition(position);
                const currentWord = wordRange ? document.getText(wordRange) : '';

                if (isLikelyEmmetAbbreviation(currentWord, beforeCursor)) {
                    try {
                        const emmetCompletions = await vscode.commands.executeCommand<vscode.CompletionList>(
                            'vscode.executeCompletionItemProvider',
                            document.uri,
                            position,
                            undefined
                        );

                        if (emmetCompletions && emmetCompletions.items.length > 0) {
                            const emmetItems = emmetCompletions.items.filter(item =>
                                item.kind === vscode.CompletionItemKind.Snippet ||
                                item.detail?.includes('Emmet') ||
                                item.label.toString().includes('>')
                            );

                            emmetItems.forEach(item => {
                                item.sortText = '0' + (item.sortText || item.label.toString());
                                item.preselect = true;
                            });

                            return new vscode.CompletionList(emmetItems, false);
                        }
                    } catch (error) {}
                }

                return undefined;
            }
        },
        '.', '#', '>', '+', '^', '*', ':', '(', ')', '[', ']'
    );

    context.subscriptions.push(emmetCompletionProvider);
}

function configureEmmet() {
    const config = vscode.workspace.getConfiguration();

    const emmetIncludeLanguages = config.get('emmet.includeLanguages') as { [key: string]: string } || {};
    emmetIncludeLanguages['javascript'] = 'html';

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
    if (document.languageId !== 'javascript') {
        return false;
    }

    const textBeforePosition = document.getText(new vscode.Range(0, 0, position.line, position.character));

    const htmlCommentRegex = /\/\*html\*\/\s*`/g;
    const backticksRegex = /`/g;

    let lastHtmlCommentIndex = -1;
    let match;

    while ((match = htmlCommentRegex.exec(textBeforePosition)) !== null) {
        lastHtmlCommentIndex = match.index;
    }

    if (lastHtmlCommentIndex === -1) {
        return false;
    }

    const textAfterHtmlComment = textBeforePosition.substring(lastHtmlCommentIndex);
    const backticks = textAfterHtmlComment.match(backticksRegex);

    return backticks !== null && backticks.length % 2 === 1;
}

function isLikelyEmmetAbbreviation(word: string, lineContext: string): boolean {
    if (!word) return false;

    const commonHtmlElements = [
        'p', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'a', 'img', 'ul', 'ol', 'li', 'nav', 'header', 'footer',
        'section', 'article', 'main', 'aside', 'form', 'input',
        'button', 'label', 'select', 'option', 'textarea'
    ];

    if (commonHtmlElements.includes(word.toLowerCase())) {
        return true;
    }

    if (/[.#>+^*:\[\]()]/.test(word)) {
        return true;
    }

    if (/^\s{2,}/.test(lineContext) && word.length <= 10) {
        return true;
    }

    return false;
}

export function deactivate() {
    console.log('Extensión HTML-in-JS desactivada');
}