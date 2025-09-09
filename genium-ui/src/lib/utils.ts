import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * A utility function that merges Tailwind CSS classes with clsx
 * @param inputs - Array of class values to be merged
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parse markdown links and convert them to HTML anchor tags
 * @param text - Text containing markdown links like [title](url)
 * @returns HTML string with clickable links
 */
export function parseMarkdownLinks(text: string): string {
  // Regular expression to match markdown links: [title](url)
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

  return text.replace(markdownLinkRegex, (match, title, url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">${title}</a>`;
  });
}
