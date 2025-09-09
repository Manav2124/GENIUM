import React, { useState } from 'react';
import { Code, Sparkles, MessageSquare, Lightbulb, CheckCircle, AlertCircle, FileText, Download } from 'lucide-react';
import AiInputSearch from './ui/ai-input.tsx';
import AITextLoading from './ui/ai-text-loading.tsx';
import FileTree from './FileTree';
import { Textarea } from './ui/textarea.tsx';
// Note: JSZip would need to be installed: npm install jszip
// For now, we'll implement a simple download without zipping

const CodeAssistancePage = ({ onBack }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [projectData, setProjectData] = useState(null);
  const [selectedFile, setSelectedFile] = useState('');
  const [selectedFileContent, setSelectedFileContent] = useState('');

  const programmingLanguages = [
    { value: 'javascript', label: 'JavaScript', icon: '🟨' },
    { value: 'python', label: 'Python', icon: '🐍' },
    { value: 'java', label: 'Java', icon: '☕' },
    { value: 'cpp', label: 'C++', icon: '⚡' },
    { value: 'csharp', label: 'C#', icon: '🔷' },
    { value: 'typescript', label: 'TypeScript', icon: '🔷' },
    { value: 'go', label: 'Go', icon: '🐹' },
    { value: 'rust', label: 'Rust', icon: '🦀' },
    { value: 'php', label: 'PHP', icon: '🐘' },
    { value: 'ruby', label: 'Ruby', icon: '💎' },
  ];

  const handleGenerateCode = async (userPrompt) => {
    if (!userPrompt.trim()) return;

    setIsGenerating(true);
    setPrompt(userPrompt);
    setGeneratedCode('');
    setProjectData(null);
    setSelectedFile('');
    setSelectedFileContent('');

    try {
      const response = await fetch('http://localhost:5001/api/generate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: userPrompt,
          language: selectedLanguage,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        if (data.files && Array.isArray(data.files)) {
          // Handle project structure response
          setProjectData(data);

          // Auto-select the main file if available
          if (data.main_file) {
            const mainFileData = data.files.find(file => file.path === data.main_file);
            if (mainFileData) {
              setSelectedFile(data.main_file);
              setSelectedFileContent(mainFileData.content);
              setGeneratedCode(mainFileData.content);
            }
          }

        } else if (data.code) {
          setGeneratedCode(data.code);
        }
      } else {
        // Fallback: Generate sample code based on language
        generateSampleCode(userPrompt);
      }
    } catch (error) {
      console.error('Error generating code:', error);
      // Fallback: Generate sample code
      generateSampleCode(userPrompt);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateSampleCode = (userPrompt) => {
    const sampleCodes = {
      javascript: `// ${userPrompt}
function processData(data) {
  if (!data || !Array.isArray(data)) {
    throw new Error('Invalid data provided');
  }

  return data
    .filter(item => item.active)
    .map(item => ({
      id: item.id,
      name: item.name,
      processed: true
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Example usage
const sampleData = [
  { id: 1, name: 'Alice', active: true },
  { id: 2, name: 'Bob', active: false },
  { id: 3, name: 'Charlie', active: true }
];

const result = processData(sampleData);
console.log(result);`,

      python: `# ${userPrompt}
def process_data(data):
    """
    Process and filter data based on active status.

    Args:
        data (list): List of dictionaries with id, name, and active fields

    Returns:
        list: Processed and sorted data
    """
    if not data or not isinstance(data, list):
        raise ValueError("Invalid data provided")

    filtered_data = [item for item in data if item.get('active', False)]

    processed_data = [
        {
            'id': item['id'],
            'name': item['name'],
            'processed': True
        }
        for item in filtered_data
    ]

    return sorted(processed_data, key=lambda x: x['name'])

# Example usage
sample_data = [
    {'id': 1, 'name': 'Alice', 'active': True},
    {'id': 2, 'name': 'Bob', 'active': False},
    {'id': 3, 'name': 'Charlie', 'active': True}
]

result = process_data(sample_data)
print(result)`,

      java: `// ${userPrompt}
import java.util.*;
import java.util.stream.Collectors;

public class DataProcessor {
    public static class DataItem {
        private int id;
        private String name;
        private boolean active;

        public DataItem(int id, String name, boolean active) {
            this.id = id;
            this.name = name;
            this.active = active;
        }

        // Getters
        public int getId() { return id; }
        public String getName() { return name; }
        public boolean isActive() { return active; }
    }

    public static List<Map<String, Object>> processData(List<DataItem> data) {
        if (data == null || data.isEmpty()) {
            throw new IllegalArgumentException("Invalid data provided");
        }

        return data.stream()
            .filter(DataItem::isActive)
            .map(item -> {
                Map<String, Object> processed = new HashMap<>();
                processed.put("id", item.getId());
                processed.put("name", item.getName());
                processed.put("processed", true);
                return processed;
            })
            .sorted(Comparator.comparing(item -> (String) item.get("name")))
            .collect(Collectors.toList());
    }

    public static void main(String[] args) {
        List<DataItem> sampleData = Arrays.asList(
            new DataItem(1, "Alice", true),
            new DataItem(2, "Bob", false),
            new DataItem(3, "Charlie", true)
        );

        List<Map<String, Object>> result = processData(sampleData);
        System.out.println(result);
    }
}`
    };

    const code = sampleCodes[selectedLanguage] || sampleCodes.javascript;
    setGeneratedCode(code);

  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleRun = () => {
    // In a real implementation, this would execute the code
    alert('Code execution feature coming soon! This would run your code in a sandboxed environment.');
  };

  const handleFileSelect = (filePath, fileNode) => {
    setSelectedFile(filePath);
    if (fileNode && fileNode.content) {
      setSelectedFileContent(fileNode.content);
      setGeneratedCode(fileNode.content);
    }
  };

  const generateProjectSuggestions = (projectData) => {
    const suggestions = [];

    if (projectData.project_name.includes('todo')) {
      suggestions.push({
        title: 'Add Local Storage',
        description: 'Implement local storage to persist todos between sessions',
        type: 'feature'
      });
      suggestions.push({
        title: 'Add Categories',
        description: 'Allow users to organize todos into different categories',
        type: 'feature'
      });
      suggestions.push({
        title: 'Add Due Dates',
        description: 'Add due date functionality with notifications',
        type: 'feature'
      });
    } else if (projectData.project_name.includes('calculator')) {
      suggestions.push({
        title: 'Add Scientific Functions',
        description: 'Implement trigonometric and logarithmic functions',
        type: 'feature'
      });
      suggestions.push({
        title: 'Add History',
        description: 'Keep track of previous calculations',
        type: 'feature'
      });
      suggestions.push({
        title: 'Add Keyboard Support',
        description: 'Allow keyboard input for calculator operations',
        type: 'usability'
      });
    }

    suggestions.push({
      title: 'Add Unit Tests',
      description: 'Create comprehensive unit tests for all components',
      type: 'testing'
    });
    suggestions.push({
      title: 'Add Error Handling',
      description: 'Implement proper error handling and user feedback',
      type: 'robustness'
    });
    suggestions.push({
      title: 'Add Responsive Design',
      description: 'Ensure the application works well on mobile devices',
      type: 'usability'
    });

    return suggestions;
  };

  const handleDownloadProject = () => {
    if (!projectData) return;

    // For now, download the main file
    const mainFile = projectData.files.find(file => file.path === projectData.main_file);
    if (mainFile && mainFile.content) {
      const blob = new Blob([mainFile.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = projectData.main_file;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="code-assistance-page flex flex-col h-full p-6 pt-32">
      <div className="w-full max-w-7xl mx-auto mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          ← Back to Explore
        </button>
      </div>

      <div className="flex-grow flex gap-6 max-w-7xl mx-auto w-full">
        {/* Left Panel - Input */}
        <div className={`${projectData && projectData.files ? 'w-1/3' : 'w-1/2'} flex flex-col gap-6`}>
          <div className="bg-surface dark:bg-surface-dark rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            {projectData && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-md">
                <p className="text-sm text-green-800 dark:text-green-200">
                  <strong>Project:</strong> {projectData.project_name}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  {projectData.description}
                </p>
              </div>
            )}
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              Describe Your Project
            </h2>
            <AiInputSearch
              onSend={handleGenerateCode}
              disabled={isGenerating}
              placeholder="Describe what you want to build... (e.g., 'Create a todo list app using React')"
            />

            {prompt && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Your request:</strong> {prompt}
                </p>
              </div>
            )}

            {projectData && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-md">
                <p className="text-sm text-green-800 dark:text-green-200">
                  <strong>Project:</strong> {projectData.project_name}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  {projectData.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Middle Panel - File Tree */}
        {projectData && projectData.files && (
          <div className="w-1/4 bg-surface dark:bg-surface-dark rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Project Files
              </h2>
            </div>
            <div className="flex-1 overflow-hidden">
              <FileTree
                files={projectData.files}
                onFileSelect={handleFileSelect}
                selectedFile={selectedFile}
              />
            </div>
          </div>
        )}

        {/* Right Panel - Output */}
        <div className={`${projectData && projectData.files ? 'w-2/3' : 'w-full'} bg-surface dark:bg-surface-dark rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col`}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold">Response</h2>
          </div>
          <div className="flex-1 p-6 bg-gray-900 overflow-y-auto rounded-b-lg">
            {isGenerating && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <AITextLoading />
                  <p className="mt-4 text-gray-400">Generating your code...</p>
                </div>
              </div>
            )}

            {!isGenerating && !generatedCode && (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <p>The answer will appear here.</p>
                </div>
              </div>
            )}

            {!isGenerating && generatedCode && (
              <div className="relative h-full">
                <Textarea
                  value={generatedCode}
                  readOnly
                  placeholder="Your generated code will appear here."
                  className="h-full w-full bg-gray-900 text-green-400 font-mono text-sm p-4 rounded-lg resize-none focus:ring-0 focus:outline-none"
                />
                {projectData && (
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                      {projectData.files?.length || 0} files
                    </span>
                    <button
                      onClick={handleDownloadProject}
                      className="flex items-center gap-2 px-3 py-1 bg-purple-600 hover:bg-purple-500 rounded text-sm transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeAssistancePage;