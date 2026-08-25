import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { publicApi } from '../../api/services';
import { Clock, Eye, Loader2 } from 'lucide-react';
import AiToolIcon from '../../components/icons/AiToolIcon';

export default function TutorialsPage() {
  const { data: tutorials = [], isLoading } = useQuery({
    queryKey: ['tutorials'],
    queryFn: publicApi.getTutorials,
  });

  return (
    <div className="page-shell space-y-12 py-16 sm:py-24">
      <div className="max-w-3xl space-y-4">
        <h1 className="text-3xl font-extrabold leading-tight tracking-[-0.04em] text-[var(--text-primary)] sm:text-5xl">
          Video hướng dẫn cài đặt & thao tác Add-in
        </h1>
        <p className="text-[var(--text-secondary)] text-base leading-relaxed">
          Nắm bắt quy trình tự động hóa Revit từng bước trực quan và nhanh chóng nhất.
        </p>
      </div>

      {isLoading ? (
        <div className="py-16 flex items-center gap-2.5 text-[var(--text-secondary)]">
          <Loader2 className="animate-spin" size={20} /> Đang tải video hướng dẫn...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {tutorials.map((video) => (
            <article key={video.id} className="space-y-5 rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-4 shadow-sm sm:p-5">
              <div className="relative aspect-video overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--surface-subtle)]">
                <iframe
                  src={video.videoUrl}
                  title={video.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              <div className="space-y-2 px-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="border border-[var(--line)] bg-[var(--brand-soft)] px-2.5 py-1 font-mono font-bold uppercase tracking-wider text-[var(--brand)]">
                    {video.level}
                  </span>
                  <div className="flex items-center gap-3 text-[var(--text-muted)] font-medium">
                    <span className="flex items-center gap-1.5"><Clock size={16} strokeWidth={1.8} /> {video.duration}</span>
                    <span className="flex items-center gap-1.5"><Eye size={16} strokeWidth={1.8} /> {video.views}</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  {(video.title.includes('Claude') || video.title.includes('Cursor')) && (
                    <span className="mt-0.5 flex shrink-0 items-center gap-1.5 text-[var(--text-primary)]" aria-hidden="true">
                      {video.title.includes('Claude') && <AiToolIcon tool="claude" size={18} />}
                      {video.title.includes('Cursor') && <AiToolIcon tool="cursor" size={18} />}
                    </span>
                  )}
                  <h3 className="text-base font-bold leading-6 text-[var(--text-primary)] sm:text-lg">{video.title}</h3>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
