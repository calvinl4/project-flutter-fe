import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  transformToHierarchy,
  Folder,
  File,
} from "./utils/transformToHierarchy";
import "./App.css";
import CodeEditor from "./components/CodeEditor";
import { diffChars, diffLines } from "diff";

interface Issue {
  id: number;
  issue: string;
  repository: File[];
}

interface Action {
  action: string;
  diff?: string;
}

const App: React.FC = () => {
  const [issue, setIssue] = useState<Issue | null>(null);
  const [fileHierarchy, setFileHierarchy] = useState<Folder | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContents, setFileContents] = useState<{
    [filename: string]: string;
  }>({});
  const [actions, setActions] = useState<Action[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<{
    [key: string]: boolean;
  }>({});
  const [executionResult, setExecutionResult] = useState<string | null>(null);
  const [savedContents, setSavedContents] = useState<{
    [filename: string]: string;
  }>({});
  const [initialCode, setInitialCodes] = useState<{
    [filename: string]: string;
  }>({});

  useEffect(() => {
    const fetchIssue = async () => {
      try {
        const response = await axios.get<Issue>(
          "http://localhost:3001/api/random-issue"
        );
        setIssue(response.data);

        const hierarchy = transformToHierarchy(response.data.repository);
        setFileHierarchy(hierarchy);

        const initialContents: { [filename: string]: string } = {};
        response.data.repository.forEach((file) => {
          initialContents[file.filename] = file.content;
        });
        setFileContents(initialContents);
        setSavedContents(initialContents);
        setInitialCodes(initialContents);
      } catch (error) {
        console.error("Error fetching issue:", error);
      }
    };

    fetchIssue();
  }, []);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleFileContentChange = (filename: string, newContent: string) => {
    setFileContents((prevContents) => ({
      ...prevContents,
      [filename]: newContent,
    }));
  };

  const handleSave = () => {
    if (selectedFile) {
      const changes: { filename: string; diff: string }[] = [];

      // iterate through files and calculate diffs for changed files

      Object.keys(fileContents).forEach((filename) => {
        const previousContent = savedContents[filename] || "";
        const currentContent = fileContents[filename];

        if (previousContent !== currentContent) {
          const diff = diffLines(previousContent, currentContent)
            .map((part) => {
              const toAdd = part.added ? "+" : part.removed ? "-" : " ";
              return `${toAdd} ${part.value}`
            }).join("")

            changes.push({ filename, diff })
        }
      });

      // create action
      if (changes.length > 0) {
        const action: Action = {
          action: "edit_code",
          diff: JSON.stringify(changes, null, 2)
        }

        if (isRecording) {
          setActions((prevActions) => [
            ...prevActions,
            action
          ]);
        }
        setSavedContents(fileContents)
      }
      
      console.log(`File ${selectedFile.filename} saved.`);
    }
  };

  const handleMockExecute = async () => {
    if (selectedFile) {
      try {
        const response = await axios.post("http://localhost:3001/api/execute", {
          filename: selectedFile.filename,
          content: fileContents[selectedFile.path],
        });
        const result = response.data.result;

        setExecutionResult(result); // Save the execution result for display

        if (isRecording) {
          setActions((prevActions) => [
            ...prevActions,
            { action: "execute_code", diff: `Execution result: ${result}` },
          ]);
        }

        console.log(`Execution result for ${selectedFile.filename}:`, result);
      } catch (error) {
        console.error("Error executing file:", error);
        setExecutionResult("error");
      }
    } else {
      console.warn("No file selected for execution.");
    }
  };

  const handleStartRecording = () => {
    setActions([]); // Clear previous actions
    setIsRecording(true);
    console.log("Recording started...");
  };

  const handleStopRecording = async () => {
    setIsRecording(false);
    const recordingData = {
      issue: issue?.issue || "",
      initial_code: Object.values(initialCode).join("\n") || "",
      actions,
    };

    try {
      const response = await axios.post(
        "http://localhost:3001/api/save-recording",
        recordingData
      );
      console.log("Recording saved:", response.data);
    } catch (error) {
      console.error("Error saving recording:", error);
    }
  };

  const toggleFolder = (folderName: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderName]: !prev[folderName],
    }));
  };

  const renderFolder = (folder: Folder, path = "") => (
    <li key={`${path}/${folder.name}`} className="folder">
      <div
        onClick={() => toggleFolder(`${path}/${folder.name}`)}
        className="folder-name"
      >
        {folder.name}
      </div>
      {expandedFolders[`${path}/${folder.name}`] && (
        <ul>
          {Object.values(folder.subfolders).map((subfolder) =>
            renderFolder(subfolder, `${path}/${folder.name}`)
          )}
          {folder.files.map((file) => (
            <li
              key={file.path}
              onClick={() => handleFileSelect(file)}
              className="file"
            >
              {file.path}
            </li>
          ))}
        </ul>
      )}
    </li>
  );

  return (
    <div className="App">
      <h1>Project Flutter Code Editor</h1>
      {issue && (
        <div>
          <h2>Issue: {issue.issue}</h2>
          <div className="container">
            <div className="sidebar">
              <h3>Files</h3>
              <ul className="folder-list">
                {fileHierarchy && renderFolder(fileHierarchy)}
              </ul>
            </div>
            <div className="file-editor">
              <h3>{selectedFile?.path}</h3>
              {selectedFile && (
                <CodeEditor
                  value={fileContents[selectedFile.path]}
                  onEdit={(newContent: string) =>
                    handleFileContentChange(selectedFile.path, newContent)
                  }
                />
              )}
            </div>
          </div>
          <div className="controls">
            <button onClick={handleSave}>Save File</button>
            {isRecording ? (
              <button onClick={handleStopRecording}>Stop Recording</button>
            ) : (
              <button onClick={handleStartRecording}>Start Recording</button>
            )}
            <button onClick={handleMockExecute}>Execute</button>
            {executionResult && <p>Execution Result: {executionResult}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
