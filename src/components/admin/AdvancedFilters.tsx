import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Filter, 
  X, 
  SlidersHorizontal,
  Calendar,
  Star,
  MapPin,
  Users
} from 'lucide-react';

export interface FilterOptions {
  search: string;
  status: string;
  tier: string;
  rating: string;
  availability: string;
  location: string;
  joinedDate: string;
  complaints: string;
  jobsCompleted: string;
}

interface AdvancedFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onClearFilters: () => void;
  totalResults: number;
  filteredResults: number;
}

export function AdvancedFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  totalResults,
  filteredResults
}: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = (key: keyof FilterOptions, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value && value !== 'all').length;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search & Filter
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount} active
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              {isExpanded ? 'Simple' : 'Advanced'}
            </Button>
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={onClearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          Showing {filteredResults} of {totalResults} subcontractors
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search Bar - Always Visible */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, phone, or location..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Quick Filters - Always Visible */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="status" className="text-sm font-medium">Status</Label>
            <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
              <SelectTrigger id="status">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="availability" className="text-sm font-medium">Availability</Label>
            <Select value={filters.availability} onValueChange={(value) => updateFilter('availability', value)}>
              <SelectTrigger id="availability">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="unavailable">Unavailable</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="tier" className="text-sm font-medium">Tier Level</Label>
            <Select value={filters.tier} onValueChange={(value) => updateFilter('tier', value)}>
              <SelectTrigger id="tier">
                <SelectValue placeholder="All Tiers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="1">Tier 1 - Standard</SelectItem>
                <SelectItem value="2">Tier 2 - Professional</SelectItem>
                <SelectItem value="3">Tier 3 - Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="rating" className="text-sm font-medium">Min Rating</Label>
            <Select value={filters.rating} onValueChange={(value) => updateFilter('rating', value)}>
              <SelectTrigger id="rating">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Rating</SelectItem>
                <SelectItem value="4.5">4.5+ Stars</SelectItem>
                <SelectItem value="4.0">4.0+ Stars</SelectItem>
                <SelectItem value="3.5">3.5+ Stars</SelectItem>
                <SelectItem value="3.0">3.0+ Stars</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advanced Filters - Expandable */}
        {isExpanded && (
          <>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="location" className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </Label>
                <Input
                  id="location"
                  placeholder="City, State"
                  value={filters.location}
                  onChange={(e) => updateFilter('location', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="joinedDate" className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Joined Date
                </Label>
                <Select value={filters.joinedDate} onValueChange={(value) => updateFilter('joinedDate', value)}>
                  <SelectTrigger id="joinedDate">
                    <SelectValue placeholder="Any time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any time</SelectItem>
                    <SelectItem value="last_week">Last week</SelectItem>
                    <SelectItem value="last_month">Last month</SelectItem>
                    <SelectItem value="last_3_months">Last 3 months</SelectItem>
                    <SelectItem value="last_6_months">Last 6 months</SelectItem>
                    <SelectItem value="last_year">Last year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="complaints" className="text-sm font-medium">Complaints</Label>
                <Select value={filters.complaints} onValueChange={(value) => updateFilter('complaints', value)}>
                  <SelectTrigger id="complaints">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any</SelectItem>
                    <SelectItem value="0">No complaints</SelectItem>
                    <SelectItem value="1-2">1-2 complaints</SelectItem>
                    <SelectItem value="3+">3+ complaints</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="jobsCompleted" className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Jobs Completed
                </Label>
                <Select value={filters.jobsCompleted} onValueChange={(value) => updateFilter('jobsCompleted', value)}>
                  <SelectTrigger id="jobsCompleted">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any</SelectItem>
                    <SelectItem value="0">No jobs</SelectItem>
                    <SelectItem value="1-10">1-10 jobs</SelectItem>
                    <SelectItem value="11-25">11-25 jobs</SelectItem>
                    <SelectItem value="26-50">26-50 jobs</SelectItem>
                    <SelectItem value="50+">50+ jobs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <>
            <Separator />
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-muted-foreground">Active filters:</span>
              {Object.entries(filters).map(([key, value]) => {
                if (!value || value === 'all') return null;
                return (
                  <Badge key={key} variant="secondary" className="flex items-center gap-1">
                    {key}: {value}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => updateFilter(key as keyof FilterOptions, 'all')}
                    />
                  </Badge>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}