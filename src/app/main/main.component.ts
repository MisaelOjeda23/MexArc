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
          this.renderPreview(e);
          this.initStreetView(e);
          this.insertModal(e, {}, true);
        });
        marker.addTo(this.map);
      });

      if(data.length > 5){
        this.createRecomendations(data);
      }
      if(reload && data.length == 1){
        this.renderPreview(data[0]);
        this.initStreetView(data[0]);
      }
    });
  }

  insertModal(data: any, config: any, remove: boolean = false) {
    if (!data) return;

    if(remove){
      const $modals = Array.from(document.querySelectorAll('.modal-detail'));
      if ($modals.length > 0) {
        $modals.forEach((e: any) => e.remove());
      }
    }
    const { modalID = '' } = config;

    const {
      zona_arqueologica_id: id,
      zones_description: descripcion = {},
      zona_arqueologica_nombre: nombre,
      gmaps_latitud: latitud,
      gmaps_longitud: longitud,
      email,
      pagina_web,
      zona_arqueologica_telefono1: telefono,
      nom_mun: municipio,
      nom_ent: estado,
      nom_loc: localidad
    } = data;

    const { acceso, significado,  relevancia_cultural, img = '', horario } = descripcion;

    const html = `
        <div class="modal fade" id="${modalID ? `${modalID}` : `zona-modal-${id}`}" tabindex="-1" aria-labelledby="${modalID ? `` : `zona-modal-${id}`}Label" aria-hidden="true">
          <div class="modal-dialog">
            <div class="modal-content" style="background-color: #00001e;">
              <div class="modal-header">
                <h1 class="modal-title fs-3 fw-bold" id="${modalID ? `` : `zona-modal-${id}`}Label">${nombre}</h1>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <div class="mb-3" style="display: flex; align-items: center; flex-direction: column;">
                  <img class="img-fluid" style=" border-radius:5px; min-width: 406px; min-height: 300px;" src="${img}" alt="img-${nombre}">
                </div>
                ${significado ? `<section class="row"><span class="fs-3 fw-bold">Significado</span><p>${significado}</p></section>` : ''}
                ${relevancia_cultural ? `<section class="row"><span class="fs-3 fw-bold">Relevancia Cultural</span><p>${relevancia_cultural}</p></section>` : ''}
                <section class="row">
                <span class="fs-3 fw-bold">Locación</span>
                  <p class="fw-bold"><p>${localidad}, ${municipio}, ${estado}</p></p>
                </section>
                ${horario ? `<section class="row"><span class="fs-3 fw-bold">Horario</span>${horario}</section>` : ''}
                ${acceso ? `<section class="row"><span class="fs-3 fw-bold">Acceso</span><p>${acceso}</p></section>` : ''}
                <section class="row">
                  <span class="fs-3 fw-bold">Contacto</span>
                  ${pagina_web ? `<p class="fw-bold mt-3"><svg class="me-2" xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512"><!--! Font Awesome Pro 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><style>svg{fill:#ffffff}</style><path d="M256 464c7.4 0 27-7.2 47.6-48.4c8.8-17.7 16.4-39.2 22-63.6H186.4c5.6 24.4 13.2 45.9 22 63.6C229 456.8 248.6 464 256 464zM178.5 304h155c1.6-15.3 2.5-31.4 2.5-48s-.9-32.7-2.5-48h-155c-1.6 15.3-2.5 31.4-2.5 48s.9 32.7 2.5 48zm7.9-144H325.6c-5.6-24.4-13.2-45.9-22-63.6C283 55.2 263.4 48 256 48s-27 7.2-47.6 48.4c-8.8 17.7-16.4 39.2-22 63.6zm195.3 48c1.5 15.5 2.2 31.6 2.2 48s-.8 32.5-2.2 48h76.7c3.6-15.4 5.6-31.5 5.6-48s-1.9-32.6-5.6-48H381.8zm58.8-48c-21.4-41.1-56.1-74.1-98.4-93.4c14.1 25.6 25.3 57.5 32.6 93.4h65.9zm-303.3 0c7.3-35.9 18.5-67.7 32.6-93.4c-42.3 19.3-77 52.3-98.4 93.4h65.9zM53.6 208c-3.6 15.4-5.6 31.5-5.6 48s1.9 32.6 5.6 48h76.7c-1.5-15.5-2.2-31.6-2.2-48s.8-32.5 2.2-48H53.6zM342.1 445.4c42.3-19.3 77-52.3 98.4-93.4H374.7c-7.3 35.9-18.5 67.7-32.6 93.4zm-172.2 0c-14.1-25.6-25.3-57.5-32.6-93.4H71.4c21.4 41.1 56.1 74.1 98.4 93.4zM256 512A256 256 0 1 1 256 0a256 256 0 1 1 0 512z"/></svg><a target="_blank" href="${pagina_web}">${pagina_web}</a></p>` : ''}
                  ${email ? `<p class="fw-bold mt-3"><svg class="me-2" xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><style>svg{fill:#ffffff}</style><path d="M64 112c-8.8 0-16 7.2-16 16v22.1L220.5 291.7c20.7 17 50.4 17 71.1 0L464 150.1V128c0-8.8-7.2-16-16-16H64zM48 212.2V384c0 8.8 7.2 16 16 16H448c8.8 0 16-7.2 16-16V212.2L322 328.8c-38.4 31.5-93.7 31.5-132 0L48 212.2zM0 128C0 92.7 28.7 64 64 64H448c35.3 0 64 28.7 64 64V384c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V128z"/></svg><a href="mailto:${email}">${email}</a></p>` : ''}
                  ${telefono ? `<p class="fw-bold mt-3"><svg class="me-2" xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512"><!--! Font Awesome Pro 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><style>svg{fill:#ffffff}</style><path d="M375.8 275.2c-16.4-7-35.4-2.4-46.7 11.4l-33.2 40.6c-46-26.7-84.4-65.1-111.1-111.1L225.3 183c13.8-11.3 18.5-30.3 11.4-46.7l-48-112C181.2 6.7 162.3-3.1 143.6 .9l-112 24C13.2 28.8 0 45.1 0 64v0C0 295.2 175.2 485.6 400.1 509.5c9.8 1 19.6 1.8 29.6 2.2c0 0 0 0 0 0c0 0 .1 0 .1 0c6.1 .2 12.1 .4 18.2 .4l0 0c18.9 0 35.2-13.2 39.1-31.6l24-112c4-18.7-5.8-37.6-23.4-45.1l-112-48zM441.5 464C225.8 460.5 51.5 286.2 48.1 70.5l99.2-21.3 43 100.4L154.4 179c-18.2 14.9-22.9 40.8-11.1 61.2c30.9 53.3 75.3 97.7 128.6 128.6c20.4 11.8 46.3 7.1 61.2-11.1l29.4-35.9 100.4 43L441.5 464zM48 64v0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0s0 0 0 0"/></svg><a href="tel:${telefono}">${telefono}</a></p>` : ''}
                </section>
                <section class="row">
                  <p class="fw-bold mt-3">Coordernadas del lugar: ${latitud}, ${longitud}</p>
                </section>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-sm btn-primary" data-bs-dismiss="modal">Cerrar</button>
              </div>
            </div>
          </div>
        </div>`;

    document.body.insertAdjacentHTML('beforeend', html);
  }

  renderPreview(data: any) {
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
      <div class="mt-2" style="text-align:justify; max-height: 15rem; overflow: hidden;">
          <span class="d-none d-md-inline">
            ${descripcion}
          </span>
      </div>
      <div class="d-grid gap-2 d-md-flex justify-content-md-end">
        <button id="createModal" class="btn btn-sm btn-primary mt-3 rounded-pill">Ver más detalles...</button>
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

    if(!$createModal) return;

    this.validateContent();
  }

  createRecomendations(data: any) {
    let newData = data.slice();
    let randomData = [];

    for(let i = 0; i < 5; i++){
      let random = Math.floor(Math.random() * newData.length);
      randomData.push(newData[random]);
      newData.splice(random, 1);
    }

    let html = '';

    randomData.forEach((e: any, idx) => {
      const { zona_arqueologica_id: id, zona_arqueologica_nombre: nombre, zones_description = {} } = e;
      const { img = '' } = zones_description;
      html += `
      <div class="col pb-5">
        <div class="card h-100" style="background-color: #00001e;">
            <h4 class="text-center bg-top rounded-pill mb-3" style="background-color: #ebcf1a">#${idx + 1}</h4>
            <button type="button" data-bs-toggle="modal" data-bs-target="#modal-recomendation-${id}" class="btn" href="">
              <img src="${img}" class="img-fluid" style="border-radius: 10px; min-height: 200px; max-height: 200px" alt="${nombre}">
            </button>
            <p class="fs-4 fw-bold mt-3 text-center">${nombre}</p>
        </div>
      </div>
      `;
      this.insertModal(e, { modalID: `modal-recomendation-${id}` });
    });

    const $recomendations = document.getElementById('zonas-recomendadas');

    if(!$recomendations) return;

    $recomendations.innerHTML = html;
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
