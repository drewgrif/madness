'use client';

import { Score } from '@/lib/types';

interface LeaderboardTableProps {
  scores: Score[];
  currentUserId?: number | null;
}

export default function LeaderboardTable({ scores, currentUserId }: LeaderboardTableProps) {
  if (!scores.length) {
    return (
      <div className="text-center text-slate-400 py-12 text-sm">
        No scores yet. Picks will appear here once the tournament begins.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-slate-200">
            <th className="text-left py-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider w-8">#</th>
            <th className="text-left py-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Player</th>
            <th className="text-right py-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Pts</th>
            <th className="text-right py-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Max</th>
            <th className="text-right py-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">R64</th>
            <th className="text-right py-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">R32</th>
            <th className="text-right py-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">S16</th>
            <th className="text-right py-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">E8</th>
            <th className="text-right py-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">F4</th>
            <th className="text-right py-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Champ</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((s, idx) => {
            const isMe = s.user_id === currentUserId;
            const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;
            return (
              <tr
                key={s.user_id}
                className={`border-b border-slate-100 transition-colors ${
                  isMe ? 'bg-orange-50' : 'hover:bg-slate-50'
                }`}
              >
                <td className="py-3 px-3 text-slate-400 font-mono text-xs">
                  {medal || <span>{idx + 1}</span>}
                </td>
                <td className="py-3 px-3">
                  <span className={`font-medium ${isMe ? 'text-orange-600' : 'text-slate-700'}`}>
                    {s.username}
                    {isMe && <span className="text-xs text-orange-400 ml-1">(you)</span>}
                  </span>
                </td>
                <td className="py-3 px-3 text-right font-bold text-slate-900">{s.total_points}</td>
                <td className="py-3 px-3 text-right text-slate-400 hidden sm:table-cell">{s.max_possible}</td>
                <td className="py-3 px-3 text-right text-slate-500 hidden md:table-cell">{s.r64_pts}</td>
                <td className="py-3 px-3 text-right text-slate-500 hidden md:table-cell">{s.r32_pts}</td>
                <td className="py-3 px-3 text-right text-slate-500 hidden md:table-cell">{s.s16_pts}</td>
                <td className="py-3 px-3 text-right text-slate-500 hidden md:table-cell">{s.e8_pts}</td>
                <td className="py-3 px-3 text-right text-slate-500 hidden lg:table-cell">{s.f4_pts}</td>
                <td className="py-3 px-3 text-right text-slate-500 hidden lg:table-cell">{s.champ_pts}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
