const { app, upload, PAYU_API_URL , API_KEY ,MERCHAN_ID,ACCOUNT_ID ,API_LOGIN } = require('./config');
const db = require('./db');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const axios = require('axios');
const crypto = require('crypto-js');

// Me permite recibir peticiones externas.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Milddleware para proteger rutas
function isAthenticated(req, res, next) {
    if (req.session.usuario) {
        return next();
    } else {
        res.redirect('/login');
    }
}

// Ruta para destruir sesion
app.get('/logout', (req, res) => {
    req.session.destroy((e) => {
        if (e) {
            console.log(e);
            return res.status(500).send('Error al cerrar sesion');
        }
        res.redirect('/login');
    });
});

// Rutas de las url
app.get('/', (req, res) =>{
    const cartCount = req.session.cart ? req.session.cart.length : 0;
    const productoQuery = 'SELECT * FROM productos WHERE categoria_id = 2';
    const juegosQuery = 'SELECT * FROM productos WHERE categoria_id = 1';
    db.query(productoQuery, (err, productos) => {
        if(err){
           console.err('Error al obtener los Accesorios', err);
           return res.status(500).send('Error al obtener los Accesorios'); 
        }

        db.query(juegosQuery, (err, juegos) => {
            if(err){
                console.err('Error al obtener los productos de la categoria juegos', err);
                return res.status(500).send('Error al obtener los productos de la categoria juegos'); 
             }
            res.render('index', { productos, cartCount, juegos });
        });
    });
});
// Ruta de logueo
app.get('/login', (req, res) => {
    res.render('login');
});

// Ruta de registro
app.get('/registro', (req, res) => {
    res.render('registro');
});

// Crear la ruta de registro de usuario
app.post('/registro', async (req, res) => {
    const { nombre, apellido, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query('INSERT INTO usuarios (nombre, apellidos, email, password) VALUES (?, ?, ?, ?)', [nombre, apellido, email, hashedPassword], (err, result) => {
        if (err) {
            console.log(err);
            res.send('Error al registrar usuario');
        } else {
            console.log(result);
            res.redirect('login');
        }
    });
});

// Ruta y logica de inicio de sesion
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.query('SELECT * FROM usuarios WHERE email = ?', [email], async (err, result) => {
        if (err) {
            console.log(err);
            res.send('Error al iniciar sesion');
        } else {
            if (result.length > 0) {
                const usuario = result[0];
                if (await bcrypt.compare(password, usuario.password)) {
                    req.session.usuario = usuario;
                    res.redirect('/admin');
                } else {
                    res.send('Credenciales incorrectas');
                }
            } else {
                res.send('Usuario no encontrado o no esta activo');
            }
        }
    });
});

// Ruta de logueo
app.get('/admin', isAthenticated, (req, res) => {
    const cartCount = req.session.cart ? req.session.cart.length : 0;
    const query = 'SELECT * FROM productos';
    db.query(query, (err, result) => {
        if(err){
           console.err('Error al obtener los productos', err);
           return res.status(500).send('Error al obtener los productos'); 
        }
        res.render('admin', { productos: result, cartCount });
    });
});

// Ruta de categorias 
app.get('/categorias', isAthenticated, (req, res) => {
    const cartCount = req.session.cart ? req.session.cart.length : 0;
    res.render('categorias', { cartCount });
});

// Ruta de creacion decategorias POSTMAN
app.post('/categorias', (req, res) => {
    console.log('Solicitud: ', req.body);
    const { nombre, descripcion } = req.body;

    db.query('INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)', [nombre, descripcion], (err, result) => {
        if (err) {
            console.log(err);
            res.send('Error al insertar categoria');
        } else {
            console.log(result);
            res.send('categoria insertada con exito!');
        }
    });
});

// Ruta de productos con categorias  POSTMAN
app.get('/productos', isAthenticated, (req, res) => {
    const cartCount = req.session.cart ? req.session.cart.length : 0;
    const query = 'SELECT * FROM categorias';
    db.query(query, (err, result) => {
        if (err) {
            console.err('Error al obtener las categorias de productos', err);
            return res.status(500).send('Error al obtener las categorias de productos');
        }
        res.render('productos', { categorias: result, cartCount });
    });
});

// Ruta para cargar los productos
app.post('/productos', isAthenticated, upload.single('imagen'), (req, res) => {
    // recibir lo que viene por url 
    const { nombre, descripcion, precio, stock, categoria } = req.body;
    // recibir el nombre de la imagen en la bd 
    const imagenNombre = req.file.filename;
    // validar en donde queda almanenada la imagen 
    const imagenURL = `${req.protocol}://${req.get('host')}/uploads/${imagenNombre}`;


    const query = 'INSERT INTO productos (nombre, descripcion, precio, stock, categoria_id, imagen_url) VALUES (?, ?, ?, ?, ?, ?)';
    const values = [nombre, descripcion, precio, stock, categoria, imagenURL];

    db.query(query, values, (err, result) => {
        if (err) {
            console.log('Error al guardar el producto:', err);
            return res.status(500).send('Error al guardar el producto');
        }
        res.redirect('/listar-productos');
        // res.send('Producto guardado exitosamente');
    });
});

// Ruta listar productos
app.get('/listar-productos', isAthenticated, (req, res) => {
    const cartCount = req.session.cart ? req.session.cart.length : 0;
    const query = 'SELECT productos.nombre AS nom_producto, categorias.nombre AS nom_categoria, productos.descripcion, productos.precio, productos.stock, productos.imagen_url  FROM productos JOIN categorias ON productos.categoria_id = categorias.id';
    db.query(query, (err, result) => {
        if(err){
           console.err('Error al obtener las productos', err);
           return res.status(500).send('Error al obtener los productos'); 
        }
        res.render('listar-productos', { productos: result, cartCount });
    });
});

// Ruta para agregar productos al carrito
app.post('/add-to-cart', (req, res) => {
    const { productoId } = req.body;

    if (!req.session.cart) {
        req.session.cart = [];
    }

    const existingProductIndex = req.session.cart.findIndex(item => item.id == productoId);

    if (existingProductIndex > -1) {
        req.session.cart[existingProductIndex].cantidad += 1;
        const cartCount = req.session.cart.reduce((sum, item) => sum + item.cantidad, 0);
        res.json({ message: 'Cantidad actualizada en el carrito', cartCount: cartCount });
    } else {
        db.query('SELECT * FROM productos WHERE id = ?', [productoId], (err, result) => {
            if (err) {
                console.log('Error al obtener el producto:', err);
                return res.status(500).json({ error: 'Error al agregar al carrito' });
            }

            if (result.length > 0) {
                const producto = result[0];
                producto.cantidad = 1;
                req.session.cart.push(producto);
                const cartCount = req.session.cart.reduce((sum, item) => sum + item.cantidad, 0);
                res.json({ message: 'Producto agregado al carrito', cartCount: cartCount });
            } else {
                res.status(404).json({ error: 'Producto no encontrado' });
            }
        });
    }
});

// Ruta checkout de productos
app.get('/checkout', isAthenticated, (req, res) => {
    const cart = req.session.cart || [];
    console.log('Carrito:', cart);
    const total = cart.reduce((sum, item) => sum + item.precio * item.cantidad, 0);

    res.render('checkout', { cart, total });
});

// Ruta para procesar el pago
app.post('/procesar-compra', isAthenticated, (req, res) => {
    const cart = req.session.cart; //Esta es una propiedad que se utiliza para almacenar datos.
    const userId = req.session.usuario.id;

    if (!cart || cart.length === 0) {
        return res.status(400).send('El carrito esta vacio.');
    }

    const total = cart.reduce((sum, item) => sum + item.precio * item.cantidad, 0);

    const orderQuery = 'INSERT INTO ordenes (usuario_id, total) VALUES (?, ?)';
    db.query(orderQuery, [userId, total], (err, result) => {
        if (err) {
            console.log('Error al crear la orden:', err);
            return res.status(500).send('Error al procesar la compra.');
        }

        const orderId = result.insertId;

        const orderItemsQuery = 'INSERT INTO orden_items (orden_id, producto_id, cantidad, precio) VALUES ?';
        const orderItems = cart.map(item => [orderId, item.id, item.cantidad, item.precio]);

        db.query(orderItemsQuery, [orderItems], (err, result) => {
            if (err) {
                console.log('Error al guardar los productos de la orden:', err);
                return res.status(500).send('Error al procesar la compra');
            }
            req.session.cart = [];
            res.redirect(`/confirmacion-compra?ordenId=${orderId}`);
        });
    });
});

// Ruta para confirmar compra
app.get('/confirmacion-compra', (req, res) => {
    const { ordenId } = req.query;
    res.render('confirmacion-compra', { ordenId });
});

// Ruta listar ordenes pednientes 
app.get('/list-ordenes', isAthenticated, (req, res) => {
    const cartCount = req.session.cart ? req.session.cart.length : 0;
    const query = 'SELECT  usuarios.nombre AS user_nom, usuarios.apellidos AS user_ape ,ordenes.id,ordenes.total , ordenes.estado, ordenes.created_at  FROM  ordenes JOIN usuarios On ordenes.id = usuarios.id WHERE ordenes.estado = "Pendiente" ';
    db.query(query, (err, result) => {
        if (err) {
            console.err('Error al obtener las ordenes', err);
            return res.status(500).send('Error al obtener las ordenes');
        }
        res.render('list-ordenes', { ordenes: result, cartCount });
    });
});

// Ruta PARA PROCESAR PAGOS 
//    const cart = req.session.cart || [];
//    const userID = req.session.id;

//    if (cart.length === 0 ) {
    
//     return res.status(400).send('Error procesar pago el Carrito esta vacio ');
// };

// const referenceCode = `order_${Date.now()}` ;
// const total = cart.reduce((sum, item) = sum + item.precio * item.cantidad, 0);

// const signatureString = `${API_KEY}~${MERCHAN_ID}~${referenceCode}~${total}~COP`;
// const signature = crypto.MD5(signatureString).toString();

// const paymentData{
//         test:11,
//         language: 'es',
//         command: 'SUBMIT_TRANSACTION',
//         merchant: {
//             apiLogin: API_LOGIN,
//             apikey: API_KEY
//         },
//         transaction: {
//             order: {
//                 accountId: ACCOUNT_ID,
//                 referenceCode: referenceCode,
//                 description: 'compra en mi tienda Gammer',
//                 language: 'es',
//                 signature: signature,
//                 notifyUrl: 'http://localhost:3000/confirmacion',
//                 additionalValues:{
//                     TX_VALUE:{
//                         value: total,
//                         currency: 'COP'
//                     }
//                 },
//                 buyer: {
//                     emailAddress: req.session.usuario.email
//                 }

//             },

//             payer: {
//                 emailAddress: req.session.usuario.email
//             },
//             type: 'AUTHORIZATION_AND_CAPTURE',
//             paymetMethod: 'VISA',
//             paymentCountry: 'CO'

//         }
// };

module.exports = app;