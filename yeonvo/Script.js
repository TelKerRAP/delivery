let carrito = [];

// MAPBOX GLOBALS
let mapa;
let marker;
let direccionTexto = "";
let ubicacion = { lat: null, lng: null };

mapboxgl.accessToken = 'pk.eyJ1IjoidGVsa2VycmFwIiwiYSI6ImNtb2puNW9rODAwYjUyb3BzZ3UzbnQ3NHAifQ.39JCFtAI5kr9I3-FSmmGmw';

function toggleCart(){
    document.getElementById("cart").classList.toggle("active");
}

function add(nombre, precio){
    carrito.push({ nombre, precio });
    render();
}

function remove(i){
    carrito.splice(i, 1);
    render();
}

function render(){
    let items = document.getElementById("items");
    let total = 0;

    items.innerHTML = "";

    carrito.forEach((item, i) => {
        total += item.precio;

        items.innerHTML += `
        <div class="item">
            <span>${item.nombre} - $${item.precio}</span>
            <button onclick="remove(${i})">❌</button>
        </div>`;
    });

    document.getElementById("total").innerText = total;
    document.getElementById("count").innerText = carrito.length;
}
function formatearDireccion(placeName){
    let partes = placeName.split(",");

    return {
        calle: partes[0] || "",
        colonia: partes[1] || "",
        ciudad: partes[2] || ""
    };
}

function enviarPedido(){

    let dir = formatearDireccion(direccionTexto);

    let nombre = document.getElementById("nombre").value;
    let telefono = document.getElementById("telefono").value;

    let sucursal = document.getElementById("sucursal").value;

    // Inputs manuales (fallback si el usuario los llena)
    let calleManual = document.getElementById("calle")?.value || "";
    let numero = document.getElementById("numero")?.value || "";
    let coloniaManual = document.getElementById("colonia")?.value || "";
    let referencias = document.getElementById("referencias")?.value || "";

    if(carrito.length === 0){
        alert("Agrega productos al carrito");
        return;
    }

    if(!nombre || !telefono){
        alert("Completa nombre y teléfono");
        return;
    }

    let productosTexto = "";
    let total = 0;

    carrito.forEach(item => {
        productosTexto += `*1x* ${item.nombre} ($${item.precio})\n\n`;
        total += item.precio;
    });

    // 🧠 usa Mapbox si existe, si no usa manual
    let calleFinal = dir.calle || calleManual;
    let coloniaFinal = dir.colonia || coloniaManual;

    let texto = `
Sucursal ${sucursal}

*Nombre:* ${nombre}
*Celular:* ${telefono}

---
📍 Dirección
* *Calle:* ${calleFinal}
* *Número:* ${numero}
* *Colonia:* ${coloniaFinal}
* *Referencias:* ${referencias}
* *Ubicación:* https://www.google.com/maps/search/?api=1&query=${ubicacion.lat},${ubicacion.lng}

---
💵 Resumen
* *Productos:* $${total}
* *Envío:* 🚨 Por definir 🚨
* *Total a pagar:* $${total} + envío
* Cliente pagará en TRANSFERENCIA

---
📋 Pedido
${productosTexto}
`;

    let url = `https://wa.me/523222373809?text=${encodeURIComponent(texto)}`;

    window.open(url, "_blank");
}

/* ================= MAPBOX ================= */

function initMap(){

    mapa = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [-105.2253, 20.6534], // Nuevo Vallarta
        zoom: 13
    });

    marker = new mapboxgl.Marker({ draggable: true })
        .setLngLat([-105.2253, 20.6534])
        .addTo(mapa);

    // GEOCODER
    const geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        marker: false,
        placeholder: "Escribe tu dirección...",
        countries: "mx",
        language: "es"
    });

    document.getElementById("geocoder").appendChild(
        geocoder.onAdd(mapa)
    );

    // CUANDO BUSCAN DIRECCIÓN
    geocoder.on("result", (e) => {

        const coords = e.result.center;

        direccionTexto = e.result.place_name;

        ubicacion = {
            lat: coords[1],
            lng: coords[0]
        };

        marker.setLngLat(coords);
        mapa.flyTo({ center: coords, zoom: 15 });

        document.getElementById("direccionConfirmada").innerText =
            "📍 " + direccionTexto;
    });

    // CLICK EN MAPA
    mapa.on("click", async (e) => {

        const lng = e.lngLat.lng;
        const lat = e.lngLat.lat;

        marker.setLngLat([lng, lat]);

        ubicacion = { lat, lng };

        // 🔥 REVERSE GEOCODING (obtiene dirección real)
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}`;

        try {
            const res = await fetch(url);
            const data = await res.json();

            direccionTexto = data.features[0]?.place_name || "Dirección no encontrada";

            document.getElementById("direccionConfirmada").innerText =
                "📍 " + direccionTexto;

        } catch (error) {
            console.error("Error obteniendo dirección:", error);
        }
    });
}

/* ================= INICIO SEGURO ================= */

window.addEventListener("DOMContentLoaded", () => {
    initMap();
});
