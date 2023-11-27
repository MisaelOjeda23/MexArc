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
          `<span class="text-primary">
          ${e.zona_arqueologica_nombre}
          <br>
          <small>
            <i class="bi bi-geo-alt-fill"></i>
            <span class="mt-3">${e.nom_mun}</span>
            <br>
            <p>${e.gmaps_latitud}, ${e.gmaps_longitud}</p>
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

    const { gmaps_latitud: x, gmaps_longitud: y, email: email, pagina_web: pweb, zona_arqueologica_nombre: nombre, nom_ent: estado, nom_mun: municipio, zones_description = {} } = data;
    const { contacto: contacto,acceso: acceso, significado: cultura, horario = '', img = '', relevancia_cultural: descripcion = ''} = zones_description;
    const html = `

    <div>
      <div class="row">
          <div class="col-sm-12 col-md-6 mb-3">
            <img class="img-fluid" src="${img}" alt="img-${nombre}">
          </div>
          <div class="row col-sm-12 col-md-6">
            <div>
              <span class="fs-1 fw-bold">${nombre}</span>
            </div>
            <div>
              <small>
                <i class="bi bi-geo-alt-fill"></i>
                <span class="mt-3">${municipio}, ${estado}</span>
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
        <button id="createModal" class="openModal btn btn-sm btn-primary mt-3 rounded-pill">Ver más detalles...</button>
      </div>

      <div class="mod">
        <div class="mod-content"> 
          <h2 class="fw-bold mb-3">${nombre}</h2>
          <div class="mod-img justify-content-center">
            <img class="img-fluid w-100" src="${img}" alt="img-${nombre}">
          </div>
          <div class="mt-3 fw-bold">
                <i class="bi bi-geo-alt-fill"></i>
                <span class="mt-3">${municipio}, ${estado}</span>
          </div>
          <div class="my-3 fw-bold">Coordernadas: ${x}, ${y}</div>
          <p>${descripcion}</p>
          <h3 class="my-3 fw-bold">Cultura</h3>
          <p>${cultura}<p>
          <h3 class="my-3 fw-bold">Acceso</h3>
          <p>${acceso}<p>
          <h3 class="my-3 fw-bold">Contacto</h3>
          <div class="mb-3">
            <p class="mt-0">Email: ${email}<p>
            <p class="mt-0">Números: ${contacto}<p>
            <p class="mt-0">Página oficial: <a href="${pweb}">${pweb}</a><p>
          </div>
          <div class="modal-footer d-flex mt-2">
            <button class="close btn btn-sm btn-secondary rounded-pill">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
    
    <style>

    .mod {
      z-index: 1060;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #111111bd;
      display: flex;
      opacity: 0;
      pointer-events: none;
      transition: opacity .3s;
      overflow: auto;
    }

    .mod-show {
      opacity: 1;
      pointer-events: unset;
      transition: opacity .3s;
    }

    .mod-content {
      background-color: #00001e;
      margin: auto;
      width: 90%;
      max-width: 700px;
      border-radius: 10px;
      padding: 3em 2.5em;
    }

    </style>
    `;
    $zonaPreview.innerHTML = html;

    const $createModal = document.getElementById('createModal');
    const $openModal = document.querySelector('.openModal');
    const $modal = document.querySelector('.mod');
    const $close = document.querySelector('.close');

    if (!$createModal) return; if (!$openModal) return; if (!$modal) return; if (!$close) return;

    $openModal.addEventListener('click', (e) =>{
      e.preventDefault();
      $modal.classList.add('mod-show')
    });

    $close.addEventListener('click', (e) =>{
      e.preventDefault();
      $modal.classList.remove('mod-show')
    });

    this.validateContent();

    $createModal.onclick = () => {
      this.$createModal(data);
    }
  }

  initStreetView(data: any) {
    if(!data) {
      console.error('No se ha recibido información para cargar el street view');
      return;
    }
    const $streetView = document.getElementById('street-view');
    const $btnStreet = document.getElementById('btn-street-view');

    if (!$streetView) return;
    if (!$btnStreet) return;
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

    $btnStreet.classList.remove('d-none');
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
      $map.classList.remove('d-none');
    }

    $btnStreet.onclick = () => {
      $streetView.classList.remove('d-none');
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
