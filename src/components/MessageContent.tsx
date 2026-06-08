import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface MessageContentProps {
  content: string;
}

function preprocessLatex(text: string): string {
  let result = text;

  result = result.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `$$${math}$$`);

  result = result.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math}$`);

  return result;
}

export default function MessageContent({ content }: MessageContentProps) {
  const processed = preprocessLatex(content);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
    >
      {processed}
    </ReactMarkdown>
  );
}
