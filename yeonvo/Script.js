let carrito = [];

// MAPBOX GLOBALS
let mapa, marker;
let direccionTexto = "";
let ubicacion = {lat:null, lng:null};

function toggleCart(){
    document.getElementById("cart").classList.toggle("active");
}

function add(nombre, precio){
    carrito.push({nombre, precio});
    render();
}

function render(){
    let items = document.getElementById("items");
    items.innerHTML = "";
    let total = 0;

    carrito.forEach((item, i)=>{
        total += item.precio;
        items.innerHTML += `
        <div class="item">
            ${item.nombre} - $${item.precio}
            <button onclick="remove(${i})">❌</button>
        </div>`;
    });

    document.getElementById("total").innerText = total;
    document.getElementById("count").innerText = carrito.length;
}

function remove(i){
    carrito.splice(i,1);
    render();
}

function enviarPedido(){

    let nombre = document.getElementById("nombre").value;

    if(!direccionTexto){
        alert("Selecciona tu dirección en el mapa");
        return;
    }

    let texto = `🍣 Pedido YEO\n\n👤 Nombre: ${nombre}\n📍 Dirección: ${direccionTexto}\n\n`;

    carrito.forEach(item=>{
        texto += `• ${item.nombre} - $${item.precio}\n`;
    });

    texto += `\n💰 Total: $${document.getElementById("total").innerText}`;

    let url = `https://wa.me/523221234567?text=${encodeURIComponent(texto)}`;
    window.open(url, "_blank");
}

/* ===================== MAPBOX ===================== */

mapboxgl.accessToken = 'TU_TOKEN_AQUI';

function initMap(){

    mapa = new mapboxgl.Map({
        container:'map',
        style:'mapbox://styles/mapbox/dark-v11',
        center:[-105.2253,20.6534],
        zoom:13
    });

    marker = new mapboxgl.Marker({draggable:true})
        .setLngLat([-105.2253,20.6534])
        .addTo(mapa);

    const geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        marker:false,
        placeholder:"Escribe tu dirección...",
        countries:"mx",
        language:"es"
    });

    document.getElementById('geocoder').appendChild(geocoder.onAdd(mapa));

    // Selección de dirección
    geocoder.on('result', (e)=>{
        const coords = e.result.center;

        direccionTexto = e.result.place_name;
        ubicacion.lat = coords[1];
        ubicacion.lng = coords[0];

        marker.setLngLat(coords);
        mapa.flyTo({center:coords, zoom:15});

        document.getElementById("direccionConfirmada").innerText =
            "📍 Dirección: " + direccionTexto;
    });

    // Click en mapa
    mapa.on('click', (e)=>{
        ubicacion.lat = e.lngLat.lat;
        ubicacion.lng = e.lngLat.lng;

        marker.setLngLat(e.lngLat);
    });
}

initMap();