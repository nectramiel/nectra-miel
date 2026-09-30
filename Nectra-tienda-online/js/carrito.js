
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

let articulosCarrito = [];
let toastTimeout;

// Registrar Event Listeners
cargarEventListeners();

function cargarEventListeners() {
    // 1. Agregar producto al hacer click en "Agregar al carrito"
    listaProductos.addEventListener('click', agregarProducto);

    // 2. Eliminar o modificar cantidades dentro del carrito
    carrito.addEventListener('click', manejarAccionesCarrito);
    carrito.addEventListener('change', cambiarCantidadProducto);

    // 3. Toggle/Desplegar carrito al pulsar el icono
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

    // 4. Vaciar Carrito
    btnVaciarCarrito.addEventListener('click', vaciarCarrito);

    // 5. Finalizar Compra
    btnProcesarPedido.addEventListener('click', procesarPedido);

    // 6. Cargar datos del LocalStorage al iniciar
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
        // Actualizamos la cantidad acumulada
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
}

// Función: Simular procesamiento de compra
function procesarPedido(e) {
    e.preventDefault();
    if (articulosCarrito.length === 0) {
        mostrarToast('El carrito está vacío');
        return;
    }

    mostrarToast('¡Gracias por tu compra en Nectra!');
    articulosCarrito = [];
    actualizarHTMLCarrito();
    carrito.classList.remove('active');
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
