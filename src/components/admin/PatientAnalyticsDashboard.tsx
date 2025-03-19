import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FilterOptions, RiskFactorDistribution, RiskLevelDistribution, AgeDistribution, SubmissionTrend, QuestionnaireSummary, analyticsService } from "@/services/AnalyticsService";
import { ageRangeOptions, raceOptions } from "@/constants/questionnaireConstants";
import { CalendarIcon, ArrowUp, ArrowDown, DownloadIcon, FilterIcon, RefreshCw, AlertTriangle } from "lucide-react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Color constants
const RISK_COLORS = {
  High: "#ef4444", // red-500
  Moderate: "#f97316", // orange-500
  Low: "#22c55e", // green-500
};

const CHART_COLORS = [
  "#0ea5e9", // sky-500
  "#6366f1", // indigo-500
  "#a855f7", // purple-500
  "#ec4899", // pink-500
  "#f43f5e", // rose-500
  "#f97316", // orange-500
  "#eab308", // yellow-500
];

interface PatientAnalyticsDashboardProps {
  isAdmin?: boolean;
}

export default function PatientAnalyticsDashboard({ isAdmin = true }: PatientAnalyticsDashboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [functionsNotFound, setFunctionsNotFound] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    startDate: undefined,
    endDate: undefined,
    ageRanges: undefined,
    races: undefined,
    riskLevels: ["High", "Moderate", "Low"],
    period: "month",
    monthsBack: 6,
  });

  const [date, setDate] = useState<DateRange | undefined>({
    from: undefined,
    to: new Date(),
  });

  // Analytics data states
  const [summaryData, setSummaryData] = useState<QuestionnaireSummary>({
    total_count: 0,
    avg_score: 0,
    month_over_month_change: null,
  });
  const [riskFactors, setRiskFactors] = useState<RiskFactorDistribution[]>([]);
  const [riskLevels, setRiskLevels] = useState<RiskLevelDistribution[]>([]);
  const [ageDistribution, setAgeDistribution] = useState<AgeDistribution[]>([]);
  const [submissionTrend, setSubmissionTrend] = useState<SubmissionTrend[]>([]);

  // Selected filters
  const [selectedAges, setSelectedAges] = useState<string[]>([]);
  const [selectedRaces, setSelectedRaces] = useState<string[]>([]);
  const [selectedRiskLevels, setSelectedRiskLevels] = useState<string[]>(["High", "Moderate", "Low"]);
  const [timePeriod, setTimePeriod] = useState<"day" | "week" | "month">("month");

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  // Track API error count to detect missing functions
  const errorCountRef = useRef(0);
  
  const loadAnalyticsData = async () => {
    setIsLoading(true);
    errorCountRef.current = 0;
    
    try {
      // Apply current filters
      const currentFilters: FilterOptions = {
        startDate: date?.from,
        endDate: date?.to,
        ageRanges: selectedAges.length > 0 ? selectedAges : undefined,
        races: selectedRaces.length > 0 ? selectedRaces : undefined,
        riskLevels: selectedRiskLevels,
        period: timePeriod,
        monthsBack: 6,
      };

      // Helper function to handle API calls with error detection
      const fetchWithErrorHandling = async <T,>(
        fetchFn: (filters?: FilterOptions) => Promise<T>,
        defaultValue: T
      ): Promise<T> => {
        try {
          return await fetchFn(currentFilters);
        } catch (error: unknown) {
          console.error(`Error fetching data:`, error);
          
          // Check if error is a 404, which likely means SQL functions not installed
          const errorObj = error as {message?: string; error?: {message?: string}; status?: number};
          if (errorObj?.message?.includes('404') || 
              errorObj?.error?.message?.includes('404') ||
              errorObj?.status === 404) {
            errorCountRef.current += 1;
          }
          
          return defaultValue;
        }
      };

      // Fetch data with error handling
      const [summary, factors, levels, ages, trends] = await Promise.all([
        fetchWithErrorHandling(
          analyticsService.getQuestionnaireSummary,
          { total_count: 0, avg_score: 0, month_over_month_change: null }
        ),
        fetchWithErrorHandling(
          analyticsService.getRiskFactorDistribution,
          []
        ),
        fetchWithErrorHandling(
          analyticsService.getRiskLevelDistribution,
          []
        ),
        fetchWithErrorHandling(
          analyticsService.getAgeDistribution,
          []
        ),
        fetchWithErrorHandling(
          analyticsService.getSubmissionTrend,
          []
        ),
      ]);

      // If we got multiple 404 errors, the SQL functions are likely missing
      if (errorCountRef.current >= 3) {
        setFunctionsNotFound(true);
      } else {
        setFunctionsNotFound(false);
      }

      setSummaryData(summary);
      setRiskFactors(factors);
      setRiskLevels(levels);
      setAgeDistribution(ages);
      setSubmissionTrend(trends);
      setFilters(currentFilters);
    } catch (error) {
      console.error("Error loading analytics data:", error);
      toast.error("Failed to load analytics data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      const csvData = await analyticsService.exportQuestionnaireDataToCsv(filters);
      
      // Create a blob and download link
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = url;
      link.setAttribute('download', `patient-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Data exported successfully");
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error("Failed to export data");
    }
  };

  const resetFilters = () => {
    setSelectedAges([]);
    setSelectedRaces([]);
    setSelectedRiskLevels(["High", "Moderate", "Low"]);
    setTimePeriod("month");
    setDate({
      from: undefined,
      to: new Date(),
    });
    
    // Apply reset filters
    loadAnalyticsData();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between gap-4 items-start lg:items-center">
        <div>
          <h1 className="text-2xl font-bold">Patient Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Analyze anonymized patient questionnaire data and trends
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            disabled={isLoading}
          >
            <FilterIcon className="mr-2 h-4 w-4" />
            Reset Filters
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadAnalyticsData}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button 
            size="sm"
            onClick={handleExportData}
            disabled={isLoading || summaryData.total_count === 0}
          >
            <DownloadIcon className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <div className="text-3xl font-bold">{summaryData.total_count.toLocaleString()}</div>
              {summaryData.month_over_month_change !== null && (
                <div className={`flex items-center text-xs ${
                  summaryData.month_over_month_change >= 0 
                    ? "text-green-500" 
                    : "text-red-500"
                }`}>
                  {summaryData.month_over_month_change >= 0 ? (
                    <ArrowUp className="mr-1 h-3 w-3" />
                  ) : (
                    <ArrowDown className="mr-1 h-3 w-3" />
                  )}
                  <span>
                    {Math.abs(summaryData.month_over_month_change)}% from last month
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Risk Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <div className="text-3xl font-bold">{summaryData.avg_score?.toFixed(1)} / 16</div>
              <div className="text-xs text-muted-foreground">
                Based on point values for risk factors
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                {riskLevels.map((level) => (
                  <div key={level.risk_level} className="flex items-center text-xs">
                    <div 
                      className="h-3 w-3 rounded-full mr-2" 
                      style={{ backgroundColor: RISK_COLORS[level.risk_level as keyof typeof RISK_COLORS] || "#888" }}
                    />
                    <span className="font-medium">{level.risk_level}</span>
                    <span className="ml-2">
                      {level.percentage}% ({level.count})
                    </span>
                  </div>
                ))}
              </div>
              <div className="h-16 w-16">
                {riskLevels.length > 0 && (
                  <PieChart width={64} height={64}>
                    <Pie
                      data={riskLevels}
                      cx="50%"
                      cy="50%"
                      innerRadius={15}
                      outerRadius={30}
                      dataKey="count"
                      nameKey="risk_level"
                    >
                      {riskLevels.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={RISK_COLORS[entry.risk_level as keyof typeof RISK_COLORS] || "#888"} 
                        />
                      ))}
                    </Pie>
                  </PieChart>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Panel with sections removed for brevity */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <FilterIcon className="mr-2 h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Date Range */}
            <div>
              <Label className="text-xs">Date Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal mt-1"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (
                      date.to ? (
                        <>
                          {format(date.from, "MMM d, yyyy")} -{" "}
                          {format(date.to, "MMM d, yyyy")}
                        </>
                      ) : (
                        format(date.from, "MMM d, yyyy")
                      )
                    ) : (
                      "All time"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={(newDate) => {
                      setDate(newDate);
                    }}
                    numberOfMonths={2}
                  />
                  <div className="flex items-center justify-between p-3 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDate(undefined)}
                    >
                      Clear
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        loadAnalyticsData();
                        // Close popover by clicking outside or similar
                      }}
                    >
                      Apply
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Age Filter */}
            <div>
              <Label className="text-xs">Age Groups</Label>
              <Select>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All ages" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2 max-h-60 overflow-auto flex flex-col gap-2">
                    {ageRangeOptions.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`age-${option.value}`}
                          checked={selectedAges.includes(option.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedAges([...selectedAges, option.value]);
                            } else {
                              setSelectedAges(selectedAges.filter(v => v !== option.value));
                            }
                          }}
                        />
                        <Label htmlFor={`age-${option.value}`} className="text-sm">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => {
                        loadAnalyticsData();
                        // Close dropdown
                        document.body.click();
                      }}
                    >
                      Apply
                    </Button>
                  </div>
                </SelectContent>
              </Select>
            </div>

            {/* Race Filter */}
            <div>
              <Label className="text-xs">Race</Label>
              <Select>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All races" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2 max-h-60 overflow-auto flex flex-col gap-2">
                    {raceOptions.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`race-${option.value}`}
                          checked={selectedRaces.includes(option.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedRaces([...selectedRaces, option.value]);
                            } else {
                              setSelectedRaces(selectedRaces.filter(v => v !== option.value));
                            }
                          }}
                        />
                        <Label htmlFor={`race-${option.value}`} className="text-sm">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => {
                        loadAnalyticsData();
                        // Close dropdown
                        document.body.click();
                      }}
                    >
                      Apply
                    </Button>
                  </div>
                </SelectContent>
              </Select>
            </div>

            {/* Risk Level Filter */}
            <div>
              <Label className="text-xs">Risk Level</Label>
              <div className="flex items-center space-x-4 mt-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="risk-high"
                    checked={selectedRiskLevels.includes("High")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedRiskLevels([...selectedRiskLevels, "High"]);
                      } else {
                        setSelectedRiskLevels(selectedRiskLevels.filter(v => v !== "High"));
                      }
                    }}
                  />
                  <Label
                    htmlFor="risk-high"
                    className="text-sm font-medium"
                    style={{ color: RISK_COLORS.High }}
                  >
                    High
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="risk-moderate"
                    checked={selectedRiskLevels.includes("Moderate")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedRiskLevels([...selectedRiskLevels, "Moderate"]);
                      } else {
                        setSelectedRiskLevels(selectedRiskLevels.filter(v => v !== "Moderate"));
                      }
                    }}
                  />
                  <Label
                    htmlFor="risk-moderate"
                    className="text-sm font-medium"
                    style={{ color: RISK_COLORS.Moderate }}
                  >
                    Moderate
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="risk-low"
                    checked={selectedRiskLevels.includes("Low")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedRiskLevels([...selectedRiskLevels, "Low"]);
                      } else {
                        setSelectedRiskLevels(selectedRiskLevels.filter(v => v !== "Low"));
                      }
                    }}
                  />
                  <Label
                    htmlFor="risk-low"
                    className="text-sm font-medium"
                    style={{ color: RISK_COLORS.Low }}
                  >
                    Low
                  </Label>
                </div>
              </div>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Time Period for Trend Chart</Label>
              <div className="flex mt-1 space-x-2">
                <Button
                  variant={timePeriod === "day" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setTimePeriod("day");
                    loadAnalyticsData();
                  }}
                >
                  Daily
                </Button>
                <Button
                  variant={timePeriod === "week" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setTimePeriod("week");
                    loadAnalyticsData();
                  }}
                >
                  Weekly
                </Button>
                <Button
                  variant={timePeriod === "month" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setTimePeriod("month");
                    loadAnalyticsData();
                  }}
                >
                  Monthly
                </Button>
              </div>
            </div>
            
            <div className="flex items-end justify-end">
              <Button onClick={loadAnalyticsData} disabled={isLoading}>
                {isLoading ? "Loading..." : "Apply Filters"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visualization Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Submission Trend */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Submission Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {submissionTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={submissionTrend}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="time_period" 
                      tickFormatter={(value) => {
                        // Format based on period type
                        if (timePeriod === "month") {
                          const [year, month] = value.split("-");
                          return `${month}/${year.slice(2)}`;
                        } else if (timePeriod === "week") {
                          return value.split("-").slice(1).join("/"); // MM/DD
                        }
                        return value.split("-").slice(1).join("/"); // MM/DD
                      }}
                    />
                    <YAxis allowDecimals={false} />
                    <Tooltip 
                      formatter={(value: number) => [value, "Submissions"]}
                      labelFormatter={(label) => {
                        if (timePeriod === "month") {
                          const [year, month] = label.split("-");
                          const date = new Date(parseInt(year), parseInt(month) - 1);
                          return format(date, "MMMM yyyy");
                        } else if (timePeriod === "week") {
                          return `Week of ${label}`;
                        }
                        return label;
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#0ea5e9"
                      name="Submissions"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">No trend data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Risk Factor Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Factor Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {riskFactors.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={riskFactors}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} unit="%" />
                    <YAxis
                      type="category"
                      dataKey="factor"
                      tick={{ fontSize: 12 }}
                      width={100}
                    />
                    <Tooltip
                      formatter={(value: number) => [`${value}%`, "Percentage"]}
                    />
                    <Bar
                      dataKey="percentage"
                      fill="#0ea5e9"
                      radius={[0, 4, 4, 0]}
                      label={{ 
                        position: 'right', 
                        formatter: (item: RiskFactorDistribution) => `${item.percentage}%` 
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">No risk factor data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Age Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Age Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {ageDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={ageDistribution}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="age_range" />
                    <YAxis unit="%" />
                    <Tooltip
                      formatter={(value: number) => [`${value}%`, "Percentage"]}
                    />
                    <Legend />
                    <Bar
                      dataKey="percentage"
                      name="Percentage"
                      fill="#6366f1"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">No age distribution data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Functions not found error */}
      {functionsNotFound && (
        <Card className="border-red-300 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertTriangle size={20} />
              Analytics Functions Not Found
            </CardTitle>
          </CardHeader>
          <CardContent className="text-red-800">
            <p className="mb-4">
              The SQL functions required by the analytics dashboard have not been deployed to your Supabase database.
              This is expected when you're setting up the analytics dashboard for the first time.
            </p>
            <div className="bg-white p-4 rounded border border-red-200 mb-4">
              <h4 className="font-semibold mb-2">Error Details:</h4>
              <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                404 Not Found: RPC functions not available
              </p>
            </div>
            <p className="font-semibold">To fix this issue:</p>
            <ol className="list-decimal ml-6 space-y-2 mt-2 mb-4">
              <li>Open the SQL file located at <code className="bg-gray-100 px-1 py-0.5 rounded">eyesentry/supabase/create_analytics_functions.sql</code></li>
              <li>Execute the SQL in your Supabase database using the SQL Editor in the Supabase Dashboard</li>
              <li>Return to this page and click "Refresh" to reload the analytics data</li>
            </ol>
            <p>
              For detailed instructions, please refer to the 
              <a href="#" className="text-blue-700 underline mx-1">Analytics Dashboard Setup Documentation</a>
              in the <code className="bg-gray-100 px-1 py-0.5 rounded">ANALYTICS_DASHBOARD_SETUP.md</code> file.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => window.open('https://app.supabase.io', '_blank')}
            >
              Open Supabase Dashboard
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* No data message */}
      {!isLoading && !functionsNotFound && summaryData.total_count === 0 && (
        <Card className="bg-muted/20">
          <CardContent className="py-10">
            <div className="text-center">
              <h3 className="text-lg font-semibold">No Data Available</h3>
              <p className="text-muted-foreground mt-2">
                There are no patient questionnaires in the database that match your filters.
              </p>
              <Button className="mt-4" onClick={resetFilters}>
                Reset Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
