'use client';

import React from 'react';
import { Check, CheckCircle2 } from 'lucide-react';
import { StationRecommendation } from '@/lib/types';
import { formatTime, formatPower, formatCost, formatDistance } from '@/lib/formatters';

interface RankingExplanationProps {
  station: StationRecommendation;
}

export const RankingExplanation: React.FC<RankingExplanationProps> = ({ station }) => {
  const points: string[] = [];

  if (station.charging.charger_power_kw >= 50) {
    points.push(`High-speed ${formatPower(station.charging.charger_power_kw)} DC charger reduces charging duration`);
  } else if (station.charging.charger_power_kw >= 25) {
    points.push(`Reliable ${formatPower(station.charging.charger_power_kw)} charger suitable for journey recharge`);
  }

  if (station.waiting_time_min <= 10) {
    points.push(`Low queue delay: estimated waiting time of only ${formatTime(station.waiting_time_min)}`);
  } else if (station.waiting_time_min <= 20) {
    points.push(`Manageable estimated waiting time (${formatTime(station.waiting_time_min)})`);
  }

  if (station.source_to_station.travel_time_min <= 15) {
    points.push(`Convenient reach from origin (${formatTime(station.source_to_station.travel_time_min)} drive, ${formatDistance(station.source_to_station.distance_km)})`);
  }

  if (station.optimization.total_drive_distance_km <= 30) {
    points.push(`Low route detour (${formatDistance(station.optimization.total_drive_distance_km)} total driving distance)`);
  }

  if (station.charging_cost <= 600) {
    points.push(`Cost-effective recharge (${formatCost(station.charging_cost)} estimated total cost)`);
  }

  if (points.length < 3) {
    points.push(`Guarantees sufficient battery reserve to arrive at your destination`);
    points.push(`Optimal weighted balance across driving, waiting, charging, and cost`);
  }

  return (
    <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 my-2 text-xs">
      <div className="flex items-center space-x-1.5 text-slate-800 font-semibold text-xs mb-1.5">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>Recommendation Factors</span>
      </div>

      <ul className="space-y-1">
        {points.map((point, index) => (
          <li key={index} className="flex items-start space-x-2 text-slate-700">
            <span className="text-emerald-700 font-bold">•</span>
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
