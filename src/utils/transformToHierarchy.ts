// Specifically for file structure transformation.
export interface File {
  filename: string;
  path: string;
  content: string;
}

export interface Folder {
  name: string;
  files: File[];
  subfolders: { [folderName: string]: Folder };
}

export const transformToHierarchy = (files: File[]): Folder => {
  const rootFolder: Folder = { name: "root", files: [], subfolders: {} };

  files.forEach((file) => {
    const parts = file.filename.split('/');
    let currentFolder = rootFolder;

    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        // It's a file
        currentFolder.files.push({ filename: part, path: file.filename, content: file.content });
      } else {
        // It's a folder
        if (!currentFolder.subfolders[part]) {
          currentFolder.subfolders[part] = { name: part, files: [], subfolders: {} };
        }
        currentFolder = currentFolder.subfolders[part];
      }
    });
  });

  return rootFolder;
};
