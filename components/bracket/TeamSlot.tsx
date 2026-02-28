'use client';

import { GameWithTeams, Pick, Region, REGION_COLORS } from '@/lib/types';

interface TeamSlotProps {
  teamId: number | null;
  teamName: string | null;
  teamShort: string | null;
  teamSeed: number | null;
  teamColor: string | null;
  region: Region | null;
  isWinner: boolean;
  isPicked: boolean;
  isCorrect: boolean | null;
  isEliminated: boolean;
  isLocked: boolean;
  onClick: () => void;
}

export default function TeamSlot({
  teamId, teamName, teamShort, teamSeed, teamColor, region,
  isWinner, isPicked, isCorrect, isEliminated, isLocked, onClick,
}: TeamSlotProps) {
  if (!teamId) {
    return (
      <div className="flex items-center h-8 px-2 border-b border-slate-100 bg-slate-50/50">
        <span className="text-xs text-slate-300 italic">TBD</span>
      </div>
    );
  }

  const regionColor = region ? REGION_COLORS[region] : '#64748b';
  const accentColor = teamColor || regionColor;

  let bg = 'bg-white hover:bg-orange-50';
  let textColor = 'text-slate-700';
  let border = 'border-b border-slate-100';

  if (isPicked && isCorrect === null) {
    bg = 'bg-orange-50 hover:bg-orange-100';
    border = 'border-b border-orange-200';
  } else if (isPicked && isCorrect === true) {
    bg = 'bg-green-50';
    textColor = 'text-green-800';
    border = 'border-b border-green-200';
  } else if (isPicked && isCorrect === false) {
    bg = 'bg-red-50';
    textColor = 'text-red-700';
    border = 'border-b border-red-100';
  } else if (isWinner) {
    bg = 'bg-green-50';
    textColor = 'text-green-800';
  }

  return (
    <div
      onClick={!isLocked ? onClick : undefined}
      className={`team-slot flex items-center h-8 px-2 gap-1.5 ${bg} ${border} ${textColor} ${!isLocked ? 'cursor-pointer' : ''} ${isEliminated ? 'eliminated' : ''} ${isPicked ? 'selected' : ''} relative group`}
    >
      {/* Seed badge */}
      <span
        className="text-[10px] font-bold w-4 shrink-0 text-center opacity-60"
        style={{ color: accentColor }}
      >
        {teamSeed}
      </span>

      {/* Team name */}
      <span className="text-xs font-medium truncate flex-1 leading-none">
        {teamShort || teamName}
      </span>

      {/* Status indicator */}
      {isPicked && isCorrect === null && (
        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
      )}
      {isPicked && isCorrect === true && (
        <span className="text-xs text-green-600">✓</span>
      )}
      {isPicked && isCorrect === false && (
        <span className="text-xs text-red-400">✗</span>
      )}
      {isWinner && !isPicked && (
        <span className="text-xs text-green-600">✓</span>
      )}

      {/* Left accent bar */}
      <span
        className="absolute left-0 top-0 bottom-0 w-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: accentColor }}
      />
      {isPicked && (
        <span
          className="absolute left-0 top-0 bottom-0 w-0.5"
          style={{ backgroundColor: accentColor }}
        />
      )}
    </div>
  );
}
