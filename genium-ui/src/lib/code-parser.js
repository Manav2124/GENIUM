export const parseCodeGenerationOutput = (markdownString) => {
  const files = [];
  const lines = markdownString.split('\n');
  let currentFilePath = null;
  let currentFileContent = [];
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for start of a Markdown code block
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // End of a code block
        if (currentFilePath) {
          files.push({
            path: currentFilePath,
            content: currentFileContent.join('\n'),
          });
        }
        currentFilePath = null;
        currentFileContent = [];
        inCodeBlock = false;
      } else {
        // Start of a code block
        // Only consider it a code block if it's not a 'text' block
        const langMatch = line.match(/^```(\S*)/);
        const lang = langMatch ? langMatch[1] : '';
        if (lang !== 'text') {
          inCodeBlock = true;
        }
      }
    } else if (inCodeBlock) {
      // Inside a code block, check for file path comment
      const filePathMatch = line.match(/^(#|\/\/|<!--)\s*(\S+)\s*(\*\/|-->)?$/);
      if (filePathMatch && filePathMatch[2]) {
        // If a new file path is found, push the previous file's content (if any)
        if (currentFilePath && currentFileContent.length > 0) {
          files.push({
            path: currentFilePath,
            content: currentFileContent.join('\n'),
          });
        }
        currentFilePath = filePathMatch[2].trim();
        currentFileContent = []; // Reset content for the new file
      } else {
        currentFileContent.push(line);
      }
    }
  }

  // Handle the last file if the markdown doesn't end with a code block closing tag
  if (currentFilePath && currentFileContent.length > 0) {
    files.push({
      path: currentFilePath,
      content: currentFileContent.join('\n'),
    });
  }

  return files;
};