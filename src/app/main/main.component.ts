// main.component.ts
import { Component, ElementRef } from '@angular/core';
import { ApiService } from '../api.service';
import TomSelect from 'tom-select';

declare let L: any;
declare let google: any;

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
          this.initStreetView(e);
        });
        marker.addTo(this.map);
      });

      if(reload && data.length == 1){
        this.RenderPreview(data[0]);
        this.initStreetView(data[0]);
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
            <img class="img-fluid" style="border-radius: 10px; min-width: 300px; min-height: 200px;" src="${img}" alt="img-${nombre}">
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
      <div class="mt-2" style="text-align:justify; max-height: 15rem; overflow: hidden;">
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

  initStreetView(data: any) {
    const sv = new google.maps.StreetViewService();
    if(!data) {
      console.error('No se ha recibido información para cargar el street view');
      return;
    }
    const $streetView = document.getElementById('street-view');
    const $btnStreet = document.getElementById('btn-street-view');

    if (!$streetView) return;
    if (!$btnStreet) return;

    $streetView.innerHTML = '';

    let { gmaps_latitud: latitud = 21.1463757, gmaps_longitud: longitud = -86.8248354 } = data;
    latitud = parseFloat(latitud);
    longitud = parseFloat(longitud);

    if (isNaN(latitud) || isNaN(longitud)) {
      console.error('No se ha recibido información para cargar el street view');
      return;
    }

    const _panorama = new google.maps.StreetViewPanorama(
      $streetView,
      {
        position: { lat: latitud, lng: longitud },
        pov: { heading: 165, pitch: 0 },
        zoom: 1
      }
    );

    sv.getPanorama({ location: { lat: latitud, lng: longitud }, radius: 50 }, (data: any, status: any) => {
      if (data == null) {
        $btnStreet.classList.add('d-none');
      } else {
        $btnStreet.classList.remove('d-none');
      }
    });
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

  changeViewBehaviour(){
    const $btnMap = document.getElementById('btn-map-view');
    const $btnStreet = document.getElementById('btn-street-view');

    const $streetView = document.getElementById('street-view');
    const $map = document.getElementById('map');

    if(!$btnMap) return;
    if(!$btnStreet) return;
    if(!$streetView) return;
    if(!$map) return;

    $btnMap.onclick = () => {
      $streetView.classList.add('d-none');
      $btnStreet.classList.remove('active');
      $btnMap.classList.add('active');
      $map.classList.remove('d-none');
    }

    $btnStreet.onclick = () => {
      $btnStreet.classList.add('active');
      $streetView.classList.remove('d-none');
      $btnMap.classList.remove('active');
      $map.classList.add('d-none');
    }
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

    this.changeViewBehaviour();
  }
}
