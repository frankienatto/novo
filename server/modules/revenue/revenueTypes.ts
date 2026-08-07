export interface ForecastDay {
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // "Domingo", "Segunda", etc.
  projectedOccupiedUnits: number;
  totalUnits: number;
  occupancyRatePercent: number;
  projectedRevenue: number;
  projectedADR: number;
}

export interface ChannelRevenue {
  source: string; // "direct_website", "front_desk", "phone", "whatsapp", "ota_generic", etc.
  label: string;  // Readable name e.g. "Website Direto", "Recepção / Balcão", etc.
  reservationsCount: number;
  totalRevenue: number;
  sharePercent: number;
  avgADR: number;
}

export interface CategoryRevenue {
  categoryId: string;
  categoryName: string;
  unitsCount: number;
  reservationsCount: number;
  nightsSold: number;
  totalRevenue: number;
  occupancyRatePercent: number;
  avgADR: number;
  revPar: number;
}

export interface PropertyRevenue {
  propertyId: string;
  propertyName: string;
  totalUnits: number;
  reservationsCount: number;
  totalRevenue: number;
  occupancyRatePercent: number;
  adr: number;
  revPar: number;
}

export interface WeekdayOccupancy {
  dayOfWeek: string; // "Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"
  dayIndex: number; // 0 to 6
  nightsCount: number;
  occupancyRatePercent: number;
  avgRevenue: number;
}

export interface RevenueMetrics {
  totalRevenue: number;
  totalNightsSold: number;
  totalActiveReservations: number;
  occupancyTodayPercent: number;
  occupancyWeekPercent: number;
  occupancyMonthPercent: number;
  adr: number;           // Average Daily Rate
  revPar: number;        // Revenue Per Available Room
  averageLengthOfStay: number; // LOS (dias)
  averageLeadTimeDays: number; // Antecedência média de reservas
  cancellationRatePercent: number;
  noShowRatePercent: number;
  pickupLast7Days: {
    reservationsCaptured: number;
    revenueCaptured: number;
  };
  bookingPace: {
    period: string;
    totalBookings: number;
    totalRevenue: number;
    paceVsPreviousMonthPercent: number;
  };
}

export interface RevenueDashboard {
  summary: RevenueMetrics;
  forecast: {
    days7: ForecastDay[];
    days15: ForecastDay[];
    days30: ForecastDay[];
    avgForecastOccupancy7Days: number;
    avgForecastOccupancy15Days: number;
    avgForecastOccupancy30Days: number;
  };
  revenueByChannel: ChannelRevenue[];
  revenueByCategory: CategoryRevenue[];
  revenueByProperty: PropertyRevenue[];
  weekdayOccupancy: WeekdayOccupancy[];
  generatedAt: string;
}

export interface RevenueSummaryForAI {
  occupancyToday: number;
  occupancyWeek: number;
  occupancyMonth: number;
  adr: number;
  revPar: number;
  forecast7DaysOccupancy: number;
  topChannel: string;
  topChannelRevenue: number;
  alerts: string[];
  trends: string[];
}
