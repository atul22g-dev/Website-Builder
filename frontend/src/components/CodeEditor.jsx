import React from 'react';
import Editor from '@monaco-editor/react';

const CodeEditor = ({ file }) => {
    return (
        <Editor
            height="100%"
            defaultLanguage="javascript"
            theme="custom-dark"
            value={file?.content || ''}
            options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: 'on',
                scrollBeyondLastLine: false,
            }}
            onMount={(editor, monaco) => {
                monaco.editor.defineTheme('custom-dark', {
                    base: 'vs-dark',
                    inherit: true,
                    rules: [],
                    colors: {
                        'editor.background': '#101828',  // Background color
                    },
                });
                monaco.editor.setTheme('custom-dark');
            }}
        />
    );
};

export default CodeEditor;
