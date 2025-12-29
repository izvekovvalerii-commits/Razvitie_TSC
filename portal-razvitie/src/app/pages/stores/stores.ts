import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoresService } from '../../services/stores';
import { Store } from '../../models/store.model';

@Component({
  selector: 'app-stores',
  imports: [CommonModule],
  templateUrl: './stores.html',
  styleUrl: './stores.css'
})
export class StoresComponent implements OnInit {
  stores: Store[] = [];
  loading = true;
  error: string | null = null;

  selectedStatuses: string[] = [];
  selectedRegions: string[] = [];
  selectedCities: string[] = [];
  viewMode: 'grid' | 'table' = 'grid';

  statusDropdownOpen = false;
  regionDropdownOpen = false;
  cityDropdownOpen = false;

  statusOptions = ['Активный', 'Планируется', 'Ремонт'];

  get regionOptions(): string[] {
    const regions = new Set(this.stores.map(s => s.region).filter(r => r));
    return Array.from(regions).sort();
  }

  get cityOptions(): string[] {
    const cities = new Set(this.stores.map(s => s.city).filter(c => c));
    return Array.from(cities).sort();
  }

  get filteredStores(): Store[] {
    return this.stores.filter(store => {
      // Status filter
      if (this.selectedStatuses.length > 0) {
        const statusMap: { [key: string]: string } = {
          'Активный': 'Active',
          'Планируется': 'Planning',
          'Ремонт': 'Renovation'
        };
        const storeStatusRu = Object.keys(statusMap).find(key => statusMap[key] === store.status);
        if (!storeStatusRu || !this.selectedStatuses.includes(storeStatusRu)) {
          return false;
        }
      }

      // Region filter
      if (this.selectedRegions.length > 0 && !this.selectedRegions.includes(store.region)) {
        return false;
      }

      // City filter
      if (this.selectedCities.length > 0 && !this.selectedCities.includes(store.city)) {
        return false;
      }

      return true;
    });
  }

  toggleStatusDropdown() {
    this.statusDropdownOpen = !this.statusDropdownOpen;
    if (this.statusDropdownOpen) {
      this.regionDropdownOpen = false;
      this.cityDropdownOpen = false;
    }
  }

  toggleRegionDropdown() {
    this.regionDropdownOpen = !this.regionDropdownOpen;
    if (this.regionDropdownOpen) {
      this.statusDropdownOpen = false;
      this.cityDropdownOpen = false;
    }
  }

  toggleCityDropdown() {
    this.cityDropdownOpen = !this.cityDropdownOpen;
    if (this.cityDropdownOpen) {
      this.statusDropdownOpen = false;
      this.regionDropdownOpen = false;
    }
  }

  toggleStatus(status: string) {
    const index = this.selectedStatuses.indexOf(status);
    if (index > -1) {
      this.selectedStatuses.splice(index, 1);
    } else {
      this.selectedStatuses.push(status);
    }
  }

  toggleRegion(region: string) {
    const index = this.selectedRegions.indexOf(region);
    if (index > -1) {
      this.selectedRegions.splice(index, 1);
    } else {
      this.selectedRegions.push(region);
    }
  }

  toggleCity(city: string) {
    const index = this.selectedCities.indexOf(city);
    if (index > -1) {
      this.selectedCities.splice(index, 1);
    } else {
      this.selectedCities.push(city);
    }
  }

  clearStatusFilter() {
    this.selectedStatuses = [];
  }

  clearRegionFilter() {
    this.selectedRegions = [];
  }

  clearCityFilter() {
    this.selectedCities = [];
  }

  getFilterLabel(type: 'status' | 'region' | 'city'): string {
    let selected: string[];
    let label: string;

    switch (type) {
      case 'status':
        selected = this.selectedStatuses;
        label = 'Статус';
        break;
      case 'region':
        selected = this.selectedRegions;
        label = 'Регион';
        break;
      case 'city':
        selected = this.selectedCities;
        label = 'Город';
        break;
    }

    if (selected.length === 0) {
      return label;
    } else if (selected.length === 1) {
      return selected[0];
    } else {
      return `${label} (${selected.length})`;
    }
  }

  constructor(
    private storesService: StoresService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadStores();
  }

  loadStores() {
    console.log('Loading stores...');
    this.loading = true;
    this.error = null;

    this.storesService.getStores().subscribe({
      next: (data) => {
        console.log('Stores loaded successfully:', data);
        this.stores = data;
        this.loading = false;
        this.cdr.detectChanges(); // Force UI update
      },
      error: (err) => {
        console.error('Error loading stores:', err);
        this.error = `Ошибка загрузки данных: ${err.message || err.status || 'Неизвестная ошибка'}`;
        this.loading = false;
        this.cdr.detectChanges(); // Force UI update
      },
      complete: () => {
        console.log('Stores loading completed');
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Active': return 'status-active';
      case 'Planning': return 'status-planning';
      case 'Renovation': return 'status-renovation';
      default: return '';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'Active': return 'Активный';
      case 'Planning': return 'Планируется';
      case 'Renovation': return 'Ремонт';
      default: return status;
    }
  }
}
