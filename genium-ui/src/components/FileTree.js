import React, { useState } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react';

const FileTree = ({ files, onFileSelect, selectedFile }) => {
  const [expandedFolders, setExpandedFolders] = useState(new Set(['src', 'public']));

  // Convert flat file list to tree structure
  const buildTree = (files) => {
    const tree = {};

    files.forEach(file => {
      const parts = file.path.split('/');
      let current = tree;

      parts.forEach((part, index) => {
        if (!current[part]) {
          current[part] = {
            type: index === parts.length - 1 ? 'file' : 'folder',
            path: parts.slice(0, index + 1).join('/'),
            children: {},
            content: file.content || '',
            fileData: index === parts.length - 1 ? file : null
          };
        }
        current = current[part].children;
      });
    });

    return tree;
  };

  const tree = buildTree(files);

  const toggleFolder = (path) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const renderTree = (node, name, path = '', level = 0) => {
    const isExpanded = expandedFolders.has(path || name);
    const isSelected = selectedFile === (path || name);

    if (node.type === 'file') {
      return (
        <div
          key={path || name}
          className={`flex items-center gap-2 py-1 px-2 cursor-pointer hover:bg-gray-700 rounded text-sm ${
            isSelected ? 'bg-blue-600 text-white' : 'text-gray-300'
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => onFileSelect(path || name, node)}
        >
          <File className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{name}</span>
        </div>
      );
    }

    return (
      <div key={path || name}>
        <div
          className={`flex items-center gap-2 py-1 px-2 cursor-pointer hover:bg-gray-700 rounded text-sm ${
            isSelected ? 'bg-blue-600 text-white' : 'text-gray-300'
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => toggleFolder(path || name)}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 flex-shrink-0" />
          )}
          {isExpanded ? (
            <FolderOpen className="w-4 h-4 flex-shrink-0" />
          ) : (
            <Folder className="w-4 h-4 flex-shrink-0" />
          )}
          <span className="truncate">{name}</span>
        </div>

        {isExpanded && (
          <div>
            {Object.entries(node.children).map(([childName, childNode]) =>
              renderTree(childNode, childName, path ? `${path}/${childName}` : childName, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="file-tree bg-gray-800 rounded-lg p-2 h-full overflow-y-auto">
      <div className="text-xs text-gray-400 mb-2 px-2">Project Structure</div>
      {Object.keys(tree).length > 0 ? (
        Object.entries(tree).map(([name, node]) => renderTree(node, name))
      ) : (
        <div className="text-gray-500 text-sm px-2 py-4 text-center">
          No files generated yet
        </div>
      )}
    </div>
  );
};

export default FileTree;