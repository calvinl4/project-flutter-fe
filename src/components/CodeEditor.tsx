import React from 'react';
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  value: string;
  onEdit: (newContent: string) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ value, onEdit }) => {
  const handleEditorChange = (newValue: string | undefined) => {
    if (newValue !== undefined) {
      onEdit(newValue);
    }
  };

  return (
    <Editor
      height="400px"
      language="python"
      value={value}
      onChange={handleEditorChange}
    />
  );
};

export default CodeEditor;