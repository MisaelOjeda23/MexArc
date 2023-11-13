// main.component.ts
import { Component, ElementRef, OnInit, AfterViewInit } from '@angular/core';
import { ApiService } from '../api.service';
import TomSelect from 'tom-select';

declare let L: any;

type TomSelectConfig = {
  options: any[];
  multiple: boolean;
  onChange: (value: any) => any;
};

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent {
  selectedOptions: any[] = [];
  private map: any; // Cambia el tipo según el mapa que estés utilizando

  constructor(private apiService: ApiService, private el: ElementRef) {}

  ngOnInit() {
    this.initMap();
  }

  initMap() {
    this.map = L.map('map').setView([20.65874, -88.53467], 8);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    this.map.locate({
      setView: true,
      maxZoom: 7
    });

    this.map.on('locationfound', this.onLocationFound.bind(this));
    this.map.on('locationerror', this.onLocationError.bind(this));

    this.loadMarkers(); // Cargar marcadores inicialmente
  }

  onLocationFound(e: any) {
    var radius = e.accuracy;
    console.log(e);
    L.marker(e.latlng).addTo(this.map)
      .bindPopup("Tu ubicación alrededor de " + radius + " metros").openPopup();
    L.circle(e.latlng, radius).addTo(this.map);
  }

  onLocationError(e: any) {
    this.map.setView([20.65874, -88.53467], 8);
  }

  loadMarkers() {
    this.apiService.getZonasArqueologicas({ "search": this.selectedOptions }).subscribe(data => {
      // Limpiar los marcadores existentes
    
      this.map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker) {
          layer.remove();
        }
      });
      // Agregar nuevos marcadores al mapa
      data.forEach((e: any) => {
        const marker = L.marker([e.gmaps_latitud, e.gmaps_longitud]).bindPopup(
          `<a href="/zona-arqueologica/${e.id}">${e.zona_arqueologica_nombre}</a><br>${e.zona_arqueologica_calle_numero}`
        );
        marker.addTo(this.map);
      });
    });
  }

  ChangeInput(value: any) {
    // Actualizar opciones seleccionadas
    this.selectedOptions = [value];

    // Volver a cargar los marcadores
    this.loadMarkers();
  }

  ngAfterViewInit() {
    this.apiService.getInfoFilters().subscribe(data => {
      const options = data.map((e: any) => ({
        value: e.id,
        text: e.name
      }));

      const tomSelectConfig: TomSelectConfig = {
        options: options,
        multiple: true,
        onChange: (value: any) => this.ChangeInput(value),
        // Otras configuraciones
      };

      // Inicializar TomSelect con las opciones
      const selectElement = this.el.nativeElement.querySelector('.tom-select');
      const tomSelect = new TomSelect(selectElement, tomSelectConfig);
    });
  }
}
