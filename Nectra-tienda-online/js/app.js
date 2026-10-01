
// Variables globales
const carrito = document.getElementById('carrito');
const listaProductos = document.getElementById('Lista-1');
const contenedorCarrito = document.querySelector('#lista-carrito tbody');
const btnVaciarCarrito = document.getElementById('vaciar-carrito');
const btnProcesarPedido = document.getElementById('procesar-pedido');
const iconoCarrito = document.getElementById('icono-carrito-trigger');
const cartBadge = document.getElementById('cart-badge');
const cartTotalDisplay = document.getElementById('cart-total');
const emptyCartMsg = document.getElementById('empty-cart-msg');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');
const carritoContenedor = document.querySelector('#carrito');
// Elementos del Buscador
const inputBusqueda = document.getElementById('input-busqueda');
const btnBuscar = document.getElementById('btn-buscar');
const seccionProductos = document.getElementById('productos');

let articulosCarrito = [];
let toastTimeout;

cargarEventListeners();

function cargarEventListeners() {
    // Agregar producto al hacer click en "Agregar al carrito"
    listaProductos.addEventListener('click', agregarProducto);

    // Eliminar o modificar cantidades dentro del carrito
    carrito.addEventListener('click', manejarAccionesCarrito);
    carrito.addEventListener('change', cambiarCantidadProducto);

    //Desplegar carrito al pulsar el icono
    iconoCarrito.addEventListener('click', (e) => {
        e.stopPropagation();
        carrito.classList.toggle('active');
    });

    // Evitar que el clic dentro del desplegable cierre el carrito
    carrito.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Cerrar el carrito al hacer clic fuera
    document.addEventListener('click', () => {
        carrito.classList.remove('active');
    });

    // Vaciar Carrito
    btnVaciarCarrito.addEventListener('click', vaciarCarrito);

    // Finalizar Compra
    btnProcesarPedido.addEventListener('click', procesarPedido);

    // Cargar datos del LocalStorage al iniciar
    document.addEventListener('DOMContentLoaded', () => {
        articulosCarrito = JSON.parse(localStorage.getItem('cart_nectra')) || [];
        actualizarHTMLCarrito();
    });
}

// Función: Capturar evento de botón "Agregar al carrito"
function agregarProducto(e) {
    e.preventDefault();
    if (e.target.classList.contains('agregar-carrito')) {
        const productoSeleccionado = e.target.closest('.box');
        leerDatosProducto(productoSeleccionado);
    }
}

// Función: Extraer información del producto del DOM
function leerDatosProducto(producto) {
    const infoProducto = {
        imagen: producto.querySelector('img').src,
        titulo: producto.querySelector('h3').textContent,
        precio: producto.querySelector('.Precio').textContent,
        id: producto.getAttribute('data-id'),
        cantidad: 1
    };

    // Verificar si el elemento ya existe en el carrito
    const existe = articulosCarrito.some(prod => prod.id === infoProducto.id);

    if (existe) {
        // Actualiza la cantidad acumulada
        articulosCarrito = articulosCarrito.map(prod => {
            if (prod.id === infoProducto.id) {
                prod.cantidad++;
                return prod;
            } else {
                return prod;
            }
        });
    } else {
        // Agregamos nuevo producto al carrito
        articulosCarrito = [...articulosCarrito, infoProducto];
    }

    actualizarHTMLCarrito();
    mostrarToast(`¡${infoProducto.titulo} agregado al carrito!`);
}

// Función: Renderizar elementos del carrito en el HTML
function actualizarHTMLCarrito() {
    // Limpiar HTML
    limpiarHTML();

    if (articulosCarrito.length === 0) {
        emptyCartMsg.style.display = 'block';
    } else {
        emptyCartMsg.style.display = 'none';
    }

    let totalAcumulado = 0;
    let totalUnidades = 0;

    // Recorrer el arreglo para generar las filas de la tabla
    articulosCarrito.forEach(producto => {
        const { imagen, titulo, precio, cantidad, id } = producto;
        const precioNum = parseFloat(precio.replace('$', ''));
        const subtotal = precioNum * cantidad;

        totalAcumulado += subtotal;
        totalUnidades += cantidad;

        const row = document.createElement('tr');
        row.innerHTML = `
                    <td>
                        <img src="${imagen}" class="cart-img" alt="${titulo}">
                    </td>
                    <td><strong style="font-size: 13px;">${titulo}</strong></td>
                    <td style="color: var(--primary-amber); font-weight: 600;">${precio}</td>
                    <td>
                        <input type="number" min="1" class="cart-qty-input" data-id="${id}" value="${cantidad}">
                    </td>
                    <td>
                        <a href="#" class="borrar-producto" data-id="${id}">×</a>
                    </td>
                `;

        contenedorCarrito.appendChild(row);
    });

    // Actualizar Badge y Total
    cartBadge.textContent = totalUnidades;
    cartTotalDisplay.textContent = `$${totalAcumulado.toFixed(2)}`;

    // Guardar en LocalStorage
    sincronizarStorage();
}

// Función: Manejar clics internos en el carrito (eliminar producto)
function manejarAccionesCarrito(e) {
    e.preventDefault();
    if (e.target.classList.contains('borrar-producto')) {
        const productoId = e.target.getAttribute('data-id');
        articulosCarrito = articulosCarrito.filter(prod => prod.id !== productoId);
        actualizarHTMLCarrito();
    }
}

// Función: Actualizar cantidad desde el input numérico
function cambiarCantidadProducto(e) {
    if (e.target.classList.contains('cart-qty-input')) {
        const productoId = e.target.getAttribute('data-id');
        const nuevaCantidad = parseInt(e.target.value);

        if (isNaN(nuevaCantidad) || nuevaCantidad <= 0) {
            e.target.value = 1;
            return;
        }

        articulosCarrito = articulosCarrito.map(prod => {
            if (prod.id === productoId) {
                prod.cantidad = nuevaCantidad;
            }
            return prod;
        });

        actualizarHTMLCarrito();
    }
}

// Función: Vaciar totalmente el carrito
function vaciarCarrito(e) {
    if (e) e.preventDefault();
    if (articulosCarrito.length === 0) return;

    articulosCarrito = [];
    actualizarHTMLCarrito();
    mostrarToast('El carrito se ha vaciado');
    if (carritoContenedor) {
        carritoContenedor.classList.remove('active'); //Oculta el carrito
    }
}

//Procesamiento y envío de correo
async function procesarPedido() {

    if (articulosCarrito.length === 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Carrito vacío',
            text: 'Agrega productos antes de finalizar tu compra.',
            confirmButtonColor: '#e67e22'
        });
        return;
    }

    if (carritoContenedor) {
        carritoContenedor.classList.remove('active');
    }

    //Pedir Nombre
    const { value: nombreCliente } = await Swal.fire({
        title: 'Finalizar Compra 🍯',
        text: 'Ingresa tu nombre completo:',
        input: 'text',
        inputPlaceholder: 'Ej. Juan Pérez',
        showCancelButton: true,
        confirmButtonText: 'Siguiente',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#e67e22',
        cancelButtonColor: '#7f8c8d',
        inputValidator: (value) => {
            if (!value || !value.trim()) {
                return 'Debes ingresar tu nombre completo';
            }
        }
    });

    if (!nombreCliente) return;

    // Pedir Correo
    const { value: correoCliente } = await Swal.fire({
        title: 'Confirmación de Envío',
        text: 'Ingresa tu correo para enviarte el resumen:',
        input: 'email',
        inputPlaceholder: 'ejemplo@correo.com',
        showCancelButton: true,
        confirmButtonText: 'Enviar Pedido',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#e67e22',
        cancelButtonColor: '#7f8c8d',
        inputValidator: (value) => {
            const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!value || !regexEmail.test(value.trim())) {
                return 'Ingresa un correo electrónico válido';
            }
        }
    });

    if (!correoCliente) return;

    // Armar el resumen del pedido
    let detalleProductos = "";
    let total = 0;

    articulosCarrito.forEach((prod, index) => {
        const precioNum = parseFloat(prod.precio.replace('$', ''));
        const subtotal = precioNum * prod.cantidad;
        total += subtotal;
        detalleProductos += `• ${prod.titulo}(Precio ${prod.precio})  Cant: ${prod.cantidad} — $${subtotal.toFixed(2)}\n`;
    });

    const templateParams = {
        to_name: nombreCliente.trim(),
        to_email: correoCliente.trim(),
        order_details: detalleProductos,
        total_price: `$${total.toFixed(2)}`
    };

    // Modal de carga
    Swal.fire({
        title: 'Procesando pedido...',
        text: 'Enviando comprobante a tu correo',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    // Envío con EmailJS 
    emailjs.send('service_j21geue', 'template_bu3wbf8', templateParams)
        .then(function (response) {
            Swal.fire({
                icon: 'success',
                title: '¡Pedido enviado!',
                text: `Gracias ${nombreCliente}, hemos enviado el resumen a ${correoCliente}`,
                confirmButtonColor: '#e67e22'
            });
            articulosCarrito = [];
            actualizarHTMLCarrito();
        }, function (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error de envío',
                text: 'No se pudo enviar el correo. Revisa la configuración.',
                confirmButtonColor: '#e67e22'
            });
            console.error('EmailJS Error:', error);
        });
}

// Limpiar el HTML del tbody
function limpiarHTML() {
    while (contenedorCarrito.firstChild) {
        contenedorCarrito.removeChild(contenedorCarrito.firstChild);
    }
}

// Persistencia en LocalStorage
function sincronizarStorage() {
    localStorage.setItem('cart_nectra', JSON.stringify(articulosCarrito));
}

// Notificación flotante (Toast)
function mostrarToast(mensaje) {
    clearTimeout(toastTimeout);
    toastMessage.textContent = mensaje;
    toast.classList.add('show');

    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// --- FUNCIONALIDAD DEL BUSCADOR CON DESPLAZAMIENTO AUTOMÁTICO ---
function filtrarProductos() {
    const textoBusqueda = inputBusqueda.value.toLowerCase().trim();
    const tarjetasProductos = document.querySelectorAll('#Lista-1 .box');
    let productosEncontrados = 0;

    tarjetasProductos.forEach(tarjeta => {
        const titulo = tarjeta.querySelector('h3').textContent.toLowerCase();
        const descripcion = tarjeta.querySelector('p').textContent.toLowerCase();

        // Verificar si el texto ingresado coincide con el título o descripción
        if (titulo.includes(textoBusqueda) || descripcion.includes(textoBusqueda)) {
            tarjeta.style.display = 'block';
            productosEncontrados++;
        } else {
            tarjeta.style.display = 'none';
        }
    });

    // Si el usuario ha escrito al menos un carácter, hacer desplazamiento suave a la sección de productos
    if (textoBusqueda.length > 0) {
        seccionProductos.scrollIntoView({ behavior: 'smooth' });
    }
}

// Eventos del buscador
if (inputBusqueda) {
    // Filtrar mientras el usuario escribe en tiempo real
    inputBusqueda.addEventListener('keyup', filtrarProductos);

    // Desplazar al hacer foco o presionar Enter
    inputBusqueda.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            filtrarProductos();
        }
    });
}

if (btnBuscar) {
    btnBuscar.addEventListener('click', () => {
        filtrarProductos();
        seccionProductos.scrollIntoView({ behavior: 'smooth' });
    });
}


function mostrarNotificacion(mensaje) {
    if (!toast || !toastMessage) return;
    toastMessage.textContent = mensaje;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}