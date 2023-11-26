// main.component.ts
import { Component, ElementRef } from '@angular/core';
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
    this.map = L.map('map');
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 17,
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
    let radius = e.accuracy;
    L.marker(e.latlng).addTo(this.map)
      .bindPopup("Tu ubicación alrededor de " + radius + " metros").openPopup();
    L.circle(e.latlng, radius).addTo(this.map);
  }

  onLocationError(e: any) {
    this.map.setView([20.65874, -88.53467], 8);
  }

  loadMarkers(reload: boolean = false) {
    this.apiService.getZonasArqueologicas({ "search": this.selectedOptions }).subscribe(data => {
      this.map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker) {
          layer.remove();
        }
      });
      if(this.selectedOptions.length > 0){
          this.map.setView([data[0].gmaps_latitud, data[0].gmaps_longitud], 7)
      }
      data.forEach((e: any) => {
        const marker = L.marker([e.gmaps_latitud, e.gmaps_longitud]).bindPopup(
          `<span>
          ${e.zona_arqueologica_nombre}
          <br>
          <small>
            <i class="bi bi-geo-alt-fill"></i>
            <span class="mt-3">${e.nom_mun}</span>
            <br>
          </span>`
        ).on('click', () => {
          this.RenderPreview(e);
        });
        marker.addTo(this.map);
      });

      if(reload && data.length == 1){
        this.RenderPreview(data[0]);
      }
    });
  }

  RenderPreview(data: any) {
    this.validateContent();

    const $zonaPreview = document.getElementById('zonaPreview');
    if (!$zonaPreview) return;

    if(!data) return;

    const { zona_arqueologica_nombre: nombre, nom_ent: estado, nom_mun: municipio, zones_description = {} } = data;
    const { horario = '', img = '', relevancia_cultural: descripcion = ''} = zones_description;
    const html = `
    <div>
      <div class="row">
          <div class="col-sm-12 col-md-6">
            <img class="img-fluid" src="${img}" alt="img-${nombre}">
          </div>
          <div class="row col-sm-12 col-md-6">
            <div>
              <span class="fs-1 fw-bold">${nombre}</span>
            </div>
              <span class="fs-5">${estado}</span>
            <div>
            </div>
            <div>
              <small>
                <i class="bi bi-geo-alt-fill"></i>
                <span class="mt-3">${municipio}</span>
              </small>
            </div>
            <div>
              ${horario}
            </div>
          </div>
      </div>
      <div style="text-align:justify; max-height: 15rem; overflow: hidden;">
          <span class="d-none d-md-inline">
            ${descripcion}
          </span>
      </div>
      <div class="d-grid gap-2 d-md-flex justify-content-md-end">
        <button id="createModal" class="btn btn-sm btn-primary mt-3 rounded-pill">Ver más detalles...</button>
      </div>
    </div>`;
    $zonaPreview.innerHTML = html;

    const $createModal = document.getElementById('createModal');

    if(!$createModal) return;

    this.validateContent();

    $createModal.onclick = () => {
      this.$createModal(data);
    }
  }

  $createModal(data: any) {
    console.log(data);
  }

  validateContent() {
    const $bienvenida = document.getElementById('bienvenida');
    const $zonaPreview = document.getElementById('zonaPreview');

    if(!$bienvenida) return;
    if(!$zonaPreview) return;

    if ($zonaPreview.innerHTML === '') {
      $bienvenida.classList.remove('d-none');
      $zonaPreview.classList.add('d-none');
    } else {
      $bienvenida.classList.add('d-none');
      $zonaPreview.classList.remove('d-none');
    }
  }

  ChangeInput(value: any) {
    // Actualizar opciones seleccionadas
    this.selectedOptions = [value];

    // Volver a cargar los marcadores
    this.loadMarkers(true);
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
      const selectElement = [...this.el.nativeElement.querySelectorAll('.tom-select')];
      selectElement.forEach((e: any) => {
        new TomSelect(e, tomSelectConfig);
      });
    });
  }
}
