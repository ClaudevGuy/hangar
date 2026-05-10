// Horizontal strip of mini sparklines — one per pinned tool, showing the
// last 24h of activity bucketed by hour. Tools without live data render
// a flat dotted "no signal" line so the row composition matches the user's
// stack rather than just the providers we happen to fetch.

import type { PulseTrack } from "../hooks/useStackPulse";
import type { Tool } from "../types";
import { ToolLogo } from "./ToolLogo";

interface Props {
  tracks: PulseTrack[];
  stackTools: Tool[];
  onOpenTool: (tool: Tool) => void;
}

const SPARK_W = 96;
const SPARK_H = 26;
const HOURS = 24;

export function StackPulse({ tracks, stackTools, onOpenTool }: Props) {
  if (tracks.length === 0) return null;
  return (
    <div className="pulse-grid" role="list">
      {tracks.map((track) => {
        const tool = stackTools.find((t) => t.id === track.toolId);
        if (!tool) return null;
        const quiet = track.totalActivity === 0;
        const subtitle = quiet
          ? "no signal · 24h"
          : `${track.totalActivity} ${track.totalActivity === 1 ? "event" : "events"} · 24h`;
        return (
          <button
            key={track.toolId}
            type="button"
            role="listitem"
            className={`pulse-cell${track.hasErrors ? " has-errors" : ""}${quiet ? " is-quiet" : ""}`}
            onClick={() => onOpenTool(tool)}
            title={`${tool.name} — ${subtitle}`}
          >
            <div className="pulse-cell-head">
              <ToolLogo tool={tool} size={14} />
              <span className="pulse-cell-name">{tool.name}</span>
              {track.hasErrors && <span className="pulse-cell-dot" aria-hidden="true" />}
            </div>
            <Sparkline
              buckets={track.buckets}
              errorBuckets={track.errorBuckets}
              quiet={quiet}
            />
            <div className="pulse-cell-foot">
              {quiet ? (
                <span className="pulse-cell-quiet-label">quiet</span>
              ) : (
                <>
                  <span className="pulse-cell-count">{track.totalActivity}</span>
                  <span className="pulse-cell-suffix">
                    {track.totalActivity === 1 ? "event" : "events"}
                  </span>
                </>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

interface SparkProps {
  buckets: number[];
  errorBuckets: boolean[];
  quiet: boolean;
}

function Sparkline({ buckets, errorBuckets, quiet }: SparkProps) {
  if (quiet) {
    // Dotted baseline communicates "monitoring, but nothing happened" — a
    // flat zero rendered as bars would look like the chart is broken.
    return (
      <svg
        className="pulse-spark pulse-spark-quiet"
        viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
        aria-hidden="true"
      >
        <line
          x1="1"
          y1={SPARK_H / 2}
          x2={SPARK_W - 1}
          y2={SPARK_H / 2}
          strokeDasharray="2 3"
        />
      </svg>
    );
  }
  const max = Math.max(1, ...buckets);
  const barW = SPARK_W / HOURS;
  return (
    <svg
      className="pulse-spark"
      viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
      aria-hidden="true"
    >
      {buckets.map((v, i) => {
        if (v === 0) {
          // 1px floor so the timeline is visible even in empty hours.
          return (
            <rect
              key={i}
              x={i * barW + 0.5}
              y={SPARK_H - 1}
              width={Math.max(1, barW - 1)}
              height={1}
              className="pulse-bar pulse-bar-empty"
            />
          );
        }
        const h = (v / max) * (SPARK_H - 2);
        const isErr = errorBuckets[i];
        return (
          <rect
            key={i}
            x={i * barW + 0.5}
            y={SPARK_H - h}
            width={Math.max(1, barW - 1)}
            height={Math.max(1, h)}
            className={isErr ? "pulse-bar pulse-bar-err" : "pulse-bar"}
          />
        );
      })}
    </svg>
  );
}
