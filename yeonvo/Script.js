let carrito = [];

// ================= MAPBOX GLOBALS =================
let mapa;
let marker;

// 🔥 UBICACIÓN CORRECTA (IMPORTANTE)
let ubicacion = {
    lat: NaN,
    lng: NaN
};

let direccionTexto = "";
let direccionAuto = {};

mapboxgl.accessToken = 'pk.eyJ1IjoidGVsa2VycmFwIiwiYSI6ImNtb2puNW9rODAwYjUyb3BzZ3UzbnQ3NHAifQ.39JCFtAI5kr9I3-FSmmGmw';

// ================= CARRITO =================

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

// ================= WHATSAPP =================

function enviarPedido(){

    // 🔴 VALIDACIONES
    if(carrito.length === 0){
        alert("Agrega productos al carrito");
        return;
    }

    if(isNaN(ubicacion.lat) || isNaN(ubicacion.lng)){
        alert("Selecciona una ubicación en el mapa");
        return;
    }

    // 🧠 EVITAR ERRORES DE HTML
    let nombreInput = document.getElementById("nombre");
    let telefonoInput = document.getElementById("telefono");
    let refenciasInput = document.getElementById("refencias");

    if(!nombreInput || !telefonoInput){
        alert("Faltan campos en el HTML (nombre o teléfono)");
        return;
    }

    let nombre = nombreInput.value.trim();
    let telefono = telefonoInput.value.trim();
    let refencias = refenciasInputInput ? refenciasInputInput.value : "";

    if(!nombre || !telefono){
        alert("Completa nombre, teléfono y refencias");
        return;
    }

    // 🛒 PRODUCTOS
    let productosTexto = "";
    let total = 0;

    carrito.forEach(item => {
        productosTexto += `• 1x ${item.nombre} ($${item.precio})\n`;
        total += item.precio;
    });

    // 📍 UBICACIÓN
    let mapsLink = `https://www.google.com/maps/search/?api=1&query=${ubicacion.lat},${ubicacion.lng}`;

    // 🧠 DIRECCIÓN SEGURA
    let calle = direccionAuto?.calle || "No detectada";
    let colonia = direccionAuto?.colonia || "No detectada";
    let ciudad = direccionAuto?.ciudad || "No detectada";

    // 📩 MENSAJE
    let texto = `🏪 Sucursal: ${sucursal}

👤 Nombre: ${nombre}
📱 Teléfono: ${telefono}

----------------------

📍 Dirección
• Calle: ${calle}
• Colonia: ${colonia}
• Ciudad: ${ciudad}
• Ubicación: ${mapsLink}

----------------------

💵 Resumen
• Productos: $${total}
• Envío: Por definir
• Total: $${total}
• Pago: Transferencia

----------------------

🛒 Pedido
${productosTexto}`;

    let url = `https://wa.me/523222373809?text=${encodeURIComponent(texto)}`;

    // 🔥 ESTO SIEMPRE FUNCIONA
    window.open(url, "_blank");
}


// ================= MAPBOX =================

function initMap(){

    mapa = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [-105.2253, 20.6534],
        zoom: 13
    });

    marker = new mapboxgl.Marker({ draggable: true })
        .setLngLat([-105.2253, 20.6534])
        .addTo(mapa);

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

    // 🔍 BÚSQUEDA
    geocoder.on("result", (e) => {

        const coords = e.result.center;

        ubicacion = { lat: coords[1], lng: coords[0] };
        direccionTexto = e.result.place_name;

        marker.setLngLat(coords);
        mapa.flyTo({ center: coords, zoom: 15 });

        procesarDireccion(e.result);
        actualizarUI();
    });

    // 🖱 CLICK EN MAPA
    mapa.on("click", async (e) => {

        const lng = e.lngLat.lng;
        const lat = e.lngLat.lat;

        ubicacion = { lat, lng };
        marker.setLngLat([lng, lat]);

        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}`;

        try {
            const res = await fetch(url);
            const data = await res.json();

            let place = data.features?.[0];

            if(!place) return;

            direccionTexto = place.place_name;

            procesarDireccion(place);
            actualizarUI();

        } catch (err) {
            console.error("Error Mapbox:", err);
        }
    });
}

// ================= UI =================

function actualizarUI(){
    document.getElementById("direccionConfirmada").innerText =
        "📍 " + direccionTexto;
}

// ================= DIRECCIÓN =================

function procesarDireccion(place){

    let ctx = place?.context || [];

    direccionAuto = {
        calle: place?.text || "",
        colonia:
            ctx.find(c => c.id.includes("neighborhood"))?.text ||
            ctx.find(c => c.id.includes("locality"))?.text ||
            ctx.find(c => c.id.includes("place"))?.text ||
            "",
        ciudad:
            ctx.find(c => c.id.includes("place"))?.text ||
            ctx.find(c => c.id.includes("region"))?.text ||
            ""
    };
}

// ================= INICIO =================

window.addEventListener("DOMContentLoaded", initMap);
