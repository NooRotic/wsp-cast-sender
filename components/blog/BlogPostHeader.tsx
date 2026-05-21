import { formatPostDate } from '@/lib/blog';

interface Props {
  title: string;
  date: string;
  readingMinutes: number;
  tags?: string[];
}

export default function BlogPostHeader({ title, date, readingMinutes, tags }: Props) {
  return (
    <header className="mb-10">
      <div className="flex items-baseline gap-3 mb-4 flex-wrap">
        <time dateTime={date} className="text-sm text-[#39FF14] font-medium">
          {formatPostDate(date)}
        </time>
        <span className="text-xs text-gray-500" aria-hidden="true">·</span>
        <span className="text-xs text-gray-500">{readingMinutes} min read</span>
      </div>
      <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
        {title}
      </h1>
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-1 rounded bg-[#39FF14]/10 text-[#39FF14]/80 border border-[#39FF14]/20"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </header>
  );
}
