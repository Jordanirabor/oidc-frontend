/**
 * Dashboard API client for fetching analytics data
 * Provides functions to fetch dashboard statistics, chart data, and activity feed
 */

import { BackendApiError } from "../backend-api";

// Type definitions matching backend API responses

export interface DashboardStats {
  totalApps: number;
  activeUsers: number;
  authRequests30d: number;
  successRate: number;
}

export interface ChartDataPoint {
  day: string; // ISO date string (YYYY-MM-DD)
  requests: number;
}

export interface ChartResponse {
  data: ChartDataPoint[];
}

export interface ActivityItem {
  type: string;
  user: string;
  message: string;
  time: string;
  icon: string;
}

export interface ActivityResponse {
  activities: ActivityItem[];
}

/**
 * Fetch dashboard statistics
 * Returns total apps, active users, auth requests, and success rate
 * Uses Next.js API route proxy to forward cookies to backend
 */
export async function fetchDashboardStats(): Promise<DashboardStats> {
  try {
    const response = await fetch("/api/developer/dashboard", {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw new BackendApiError(
        `Backend returned ${response.status}`,
        response.status,
      );
    }

    return await response.json();
  } catch (error) {
    console.error("[Dashboard API] Failed to fetch dashboard stats:", error);
    throw error;
  }
}

/**
 * Fetch dashboard chart data
 * Returns 30 days of authentication request counts
 * Uses Next.js API route proxy to forward cookies to backend
 */
export async function fetchDashboardChart(): Promise<ChartDataPoint[]> {
  try {
    const response = await fetch("/api/developer/dashboard/chart", {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw new BackendApiError(
        `Backend returned ${response.status}`,
        response.status,
      );
    }

    const chartResponse: ChartResponse = await response.json();
    return chartResponse.data;
  } catch (error) {
    console.error("[Dashboard API] Failed to fetch dashboard chart:", error);
    throw error;
  }
}

/**
 * Fetch recent activity feed
 * Returns up to 20 most recent activity items
 * Uses Next.js API route proxy to forward cookies to backend
 */
export async function fetchActivity(): Promise<ActivityItem[]> {
  try {
    const response = await fetch("/api/developer/activity", {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw new BackendApiError(
        `Backend returned ${response.status}`,
        response.status,
      );
    }

    const activityResponse: ActivityResponse = await response.json();
    return activityResponse.activities;
  } catch (error) {
    console.error("[Dashboard API] Failed to fetch activity:", error);
    throw error;
  }
}

// Export error type for consumers
export { BackendApiError };
