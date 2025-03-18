import React from 'react'
import Editor from '@monaco-editor/react';

const CodeEditor = ({ file }) => {
    return (
        <Editor
            height="100%"
            defaultLanguage="typescript"
            theme="vs-dark"
            value={file?.content || ''}
            options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: 'on',
                scrollBeyondLastLine: false,
            }}
        />
    )
}

export default CodeEditor