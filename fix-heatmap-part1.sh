#!/bin/bash
cat << 'INNER_EOF' > src/components/UptimeHistoryHeatmap.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";

interface HourlyMetric {
  hour: number;
  uptime: number;
  status: "operational" | "degraded" | "down" | "maintenance";
  latency: number;
  incidentCount: number;
  noData?: boolean;
  eventTime?: string;
}

interface DailyMetric {
  date: Date | string;
  dateStr: string;
  hours: HourlyMetric[];
}

interface RegionData {
  id: string;
  name: string;
  isAggregate: boolean;
  data: DailyMetric[];
}

interface ZoneData {
  id: string;
  name: string;
  regions: RegionData[];
}

const getStatusColor = (status: HourlyMetric["status"], noData?: boolean) => {
  if (noData) return "bg-gray-100 dark:bg-zinc-800/50 border border-zinc-200/50 dark:border-zinc-800";
  switch (status) {
    case "operational": return "bg-green-500";
    case "degraded": return "bg-yellow-500";
    case "down": return "bg-red-500";
    case "maintenance": return "bg-blue-500";
    default: return "bg-gray-200 dark:bg-gray-800";
  }
};
INNER_EOF
