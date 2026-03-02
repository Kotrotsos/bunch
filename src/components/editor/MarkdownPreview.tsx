import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTheme } from "../../context/ThemeContext";

interface MarkdownPreviewProps {
  content: string;
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  const { theme } = useTheme();

  return (
    <div
      className={`h-full overflow-y-auto p-6 ${
        theme === "dark" ? "prose-invert" : ""
      } prose prose-sm max-w-none`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
